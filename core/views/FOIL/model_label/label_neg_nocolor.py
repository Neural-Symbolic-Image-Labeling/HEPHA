import re,copy
def get_total_list1(dict_list):
    total_object=[]
    total_list=[]
    for image_num in range(len(dict_list)):
        for objects_num in range(len(dict_list[image_num]['object_detect']['object'])):
            name=dict_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            if name not in total_object:
                total_object.append(name)
        for objects_num in range(len(dict_list[image_num]['panoptic_segmentation'])):
            name=dict_list[image_num]['panoptic_segmentation'][str(objects_num)]['name']
            if name not in total_object:
                total_object.append(name)
    for image_num in range(len(dict_list)):
        image_list=[]
        position_list=[]
        position_list1=[]
        name_list=[]
        if not 'overlap' in dict_list[image_num]['object_detect']:
            dict_list[image_num]['object_detect']['overlap'] = {}
        if not 'panoptic_segmentation' in dict_list[image_num]:
            dict_list[image_num]['panoptic_segmentation'] = {}
        for objects_num in range(len(dict_list[image_num]['object_detect']['object'])):
            name=dict_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            if position not in position_list:
                position_list.append(position)
                name_list.append(name)
        for objects_num in range(len(dict_list[image_num]['panoptic_segmentation'])):
            name=dict_list[image_num]['panoptic_segmentation'][str(objects_num)]['name']
            position=total_object.index(name)
            if position not in position_list1:
                position_list1.append(position)
        object_numbers=[0 for i in range(len(position_list))]
        for objects_num in range(len(dict_list[image_num]['object_detect']['object'])):
            name=dict_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            object_numbers[position_list.index(position)]+=1
        for index,objects in enumerate(position_list):
            has=total_object[objects]+"(image"+str(dict_list[image_num]['imageId'])+","+str(objects)+")"
            num="num"+"("+str(objects)+","+str(object_numbers[index])+")"
            image_list.append(has)
            image_list.append(num)
        for index,objects in enumerate(position_list1):
            has=total_object[objects]+"(image"+str(dict_list[image_num]['imageId'])+","+str(objects)+")"
            area="area"+"("+str(objects)+","+str(dict_list[image_num]['panoptic_segmentation'][str(index)]['area'])+")"
            image_list.append(has)
            image_list.append(area)
        for index,objects in enumerate(total_object):
            if (index not in position_list) and (index not in position_list1):
                not_has="¬"+objects+"(image"+str(dict_list[image_num]['imageId'])+","+str(index)+")"
                image_list.append(not_has)
        for objects_num in range(len(dict_list[image_num]['object_detect']['overlap'])):
            object1_name=dict_list[image_num]['object_detect']['object'][str(dict_list[image_num]['object_detect']['overlap'][str(objects_num)]["idA"])]['name']
            object2_name=dict_list[image_num]['object_detect']['object'][str(dict_list[image_num]['object_detect']['overlap'][str(objects_num)]["idB"])]['name']
            position1=total_object.index(object1_name)
            position2=total_object.index(object2_name)
            if position1<position2:
                overlap="overlap("+str(position1)+","+str(position2)+")"
            else:
                overlap="overlap("+str(position2)+","+str(position1)+")"
            if overlap not in image_list:
                image_list.append(overlap)
        total_list.append(image_list)
    return total_list

def get_total_list(total_list1):
    total_list=[]
    for image in total_list1:
        list=[]
        for clauses in image:
            a=re.split(r'[(|,|)]',clauses)
            if a[0]!='overlap' and a[0]!='num' and a[0]!='area':
                sub=a[1]
                break
        for clauses in image:
            a=re.split(r'[¬|(|,|)]',clauses)
            if a[1]==sub:
                a[1]="X"
                if len(a)==3:
                    result=a[0]+"("+a[1]+")"+a[2]
                else:
                    result=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                list.append(result)
            elif a[2]==sub:
                a[2]="X"
                result="¬"+a[1]+"("+a[2]+","+a[3]+")"+a[4]
                list.append(result)
            else:
                result=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                list.append(result)
        total_list.append(list)
    return total_list

def labeling(total_list,rules):
    labels=[]
    possible_labels=[]
    for possible_label in rules.keys():
        possible_labels.append(possible_label)
    #print(possible_labels)
    #print(rules)
    for image in total_list:
        label_list=[]
        find=False
        satisfy_clause_num_list=[]
        for possible_label in possible_labels:
            rule_list=rules[possible_label]
            #print(rule_list)
            satisfy=["False" for i in range(len(rule_list))]
            satisfy_clause_num = 0
            for rule_num,rule in enumerate(rule_list):
                satisfy_list=["False" for i in range(len(rule))]
                object_in_rule=[]
                object_character=[]
                for position,clauses in enumerate(rule):
                    a=re.split(r'[¬|(|,|)]',clauses)
                    #print(a[0])
                    if len(a)==5:
                        for predicate in image:
                            b=re.split(r'[¬|(|,|)]',predicate)
                            if b[1]==a[1]:
                                satisfy_list[position]="True"
                                break
                    elif a[0]!='overlap' and a[0]!='num' and a[0]!='area' and a[0]!='color' and len(a)==4:
                        object_in_rule.append(a[0])
                        object_character.append(a[2])
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]==a[0]:
                                satisfy_list[position]="True"
                                break
                    elif a[0]=='overlap':
                        object_in_image=[]
                        object_number=[]
                        object1_in_rule=object_in_rule[object_character.index(a[1])]
                        object2_in_rule=object_in_rule[object_character.index(a[2])]
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]!='overlap' and b[0]!='num' and b[0]!='area':
                                object_in_image.append(b[0])
                                object_number.append(b[2])
                            if b[0]==a[0]:
                                object1_in_image=object_in_image[object_number.index(b[1])]
                                object2_in_image=object_in_image[object_number.index(b[2])]
                                if object1_in_image==object1_in_rule and object2_in_image==object2_in_rule:
                                    satisfy_list[position]="True"
                                    break
                    elif a[0]=='num' or a[0]=='area':
                        object_in_image=[]
                        object_number=[]
                        object1_in_rule=object_in_rule[object_character.index(a[1])]
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]!='overlap' and b[0]!='num' and b[0]!='area':
                                object_in_image.append(b[0])
                                object_number.append(b[2])
                            if b[0]==a[0]:
                                object1_in_image=object_in_image[object_number.index(b[1])]
                                c=re.split(r'[<]',rule[position+1])
                                if len(c)!=1:
                                    maxi=float(c[1])
                                    if object1_in_image==object1_in_rule and float(b[2])<=maxi:
                                        satisfy_list[position]="True"
                                        break
                                else:
                                    c=re.split(r'[>]',rule[position+1])
                                    mini=float(c[1])
                                    if object1_in_image==object1_in_rule and mini<float(b[2]):
                                        satisfy_list[position]="True"
                                        break
                #print(satisfy_list)
                if "False" not in satisfy_list:
                    satisfy[rule_num]="True"
            for i in satisfy:
                if i == "True":
                    satisfy_clause_num += 1
            if satisfy_clause_num != 0:
                satisfy_clause_num_list.append(satisfy_clause_num)
            if "True" in satisfy:
                label=re.split(r'[(|,|)]',possible_label)
                label_list.append(label[0])
                find=True
        if find==False:
            label_list.append("None")
        if len(label_list) > 1:
            label_list=[label_list[satisfy_clause_num_list.index(max(satisfy_clause_num_list))]]
        labels.append(label_list)
    return labels

def AL(total_list,rules):
    possible_labels=[]
    result=[]
    for possible_label in rules.keys():
        possible_labels.append(possible_label)
    for image in total_list:
        image_ratio=[]
        for possible_label in possible_labels:
            rule_list=rules[possible_label]
            ratio_list=[]
            for rule_num,rule in enumerate(rule_list):
                object_in_rule=[]
                object_character=[]
                rule_length=len(rule)
                satisfy_number=0
                for position,clauses in enumerate(rule):
                    a=re.split(r'[¬|(|,|)]',clauses)
                    if len(a)==5:
                        for predicate in image:
                            b=re.split(r'[¬|(|,|)]',predicate)
                            if b[1]==a[1]:
                                satisfy_number+=1
                                break
                    elif a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4:
                        object_in_rule.append(a[0])
                        object_character.append(a[2])
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]==a[0]:
                                satisfy_number+=1
                                break
                    elif a[0]=='overlap':
                        object_in_image=[]
                        object_number=[]
                        object1_in_rule=object_in_rule[object_character.index(a[1])]
                        object2_in_rule=object_in_rule[object_character.index(a[2])]
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]!='overlap' and b[0]!='num' and b[0]!='area':
                                object_in_image.append(b[0])
                                object_number.append(b[2])
                            if b[0]==a[0]:
                                object1_in_image=object_in_image[object_number.index(b[1])]
                                object2_in_image=object_in_image[object_number.index(b[2])]
                                if object1_in_image==object1_in_rule and object2_in_image==object2_in_rule:
                                    satisfy_number+=1
                                    break
                    elif a[0]=='num' or a[0]=='area':
                        object_in_image=[]
                        object_number=[]
                        object1_in_rule=object_in_rule[object_character.index(a[1])]
                        for predicate in image:
                            b=re.split(r'[(|,|)]',predicate)
                            if b[0]!='overlap' and b[0]!='num' and b[0]!='area':
                                object_in_image.append(b[0])
                                object_number.append(b[2])
                            if b[0]==a[0]:
                                object1_in_image=object_in_image[object_number.index(b[1])]
                                c=re.split(r'[<]',rule[position+1])
                                if len(c)!=1:
                                    maxi=float(c[1])
                                    if object1_in_image==object1_in_rule and float(b[2])<=maxi:
                                        satisfy_number+=1
                                        break
                                else:
                                    c=re.split(r'[>]',rule[position+1])
                                    mini=float(c[1])
                                    if object1_in_image==object1_in_rule and mini<float(b[2]):
                                        satisfy_number+=1
                                        break
                ratio=satisfy_number/rule_length
                ratio_list.append(ratio)
            image_ratio.append(max(ratio_list))
        result.append(image_ratio)
    return result

def cha_to_num(target,object_list,lists):
    c=re.split(r'[(|,|)]',target)
    #print(c)
    new_dict={}
    rule_list=[]
    #print(lists)
    #print(lists['b'])
    for rule in lists[c[0]]:
        #print(rule)
        if rule==[]:
            rule_list.append(rule)
        clause_list=[]
        for pos,predicate in enumerate(rule):
            #print(predicate)
            a=re.split(r'[¬|(|,|)]',predicate)
            #print(len(a))
            #print(a[0])
            if len(a)==1:
                if len(re.split(r'[<]',predicate))==1:
                    #print(object_list)
                    d=str(object_list.index(a[0]))
                    new_pred=a[0]+'('+'X'+','+d+')'+''
                    clause_list.append(new_pred)
            elif len(a)==2:
                d=str(object_list.index(a[0]))
                new_pred=a[0]+a[1]+'('+'X'+','+d+')'+''
                clause_list.append(new_pred)
            elif a[0]=='overlap':
                a[1]=str(object_list.index(a[1]))
                a[2]=str(object_list.index(a[2]))
                new_pred=a[0]+'('+a[1]+','+a[2]+')'+a[3]
                clause_list.append(new_pred)
            elif a[0]=='num' or a[0]=='area':
                a[1]=str(object_list.index(a[1]))
                new_pred=a[0]+'('+a[1]+','+a[2]+')'+a[3]
                clause_list.append(new_pred)
        #print(clause_list)
        rule_list.append(clause_list)
        new_dict[c[0]]=rule_list
        #print(new_dict)
    return new_dict

def neg_label(dict_list,rules):
    '''rule=copy.deepcopy(rule)
    #lock=copy.deepcopy(locked)
    for label in rule:
        if rule[label]==[]:
            rule[label]=[[]]
    #print(object_list)
    object_list=object_list
    
    rules={}
    for key in rule.keys():
        rule_target=cha_to_num(key,object_list,rule)
        #print(rule_target)
        new_key=key+'('+"X"+")"
        rules[new_key]=rule_target[key]'''
    #print(rules)
    total_list1=get_total_list1(dict_list)
    total_list=get_total_list(total_list1)
    #print(total_list[0])
    al=AL(total_list,rules)
    labels=labeling(total_list,rules)
    return labels,al

