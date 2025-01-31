import math,re,copy,json,time
def get_total_listt1(dictionary):
    total_object=[]
    total_list=[]
    for image_num in range(len(dictionary)):
        for objects_num in range(len(dictionary[image_num]['object_detect']['object'])):
            name=dictionary[image_num]['object_detect']['object'][str(objects_num)]['name']
            if name not in total_object:
                total_object.append(name)
    for image_num in range(len(dictionary)):
        image_list=[]
        position_list=[]
        for objects_num in range(len(dictionary[image_num]['object_detect']['object'])):
            name=dictionary[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            if position not in position_list:
                position_list.append(position)
        object_numbers=[0 for i in range(len(position_list))]
        for objects_num in range(len(dictionary[image_num]['object_detect']['object'])):
            name=dictionary[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            object_numbers[position_list.index(position)]+=1
        for index,objects in enumerate(position_list):
            has=total_object[objects]+"(image"+str(dictionary[image_num]['imageId'])+","+str(objects)+")"
            num="num"+"("+str(objects)+","+str(object_numbers[index])+")"
            image_list.append(has)
            image_list.append(num)
        for objects_num in range(len(dictionary[image_num]['object_detect']['overlap'])):
            object1_name=dictionary[image_num]['object_detect']['object'][str(dictionary[image_num]['object_detect']['overlap'][str(objects_num)]["idA"])]['name']
            object2_name=dictionary[image_num]['object_detect']['object'][str(dictionary[image_num]['object_detect']['overlap'][str(objects_num)]["idB"])]['name']
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

def get_total_listt(total_list1):
    total_list=[]
    for image in total_list1:
        list=[]
        for clauses in image:
            a=re.split(r'[(|,|)]',clauses)
            if a[0]!='overlap' and a[0]!='num' and a[0]!='area':
                sub=a[1]
                break
        for clauses in image:
            a=re.split(r'[(|,|)]',clauses)
            if a[1]==sub:
                a[1]="X"
                if len(a)==3:
                    result=a[0]+"("+a[1]+")"+a[2]
                else:
                    result=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                list.append(result)
            else:
                result=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                list.append(result)
        total_list.append(list)
    return total_list

def has_overlap(clause_list):
    num=0
    for predicate in clause_list:
        a=re.split(r'[(|,|)]',predicate)
        if a[0]=='overlap':
            num+=1
    return num

def has_object(clause_list):
    num=0
    for predicate in clause_list:
        a=re.split(r'[(|,|)]',predicate)
        if a[0]!='overlap' and a[0]!='num' and a[0]!='color' and len(a)==4:
            num+=1
    return num

def labeling(total_list,rules):
    labels=[]
    possible_labels=[]
    for possible_label in rules.keys():
        possible_labels.append(possible_label)
    for image in total_list:
        label_list={}
        find=False
        for possible_label in possible_labels:
            label_list1=[]
            rule_list=rules[possible_label]
            satisfy=["False" for i in range(len(rule_list))]
            for rule_num,rule in enumerate(rule_list):
                satisfy_list=["False" for i in range(len(rule))]
                object_in_rule=[]
                object_character=[]
                for position,clauses in enumerate(rule):
                    a=re.split(r'[(|,|)]',clauses)
                    if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4:
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
                if "False" not in satisfy_list:
                    satisfy[rule_num]="True"
            if "True" in satisfy:
                for truepos,value in enumerate(satisfy):
                    if value=='True':
                        label_list1.append(truepos)
                label_list[possible_label]=label_list1
                find=True
        #if find==False:
            #label_list.append("None")
        labels.append(label_list)
    #print(labels)
    return labels

def get_coordinate(attributes,mark):
    #print(attributes)
    if attributes[0]>attributes[1]:
        ratio=900/attributes[0]
        if ratio*attributes[1]>600:
            ratio=600/attributes[1]
    else:
        ratio=600/attributes[1]
    #print("ratio is",ratio)
    #ratio=ratio*(800/attributes[1])
    xmin=mark[0]/ratio
    ymin=mark[1]/ratio
    xmax=xmin+mark[2]/ratio
    ymax=ymin+mark[3]/ratio
    return xmin,ymin,xmax,ymax

def get_overlap_area(coordinate,attribute,mark):
    xmin,ymin,xmax,ymax=get_coordinate(attribute,mark)
    x1min,y1min,x1max,y1max=coordinate[0],coordinate[1],coordinate[2],coordinate[3]
    if x1max>xmin and y1max>ymax and x1min<xmin and y1min<ymax:
        area=(ymax-y1min)*(x1max-xmin)
    elif x1max>xmin and y1min<ymin and y1max>ymin and x1min<xmin:
        area=(x1max-xmin)*(y1max-ymin)
    elif x1min<xmax and y1min<ymin and y1max>ymin and x1max>xmax:
        area=(xmax-x1min)*(y1max-ymin)
    elif x1min<xmax and y1max>ymax and x1max>xmax and y1min<ymax:
        area=(xmax-x1min)*(ymax-y1min)
    elif x1max>xmin and y1min>ymin and y1max<ymax and x1min<xmin:
        area=(x1max-xmin)*(y1max-y1min)
    elif x1min<xmax and y1min>ymin and y1max<ymax and x1max>xmax:
        area=(xmax-x1min)*(y1max-y1min)
    elif y1min<ymin and x1min>xmin and x1max<xmax and y1max>ymin:
        area=(x1max-x1min)*(y1max-ymin)
    elif y1max>ymax and x1min>xmin and x1max<xmax and y1min<ymax:
        area=(x1max-x1min)*(y1max-ymax)
    return area

def if_overlap(coordinate,attribute,mark):
    xmin,ymin,xmax,ymax=get_coordinate(attribute,mark)
    x1min,y1min,x1max,y1max=coordinate[0],coordinate[1],coordinate[2],coordinate[3]
    #print("this",xmin,ymin,xmax,ymax)
    if x1min>xmin and y1min>ymin and x1max<xmax and y1max<ymax:
        return True
    elif x1max<xmin or x1min>xmax or y1min>ymax or y1max<ymin:
        return False
    else:
        area=get_overlap_area(coordinate,attribute,mark)
        obj_area=(x1max-x1min)*(y1max-y1min)
        if area/obj_area>0.9:
            return True
        else:
            return False

def change_back(attribute,mark):
    if attribute['width']>attribute['height']:
        ratio=900/attribute['width']
        if ratio*attribute['height']>600:
            ratio=600/attribute['height']
    else:
        ratio=600/attribute['height']
    height=(mark[3]-mark[1])*ratio
    width=(mark[2]-mark[0])*ratio
    bias1=(900-attribute['width']*ratio)/2
    bias2=(600-attribute['height']*ratio)/2
    xmin=mark[0]*ratio+bias1
    ymin=mark[1]*ratio+bias2
    #print(ratio)
    #print(xmin,ymin,width,height)
    return [xmin,ymin,width,height]

def get_special_list(dictionary,rules):
    final_dict={}
    for label_name in rules:
        labels_name=re.split(r'[(|,|)]',label_name)[0]
        label_list=[]
        for image_num,image in enumerate(dictionary):
            attribute=[]
            attribute.append(dictionary[image_num]['attributes']['width'])
            attribute.append(dictionary[image_num]['attributes']['height'])
            for circle in dictionary[image_num]['type']:
                if circle['name'][0]==labels_name:
                    mark=[]
                    mark.append(circle['mark']['x'])
                    mark.append(circle['mark']['y'])
                    mark.append(circle['mark']['width'])
                    mark.append(circle['mark']['height'])
                    for objects_num,objects in enumerate(dictionary[image_num]['object_detect']['object']):
                        coordinate=dictionary[image_num]['object_detect']['object'][str(objects_num)]['coordinate']
                        #print(coordinate,if_overlap(coordinate,attribute,mark))
                        if if_overlap(coordinate,attribute,mark)==True:
                            if dictionary[image_num]['object_detect']['object'][str(objects_num)]['name'] not in label_list:
                                label_list.append(dictionary[image_num]['object_detect']['object'][str(objects_num)]['name'])
        final_dict[labels_name]=label_list
    return final_dict

def permutation(three_list):
    ans=three_list[0]
    if len(three_list)==1:
        return [three_list[0]]
    for i in range(1,len(three_list)):
        temp=three_list[i]
        temp2=[]
        for j in ans:
            for k in temp:
                if (i==1):
                    temp3=[]
                    temp3.append(j)
                    temp3.append(k)
                else:
                    j.append(k)
                    temp3=j
                temp2.append(temp3)
        ans=temp2
    return ans

def label_object(labels,rules,dictionary,special):
    label_out=[]
    for image_num,image in enumerate(labels):
        image_out=[]
        for label_name in image:
            for rule_pos in image[label_name]:
                rule1=rules[label_name][rule_pos]
                object_list1=[]
                character_list1=[]
                for predicate in rule1:
                    a=re.split(r'[(|,|)]',predicate)
                    if a[0]!='overlap' and a[0]!='num' and len(a)==4 and a[0] in special[re.split(r'[(|,|)]',label_name)[0]]:
                        object_list1.append(a[0])
                        character_list1.append(a[2])
                rule=[]
                for predicate_num,predicate in enumerate(rule1):
                    a=re.split(r'[(|,|)]',predicate)
                    if a[0]!='overlap' and a[0]!='num' and len(a)==4:
                        if a[2] in character_list1:
                            rule.append(predicate)
                    elif a[0]=='overlap':
                        if a[1] in character_list1 and a[2] in character_list1:
                            rule.append(predicate)
                    elif a[0]=='num' or 'area':
                        if a[1] in character_list1:
                            rule.append(predicate)
                            rule.append(rule1[predicate_num+1])
                if rule==[]:
                    continue
                object_list=[]
                character_list=[]
                object_num_list=[]
                overlapping=[]
                object_has_num=[]
                object_num_range=[]
                for predicate in rule:
                    a=re.split(r'[(|,|)]',predicate)
                    if a[0]!='overlap' and a[0]!='num' and a[0]!='color'and len(a)==4:
                        object_list.append(a[0])
                        character_list.append(a[2])
                for objects in object_list:
                    num=0
                    for object_in_image in dictionary[image_num]['object_detect']['object']:
                        if dictionary[image_num]['object_detect']['object'][object_in_image]['name']==objects:
                            num+=1
                    object_num_list.append(num)
                for predicate_pos,predicate in enumerate(rule):
                    a=re.split(r'[(|,|)]',predicate)
                    if a[0]=='num':
                        object_has_num.append(object_list[character_list.index(a[1])])
                        object_num_range.append(rule[predicate_pos+1])
                used_object_in_overlap=["False" for i in range(len(object_list))]
                for predicate in rule:
                    a=re.split(r'[(|,|)]',predicate)
                    if a[0]=='overlap':
                        overlap_list=[]
                        overlap_list.append(object_list[character_list.index(a[1])])
                        used_object_in_overlap[character_list.index(a[1])]='True'
                        #overlap_list.append(color_list[character_list.index(a[1])])
                        overlap_list.append(object_list[character_list.index(a[2])])
                        used_object_in_overlap[character_list.index(a[2])]='True'
                        #overlap_list.append(color_list[character_list.index(a[2])])
                        overlapping.append(overlap_list)
                if has_overlap(rule)!=0:
                    can_choose_total=[]
                    for overlap_object in overlapping:
                        overlap_choose=[]
                        for overlap_num in range(len(dictionary[image_num]['object_detect']['overlap'])):
                            object1=dictionary[image_num]['object_detect']['object'][str(dictionary[image_num]['object_detect']['overlap'][str(overlap_num)]["idA"])]
                            object2=dictionary[image_num]['object_detect']['object'][str(dictionary[image_num]['object_detect']['overlap'][str(overlap_num)]["idB"])]
                            correct_overlap=False
                            if object1['name']==overlap_object[0]==object2['name']==overlap_object[2]:
                                if overlap_object[1]==overlap_object[3]!='None':
                                    correct_overlap=True
                                elif overlap_object[1]==overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]=='None' or overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]!=overlap_object[3]:
                                    correct_overlap=True
                            elif object1['name']==overlap_object[0] and object2['name']==overlap_object[2]:
                                if overlap_object[1]==overlap_object[3]!='None':
                                    correct_overlap=True
                                elif overlap_object[1]==overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]=='None' and overlap_object[3]!='None':
                                    correct_overlap=True
                                elif overlap_object[1]!='None' and overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]!=overlap_object[3]:
                                    correct_overlap=True
                            elif (object2['name']==overlap_object[0] and object1['name']==overlap_object[2]):
                                if overlap_object[1]==overlap_object[3]!='None':
                                    correct_overlap=True
                                elif overlap_object[1]==overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]=='None' and overlap_object[3]!='None':
                                    correct_overlap=True
                                elif overlap_object[1]!='None' and overlap_object[3]=='None':
                                    correct_overlap=True
                                elif overlap_object[1]!=overlap_object[3]:
                                    correct_overlap=True       
                            if correct_overlap==True:
                                coordinate=[min(object1['coordinate'][0],object2['coordinate'][0]),min(object1['coordinate'][1],object2['coordinate'][1]),max(object1['coordinate'][2],object2['coordinate'][2]),max(object1['coordinate'][3],object2['coordinate'][3])]
                                overlap_choose.append(coordinate)
                        can_choose_total.append(overlap_choose)
                    if 'False' in used_object_in_overlap:
                        for unused_object_pos,unused_obj in enumerate(used_object_in_overlap):
                            if unused_obj=='False':
                                object_choose=[]
                                unused_object_name=object_list[unused_object_pos]
                                for objects in dictionary[image_num]['object_detect']['object']:
                                    if dictionary[image_num]['object_detect']['object'][objects]['name']==unused_object_name:
                                        if object_name in object_has_num:
                                            num_range=object_num_range[object_has_num.index(object_name)]
                                            b=re.split(r'[<]',num_range)
                                            if object_num_list[object_list.index(object_name)]>int(b[0]):
                                                coordinate=objects['coordinate']
                                                object_choose.append(coordinate)
                                        else:
                                            coordinate=objects['coordinate']
                                            object_choose.append(coordinate)
                                can_choose_total.append(object_choose)
                    possible_coordinate=[]
                    choose=permutation(can_choose_total)
                    for num_choose in choose:
                        coordinates=[]
                        for i in range(0,4):
                            if i==1 or i==0:
                                mini=num_choose[0][i]
                                for x in num_choose:
                                    if x[i]<mini:
                                        mini=x[i]
                                coordinates.append(mini)
                            else:
                                maxi=num_choose[0][i]
                                for x in num_choose:
                                    if x[i]>maxi:
                                        maxi=x[i]
                                coordinates.append(maxi)
                        coordinates_change=change_back(dictionary[image_num]['attributes'],coordinates)
                        possible_coordinate.append(coordinates_change)
                        #possible_coordinate.append(coordinates)
                    for i in possible_coordinate:
                        object_out=[]
                        object_out.append([label_name])
                        object_out.append(i)
                        object_out.append(1)
                        image_out.append(object_out)
                else:
                    can_choose_total=[]
                    object_choose=[]
                    for obj_pos,objects in enumerate(object_list):
                        object_name=object_list[obj_pos]
                        for objects in dictionary[image_num]['object_detect']['object']:
                            if dictionary[image_num]['object_detect']['object'][objects]['name']==object_name:
                                if object_name in object_has_num:
                                    num_range=object_num_range[object_has_num.index(object_name)]
                                    b=re.split(r'[<]',num_range)
                                    if object_num_list[object_list.index(object_name)]>int(b[0]):
                                        coordinate=dictionary[image_num]['object_detect']['object'][objects]['coordinate']
                                        object_choose.append(coordinate)
                                else:
                                    coordinate=dictionary[image_num]['object_detect']['object'][objects]['coordinate']
                                    object_choose.append(coordinate)
                        can_choose_total.append(object_choose)
                    possible_coordinate=[]
                    #print(can_choose_total)
                    #print(rule)
                    choose=permutation(can_choose_total)
                    #print(choose)
                    #test_coordinate=[]
                    for num_choose in choose:
                        #print(num_choose)
                        coordinates=[]
                        for i in range(0,4):
                            if i==1 or i==0:
                                mini=num_choose[0][i]
                                for x in num_choose:
                                    if x[i]<mini:
                                        mini=x[i]
                                coordinates.append(mini)
                            else:
                                maxi=num_choose[0][i]
                                for x in num_choose:
                                    if x[i]>maxi:
                                        maxi=x[i]
                                coordinates.append(maxi)
                        #test_coordinate.append(coordinates)
                        #print(image_num,coordinates)
                        coordinates_change=change_back(dictionary[image_num]['attributes'],coordinates)
                        possible_coordinate.append(coordinates_change)
                        #possible_coordinate.append(coordinates)
                    #print("This is",test_coordinate)
                    for i in possible_coordinate:
                        object_out=[]
                        object_out.append([label_name])
                        object_out.append(i)
                        object_out.append(1)
                        image_out.append(object_out)
                        #print(image_out)
        label_out.append(image_out)
    return label_out

def obj_label(human_label,need_label,rules):
    total_list1=get_total_listt1(need_label)
    total_list=get_total_listt(total_list1)
    labels=labeling(total_list,rules)
    special_list=get_special_list(human_label,rules)
    print(special_list)
    output=label_object(labels,rules,need_label,special_list)
    return output

if(__name__) == "__main__":
    human_label = [{'imageId': 1, 'type': [{'name': ['a'], 'fromInterpretation': False, 'mark': {'x': 52.649993896484375, 'y': 11.633331298828125, 'width': 779, 'height': 577}}], 'attributes': {'height': 422, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [204.81910705566406, 283.5330505371094, 401.958251953125, 373.8993225097656], 'name': 'sandwich', 'prob': 0.7005278468132019}, '1': {'coordinate': [259.5160217285156, 275.5595703125, 401.3388671875, 362.4844665527344], 'name': 'fork', 'prob': 0.8952223062515259}, '2': {'coordinate': [16.979015350341797, -0.6162649989128113, 505.016845703125, 359.4411315917969], 'name': 'person', 'prob': 0.9951565861701965}, '3': {'coordinate': [-0.09641146659851074, 282.7637939453125, 611.9030151367188, 420.8414306640625], 'name': 'dining table', 'prob': 0.8304764628410339}, '4': {'coordinate': [-0.14547443389892578, 345.954345703125, 611.845703125, 421.2391052246094], 'name': 'dining table', 'prob': 0.9610969424247742}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 11197.114472351968}, '1': {'idA': 0, 'idB': 2, 'area': 14964.454189928249}, '2': {'idA': 0, 'idB': 3, 'area': 17814.729584260844}, '3': {'idA': 0, 'idB': 4, 'area': 5509.048831840511}, '4': {'idA': 1, 'idB': 2, 'area': 11896.321702172048}, '5': {'idA': 1, 'idB': 3, 'area': 11306.212631088682}, '6': {'idA': 1, 'idB': 4, 'area': 2344.348774672486}, '7': {'idA': 2, 'idB': 3, 'area': 37421.44150221802}, '8': {'idA': 2, 'idB': 4, 'area': 6582.061723539955}, '9': {'idA': 3, 'idB': 4, 'area': 45826.56112659679}}}, 'panoptic_segmentation': {'0': {'name': 'table', 'area': 14347}}}, {'imageId': 2, 'type': [{'name': ['a'], 'fromInterpretation': False, 'mark': {'x': 168.64999389648438, 'y': 46.633331298828125, 'width': 631, 'height': 546}}], 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [465.70880126953125, 269.9778747558594, 611.7056884765625, 406.4404296875], 'name': 'oven', 'prob': 0.9096851348876953}, '1': {'coordinate': [513.1663818359375, 262.03228759765625, 537.9603881835938, 274.0079345703125], 'name': 'bowl', 'prob': 0.8085582852363586}, '2': {'coordinate': [461.7301025390625, 274.2360534667969, 553.731201171875, 406.440673828125], 'name': 'oven', 'prob': 0.8628911972045898}, '3': {'coordinate': [132.28118896484375, 137.97479248046875, 266.96441650390625, 388.4213562011719], 'name': 'person', 'prob': 0.9338444471359253}, '4': {'coordinate': [289.8543701171875, 42.34745788574219, 456.12225341796875, 405.074462890625], 'name': 'person', 'prob': 0.9995967745780945}, '5': {'coordinate': [-0.17483925819396973, 275.5344543457031, 347.0587463378906, 405.7726135253906], 'name': 'oven', 'prob': 0.733656108379364}, '6': {'coordinate': [257.77618408203125, 252.8276824951172, 292.4349060058594, 277.58172607421875], 'name': 'bowl', 'prob': 0.9920316934585571}, '7': {'coordinate': [0.917933464050293, 315.0231628417969, 348.0655517578125, 405.81427001953125], 'name': 'oven', 'prob': 0.8891264796257019}, '8': {'coordinate': [280.4383544921875, 329.8820495605469, 307.4641418457031, 354.0872802734375], 'name': 'spoon', 'prob': 0.8220435380935669}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 99.92132862098515}, '1': {'idA': 0, 'idB': 2, 'area': 11636.946472538635}, '2': {'idA': 3, 'idB': 5, 'area': 15203.972288779914}, '3': {'idA': 3, 'idB': 6, 'area': 227.44590578600764}, '4': {'idA': 3, 'idB': 7, 'area': 9885.50557717681}, '5': {'idA': 4, 'idB': 5, 'area': 7410.2553844368085}, '6': {'idA': 4, 'idB': 6, 'area': 63.87869784561917}, '7': {'idA': 4, 'idB': 7, 'area': 5241.992584116757}, '8': {'idA': 4, 'idB': 8, 'area': 426.24858749005944}, '9': {'idA': 5, 'idB': 6, 'area': 70.955821541138}, '10': {'idA': 5, 'idB': 7, 'area': 31412.088627473626}, '11': {'idA': 5, 'idB': 8, 'area': 654.1654180893674}, '12': {'idA': 7, 'idB': 8, 'area': 654.1654180893674}}}, 'panoptic_segmentation': {'0': {'name': 'light', 'area': 17408}, '1': {'name': 'ceiling', 'area': 487076}, '2': {'name': 'floor', 'area': 7894}, '3': {'name': 'food', 'area': 199539}}}, {'imageId': 3, 'type': [{'name': ['a'], 'fromInterpretation': False, 'mark': {'x': 59.649993896484375, 'y': 41.633331298828125, 'width': 309, 'height': 544}}, {'name': ['a'], 'fromInterpretation': False, 'mark': {'x': 404.6499938964844, 'y': 24.633331298828125, 'width': 351, 'height': 567}}], 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [240.4266357421875, 150.5174102783203, 270.3815002441406, 183.69281005859375], 'name': 'microwave', 'prob': 0.8182215690612793}, '1': {'coordinate': [17.289777755737305, 314.41400146484375, 78.694580078125, 395.00616455078125], 'name': 'bowl', 'prob': 0.7637344002723694}, '2': {'coordinate': [521.2409057617188, 157.2159881591797, 571.942138671875, 290.14013671875], 'name': 'person', 'prob': 0.8524469137191772}, '3': {'coordinate': [521.907470703125, 157.29629516601562, 571.0588989257812, 233.69862365722656], 'name': 'person', 'prob': 0.729675829410553}, '4': {'coordinate': [204.52052307128906, 293.4035339355469, 218.57252502441406, 351.11407470703125], 'name': 'knife', 'prob': 0.9235087633132935}, '5': {'coordinate': [0.009482011198997498, 319.0616149902344, 28.72649574279785, 408.01336669921875], 'name': 'cup', 'prob': 0.7999038696289062}, '6': {'coordinate': [50.09440231323242, 39.44031524658203, 255.99005126953125, 357.1640625], 'name': 'person', 'prob': 0.9991476535797119}, '7': {'coordinate': [254.771728515625, 26.537240982055664, 435.1473388671875, 332.8652648925781], 'name': 'person', 'prob': 0.9969725608825684}, '8': {'coordinate': [16.028104782104492, 266.1788024902344, 610.6043701171875, 405.07354736328125], 'name': 'dining table', 'prob': 0.7270056009292603}, '9': {'coordinate': [428.8575439453125, 153.54495239257812, 481.13189697265625, 308.7130126953125], 'name': 'person', 'prob': 0.9977145195007324}, '10': {'coordinate': [48.23533630371094, 312.1710510253906, 611.7510986328125, 405.3184814453125], 'name': 'dining table', 'prob': 0.7981097102165222}, '11': {'coordinate': [262.2662353515625, 319.1686706542969, 272.2724304199219, 351.2540283203125], 'name': 'knife', 'prob': 0.8213544487953186}, '12': {'coordinate': [492.8500671386719, 149.70651245117188, 542.42626953125, 279.3354797363281], 'name': 'refrigerator', 'prob': 0.9925742149353027}, '13': {'coordinate': [302.9719543457031, 371.0801696777344, 371.45269775390625, 407.9950866699219], 'name': 'bowl', 'prob': 0.9886232018470764}}, 'overlap': {'0': {'idA': 0, 'idB': 6, 'area': 516.322532066144}, '1': {'idA': 0, 'idB': 7, 'area': 517.8604175723158}, '2': {'idA': 1, 'idB': 5, 'area': 868.5563959783176}, '3': {'idA': 1, 'idB': 6, 'area': 1222.6593450654764}, '4': {'idA': 1, 'idB': 8, 'area': 4948.745843025623}, '5': {'idA': 1, 'idB': 10, 'area': 2454.7763417419046}, '6': {'idA': 2, 'idB': 3, 'area': 3755.283564879559}, '7': {'idA': 2, 'idB': 8, 'area': 1214.8691875580698}, '8': {'idA': 2, 'idB': 12, 'area': 2587.145852412097}, '9': {'idA': 3, 'idB': 12, 'area': 1567.6840083114803}, '10': {'idA': 4, 'idB': 6, 'area': 810.9486316367984}, '11': {'idA': 4, 'idB': 8, 'area': 810.9486316367984}, '12': {'idA': 4, 'idB': 10, 'area': 547.2274448350072}, '13': {'idA': 5, 'idB': 8, 'area': 1092.213144557667}, '14': {'idA': 6, 'idB': 7, 'area': 357.4862927175127}, '15': {'idA': 6, 'idB': 8, 'area': 18733.469155168277}, '16': {'idA': 6, 'idB': 10, 'area': 9263.865296062897}, '17': {'idA': 7, 'idB': 8, 'area': 12028.611358009279}, '18': {'idA': 7, 'idB': 9, 'area': 975.9752777293324}, '19': {'idA': 7, 'idB': 10, 'area': 3732.731457039714}, '20': {'idA': 7, 'idB': 11, 'area': 137.05079372040927}, '21': {'idA': 8, 'idB': 9, 'area': 2223.448319999501}, '22': {'idA': 8, 'idB': 10, 'area': 52245.487104399595}, '23': {'idA': 8, 'idB': 11, 'area': 321.0523476442322}, '24': {'idA': 8, 'idB': 12, 'area': 652.2580939661711}, '25': {'idA': 8, 'idB': 13, 'area': 2327.8917748620734}, '26': {'idA': 10, 'idB': 11, 'area': 321.0523476442322}, '27': {'idA': 10, 'idB': 13, 'area': 2344.665042885579}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 384523}, '1': {'name': 'light', 'area': 10617}, '2': {'name': 'ceiling', 'area': 123005}, '3': {'name': 'floor', 'area': 20199}}}, {'imageId': 4, 'type': [{'name': ['a'], 'fromInterpretation': False, 'mark': {'x': 145.64999389648438, 'y': 41.633331298828125, 'width': 707, 'height': 462}}], 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [255.01904296875, 258.6768798828125, 289.6902160644531, 274.9323425292969], 'name': 'apple', 'prob': 0.9732934832572937}, '1': {'coordinate': [210.53770446777344, 256.24066162109375, 241.6908721923828, 274.7484436035156], 'name': 'apple', 'prob': 0.9828513860702515}, '2': {'coordinate': [367.5364990234375, 229.9598846435547, 407.9577331542969, 246.901123046875], 'name': 'sink', 'prob': 0.7384935617446899}, '3': {'coordinate': [460.8050537109375, 241.01275634765625, 532.8206787109375, 290.17645263671875], 'name': 'bowl', 'prob': 0.9602104425430298}, '4': {'coordinate': [364.2960205078125, 237.74411010742188, 406.689208984375, 253.59896850585938], 'name': 'sink', 'prob': 0.7582658529281616}, '5': {'coordinate': [549.1541748046875, 205.74864196777344, 574.8472900390625, 240.3702392578125], 'name': 'cup', 'prob': 0.8920943737030029}, '6': {'coordinate': [199.2729949951172, 261.48785400390625, 297.7776184082031, 296.67694091796875], 'name': 'bowl', 'prob': 0.9364123940467834}, '7': {'coordinate': [225.9149932861328, 227.08126831054688, 260.47955322265625, 242.98680114746094], 'name': 'bowl', 'prob': 0.7230260372161865}, '8': {'coordinate': [68.23328399658203, 199.79891967773438, 82.99716186523438, 209.67868041992188], 'name': 'apple', 'prob': 0.8193491697311401}, '9': {'coordinate': [236.07571411132812, 53.75066375732422, 418.9315185546875, 272.8368835449219], 'name': 'person', 'prob': 0.9987251162528992}, '10': {'coordinate': [414.08251953125, 269.05096435546875, 441.5531005859375, 292.068603515625], 'name': 'apple', 'prob': 0.7297645211219788}, '11': {'coordinate': [96.62214660644531, 218.5852813720703, 116.97818756103516, 242.65855407714844], 'name': 'cup', 'prob': 0.9962722063064575}, '12': {'coordinate': [45.04551696777344, 198.51918029785156, 60.0949821472168, 210.15313720703125], 'name': 'apple', 'prob': 0.9749066829681396}, '13': {'coordinate': [305.7786560058594, 237.0604705810547, 340.69769287109375, 269.44342041015625], 'name': 'knife', 'prob': 0.993190348148346}, '14': {'coordinate': [62.220428466796875, 199.20790100097656, 76.31185913085938, 209.57223510742188], 'name': 'apple', 'prob': 0.8698309659957886}, '15': {'coordinate': [342.9400634765625, 76.21526336669922, 497.3010559082031, 272.4940490722656], 'name': 'person', 'prob': 0.9960491061210632}, '16': {'coordinate': [376.0428161621094, 191.68630981445312, 400.4609069824219, 217.59495544433594], 'name': 'cup', 'prob': 0.9444360136985779}}, 'overlap': {'0': {'idA': 0, 'idB': 6, 'area': 466.1361888470128}, '1': {'idA': 0, 'idB': 9, 'area': 490.9439380047843}, '2': {'idA': 1, 'idB': 6, 'area': 413.10937192384154}, '3': {'idA': 1, 'idB': 9, 'area': 93.19040965056047}, '4': {'idA': 2, 'idB': 4, 'area': 358.52187172695994}, '5': {'idA': 2, 'idB': 9, 'area': 684.7857639673166}, '6': {'idA': 2, 'idB': 15, 'area': 684.7857639673166}, '7': {'idA': 3, 'idB': 15, 'area': 1148.941328450106}, '8': {'idA': 4, 'idB': 9, 'area': 672.1380003541708}, '9': {'idA': 4, 'idB': 15, 'area': 672.1380003541708}, '10': {'idA': 6, 'idB': 9, 'area': 700.2567346021533}, '11': {'idA': 7, 'idB': 9, 'area': 388.1560643319972}, '12': {'idA': 8, 'idB': 14, 'area': 78.95446300972253}, '13': {'idA': 9, 'idB': 10, 'area': 18.357918452471495}, '14': {'idA': 9, 'idB': 13, 'area': 1130.7814188874327}, '15': {'idA': 9, 'idB': 15, 'area': 14915.510526733473}, '16': {'idA': 9, 'idB': 16, 'area': 632.6396620217711}, '17': {'idA': 10, 'idB': 15, 'area': 94.58353779092431}, '18': {'idA': 15, 'idB': 16, 'area': 632.6396620217711}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 616904}, '1': {'name': 'counter', 'area': 180166}}}, {'imageId': 5, 'type': [{'name': ['b'], 'fromInterpretation': False, 'mark': {'x': 151.64999389648438, 'y': 18.633331298828125, 'width': 449, 'height': 572}}], 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [80.66887664794922, 31.02434539794922, 89.63018798828125, 49.600250244140625], 'name': 'handbag', 'prob': 0.8655454516410828}, '1': {'coordinate': [16.637182235717773, 69.60508728027344, 42.30337905883789, 85.42570495605469], 'name': 'handbag', 'prob': 0.7518603801727295}, '2': {'coordinate': [117.59281921386719, 50.597145080566406, 124.8592758178711, 58.935428619384766], 'name': 'handbag', 'prob': 0.8649145364761353}, '3': {'coordinate': [0.004939176142215729, 83.1976089477539, 13.684449195861816, 99.67098236083984], 'name': 'potted plant', 'prob': 0.7720097303390503}, '4': {'coordinate': [122.74225616455078, 13.653820991516113, 143.5870819091797, 89.13777160644531], 'name': 'person', 'prob': 0.9919235110282898}, '5': {'coordinate': [138.15724182128906, 15.87058162689209, 150.01705932617188, 91.25202178955078], 'name': 'person', 'prob': 0.9894261360168457}, '6': {'coordinate': [0.26713013648986816, 92.2012710571289, 89.12300109863281, 142.9501190185547], 'name': 'bench', 'prob': 0.7667999267578125}, '7': {'coordinate': [103.73051452636719, 14.030449867248535, 126.96000671386719, 55.515296936035156], 'name': 'person', 'prob': 0.857029914855957}, '8': {'coordinate': [0.5601882934570312, 7.135923385620117, 99.6688003540039, 146.1219482421875], 'name': 'person', 'prob': 0.9991546869277954}, '9': {'coordinate': [102.5061264038086, 14.037126541137695, 127.43114471435547, 82.05062103271484], 'name': 'person', 'prob': 0.992010235786438}, '10': {'coordinate': [82.20459747314453, 9.563782691955566, 106.26224517822266, 80.52243041992188], 'name': 'person', 'prob': 0.9982966780662537}}, 'overlap': {'0': {'idA': 0, 'idB': 8, 'area': 166.46446675510379}, '1': {'idA': 0, 'idB': 10, 'area': 137.93706283596111}, '2': {'idA': 1, 'idB': 8, 'area': 406.0550871299347}, '3': {'idA': 2, 'idB': 4, 'area': 17.65231012663571}, '4': {'idA': 2, 'idB': 7, 'area': 35.73753702966496}, '5': {'idA': 2, 'idB': 9, 'area': 60.58977548670373}, '6': {'idA': 3, 'idB': 6, 'area': 100.22349984328685}, '7': {'idA': 3, 'idB': 8, 'area': 216.20085061607824}, '8': {'idA': 4, 'idB': 5, 'area': 397.8291252780764}, '9': {'idA': 4, 'idB': 7, 'area': 174.97273651268188}, '10': {'idA': 4, 'idB': 9, 'area': 318.9076955537603}, '11': {'idA': 6, 'idB': 8, 'area': 4494.460722086078}, '12': {'idA': 7, 'idB': 9, 'area': 963.5168351400644}, '13': {'idA': 7, 'idB': 10, 'area': 105.02845891158358}, '14': {'idA': 8, 'idB': 10, 'area': 1239.2362200726348}, '15': {'idA': 9, 'idB': 10, 'area': 249.72669812172535}}}, 'panoptic_segmentation': {'0': {'name': 'pavement', 'area': 350306}, '1': {'name': 'dirt', 'area': 7285}}}, {'imageId': 6, 'type': [{'name': ['b'], 'fromInterpretation': False, 'mark': {'x': 80.64999389648438, 'y': 117.63333129882812, 'width': 285, 'height': 445}}, {'name': ['b'], 'fromInterpretation': False, 'mark': {'x': 532.6499938964844, 'y': 102.63333129882812, 'width': 285, 'height': 475}}], 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [502.2969055175781, 110.73680877685547, 588.5637817382812, 214.67601013183594], 'name': 'person', 'prob': 0.9964321851730347}, '1': {'coordinate': [435.9134521484375, 129.24465942382812, 475.4485778808594, 163.86431884765625], 'name': 'tv', 'prob': 0.7634558081626892}, '2': {'coordinate': [0.07522912323474884, 132.18873596191406, 58.905517578125, 233.3057098388672], 'name': 'tv', 'prob': 0.9941086769104004}, '3': {'coordinate': [172.6691436767578, 143.64747619628906, 261.83447265625, 202.06365966796875], 'name': 'person', 'prob': 0.9773090481758118}, '4': {'coordinate': [49.871036529541016, 105.68807983398438, 173.03895568847656, 396.1697692871094], 'name': 'person', 'prob': 0.9995496869087219}, '5': {'coordinate': [257.0502624511719, 98.427001953125, 343.29241943359375, 384.88983154296875], 'name': 'person', 'prob': 0.999123752117157}, '6': {'coordinate': [124.52274322509766, 150.39022827148438, 141.05194091796875, 210.62599182128906], 'name': 'tie', 'prob': 0.8231526613235474}, '7': {'coordinate': [322.0909118652344, 118.75010681152344, 376.5765380859375, 310.47662353515625], 'name': 'person', 'prob': 0.9968683123588562}, '8': {'coordinate': [334.29010009765625, 152.7570343017578, 381.44183349609375, 229.15899658203125], 'name': 'handbag', 'prob': 0.8901066184043884}, '9': {'coordinate': [378.6632995605469, 102.63876342773438, 488.17901611328125, 362.26800537109375], 'name': 'person', 'prob': 0.9969865679740906}}, 'overlap': {'0': {'idA': 1, 'idB': 9, 'area': 1368.6925881346688}, '1': {'idA': 2, 'idB': 4, 'area': 913.5393841814948}, '2': {'idA': 3, 'idB': 4, 'area': 21.60300632659346}, '3': {'idA': 3, 'idB': 5, 'area': 279.47530110692605}, '4': {'idA': 4, 'idB': 6, 'area': 995.6488438957604}, '5': {'idA': 5, 'idB': 7, 'area': 4064.8911953712814}, '6': {'idA': 5, 'idB': 8, 'area': 687.7948623392731}, '7': {'idA': 7, 'idB': 8, 'area': 3230.766840147786}, '8': {'idA': 8, 'idB': 9, 'area': 212.28544493811205}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 340176}, '1': {'name': 'floor', 'area': 225464}, '2': {'name': 'ceiling', 'area': 107957}}}, {'imageId': 7, 'type': [{'name': ['b'], 'fromInterpretation': False, 'mark': {'x': 160.64999389648438, 'y': 51.633331298828125, 'width': 692, 'height': 514}}], 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [0.031206965446472168, 200.50381469726562, 40.62685012817383, 281.8334655761719], 'name': 'person', 'prob': 0.8331296443939209}, '1': {'coordinate': [183.27650451660156, 102.86682891845703, 316.1648254394531, 405.3005676269531], 'name': 'person', 'prob': 0.9635576009750366}, '2': {'coordinate': [515.7955932617188, 325.74176025390625, 611.93701171875, 406.7310485839844], 'name': 'person', 'prob': 0.9323866367340088}, '3': {'coordinate': [0.02822716534137726, 194.81600952148438, 33.326663970947266, 263.45843505859375], 'name': 'person', 'prob': 0.9379450082778931}, '4': {'coordinate': [77.74364471435547, 150.3852996826172, 176.6578369140625, 283.635009765625], 'name': 'person', 'prob': 0.9142408967018127}, '5': {'coordinate': [34.25657653808594, 191.01400756835938, 83.1491928100586, 277.3927917480469], 'name': 'person', 'prob': 0.7514298558235168}, '6': {'coordinate': [-0.033302173018455505, 195.04583740234375, 41.209136962890625, 312.33062744140625], 'name': 'person', 'prob': 0.7874597311019897}, '7': {'coordinate': [78.8847885131836, 148.4972686767578, 179.1469268798828, 224.27688598632812], 'name': 'person', 'prob': 0.9323511719703674}, '8': {'coordinate': [76.235107421875, 149.34112548828125, 193.60858154296875, 405.24749755859375], 'name': 'person', 'prob': 0.7620434165000916}, '9': {'coordinate': [38.96158218383789, 189.0890350341797, 80.11922454833984, 231.4236297607422], 'name': 'person', 'prob': 0.9582598805427551}, '10': {'coordinate': [304.720947265625, 36.15726852416992, 601.9638671875, 404.8468933105469], 'name': 'person', 'prob': 0.991125762462616}}, 'overlap': {'0': {'idA': 0, 'idB': 3, 'area': 2096.1028555382254}, '1': {'idA': 0, 'idB': 5, 'area': 489.8038198754657}, '2': {'idA': 0, 'idB': 6, 'area': 3301.6294856292734}, '3': {'idA': 0, 'idB': 9, 'area': 51.48977687000297}, '4': {'idA': 1, 'idB': 8, 'area': 2644.0443477686495}, '5': {'idA': 1, 'idB': 10, 'area': 3455.8230678278487}, '6': {'idA': 2, 'idB': 10, 'area': 6816.352774159983}, '7': {'idA': 3, 'idB': 6, 'area': 2278.032559763982}, '8': {'idA': 4, 'idB': 5, 'area': 466.924672331661}, '9': {'idA': 4, 'idB': 7, 'area': 7224.60564409045}, '10': {'idA': 4, 'idB': 8, 'area': 13180.287433705875}, '11': {'idA': 4, 'idB': 9, 'area': 100.56920951232314}, '12': {'idA': 5, 'idB': 6, 'area': 572.5221758871339}, '13': {'idA': 5, 'idB': 7, 'area': 141.84636165201664}, '14': {'idA': 5, 'idB': 8, 'area': 597.2302895458415}, '15': {'idA': 5, 'idB': 9, 'area': 1663.1647782787331}, '16': {'idA': 6, 'idB': 9, 'area': 81.76108106650645}, '17': {'idA': 7, 'idB': 8, 'area': 7513.219587669009}, '18': {'idA': 7, 'idB': 9, 'area': 43.437151215039194}, '19': {'idA': 8, 'idB': 9, 'area': 164.43252441938967}}}, 'panoptic_segmentation': {}}]
    need_label = [{'imageId': '632913cb354779c2db08b6c7', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [297.11151123046875, 350.5739440917969, 328.4975891113281, 364.605224609375], 'name': 'broccoli', 'prob': 0.7076112031936646}, '1': {'coordinate': [386.6286926269531, 367.3509216308594, 502.20849609375, 394.645263671875], 'name': 'knife', 'prob': 0.7951258420944214}, '2': {'coordinate': [464.4560852050781, 314.43634033203125, 589.679931640625, 392.8664855957031], 'name': 'bowl', 'prob': 0.9898640513420105}, '3': {'coordinate': [204.17832946777344, 355.8442687988281, 253.05697631835938, 378.21527099609375], 'name': 'bowl', 'prob': 0.87983638048172}, '4': {'coordinate': [0.1024850606918335, 169.5476531982422, 75.33245849609375, 321.7165832519531], 'name': 'oven', 'prob': 0.7324121594429016}, '5': {'coordinate': [-0.05688066780567169, 175.0601806640625, 57.654685974121094, 240.66920471191406], 'name': 'microwave', 'prob': 0.9516103267669678}, '6': {'coordinate': [-0.006689161062240601, 247.81878662109375, 72.17159271240234, 318.5853576660156], 'name': 'oven', 'prob': 0.7700120210647583}, '7': {'coordinate': [75.2164306640625, 0.1762375831604004, 419.2549133300781, 358.447998046875], 'name': 'person', 'prob': 0.9993501305580139}, '8': {'coordinate': [-0.1349869966506958, 284.4035949707031, 611.8637084960938, 405.54473876953125], 'name': 'dining table', 'prob': 0.7398373484611511}, '9': {'coordinate': [422.7872009277344, 287.5981750488281, 455.74560546875, 364.429931640625], 'name': 'bottle', 'prob': 0.9464737176895142}, '10': {'coordinate': [46.365604400634766, 258.2741394042969, 76.2797622680664, 322.40240478515625], 'name': 'bottle', 'prob': 0.8583006262779236}, '11': {'coordinate': [245.09727478027344, 366.8197021484375, 375.52655029296875, 408.0357360839844], 'name': 'bowl', 'prob': 0.9884254932403564}, '12': {'coordinate': [305.2851867675781, 66.4085922241211, 472.2349548339844, 342.179931640625], 'name': 'person', 'prob': 0.9982563853263855}}, 'overlap': {'0': {'idA': 0, 'idB': 7, 'area': 247.13567067217082}, '1': {'idA': 0, 'idB': 8, 'area': 440.3868630928919}, '2': {'idA': 1, 'idB': 2, 'area': 963.2740548569709}, '3': {'idA': 1, 'idB': 8, 'area': 3154.6746888561174}, '4': {'idA': 2, 'idB': 8, 'area': 9821.324466415681}, '5': {'idA': 2, 'idB': 12, 'area': 215.81377982720733}, '6': {'idA': 3, 'idB': 7, 'area': 127.26676240982488}, '7': {'idA': 3, 'idB': 8, 'area': 1093.4643160938285}, '8': {'idA': 3, 'idB': 11, 'area': 90.70532688405365}, '9': {'idA': 4, 'idB': 5, 'area': 3775.943733735965}, '10': {'idA': 4, 'idB': 6, 'area': 5100.0836267788945}, '11': {'idA': 4, 'idB': 7, 'area': 17.655831056647003}, '12': {'idA': 4, 'idB': 8, 'area': 2807.0551171939005}, '13': {'idA': 4, 'idB': 10, 'area': 1837.728014394408}, '14': {'idA': 6, 'idB': 8, 'area': 2467.180902754142}, '15': {'idA': 6, 'idB': 10, 'area': 1556.3905935303774}, '16': {'idA': 7, 'idB': 8, 'area': 25474.12408423703}, '17': {'idA': 7, 'idB': 10, 'area': 68.18961128941737}, '18': {'idA': 7, 'idB': 12, 'area': 31429.58414707333}, '19': {'idA': 8, 'idB': 9, 'area': 2532.2521153492853}, '20': {'idA': 8, 'idB': 10, 'area': 1136.7023955640616}, '21': {'idA': 8, 'idB': 11, 'area': 5050.878470691852}, '22': {'idA': 8, 'idB': 12, 'area': 9645.74600677006}, '23': {'idA': 9, 'idB': 12, 'area': 1798.9276143116876}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 268651}, '1': {'name': 'light', 'area': 24388}, '2': {'name': 'ceiling', 'area': 90779}, '3': {'name': 'food', 'area': 187518}}}, {'imageId': '632913cc354779c2db08b6cb', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [13.32965087890625, 0.004620552062988281, 253.03004455566406, 110.31586456298828], 'name': 'bottle', 'prob': 0.8011475801467896}, '1': {'coordinate': [-0.14603984355926514, 0.009447813034057617, 515.8457641601562, 407.93707275390625], 'name': 'person', 'prob': 0.9950695037841797}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 26440.49152003654}}}, 'panoptic_segmentation': {'0': {'name': 'light', 'area': 7513}, '1': {'name': 'floor', 'area': 13996}}}, {'imageId': '632913cc354779c2db08b6cf', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [80.05018615722656, 319.6755676269531, 151.49063110351562, 407.9651794433594], 'name': 'potted plant', 'prob': 0.9799365997314453}, '1': {'coordinate': [138.9711151123047, 311.773681640625, 174.1127471923828, 345.556884765625], 'name': 'cup', 'prob': 0.957991361618042}, '2': {'coordinate': [318.7814636230469, 364.586669921875, 383.9502258300781, 407.987548828125], 'name': 'potted plant', 'prob': 0.8456798791885376}, '3': {'coordinate': [161.03392028808594, 236.47970581054688, 187.86260986328125, 319.80206298828125], 'name': 'spoon', 'prob': 0.8541626930236816}, '4': {'coordinate': [163.6645965576172, 363.877197265625, 232.87893676757812, 408.0363464355469], 'name': 'potted plant', 'prob': 0.9478030800819397}, '5': {'coordinate': [33.64971923828125, 72.93628692626953, 66.42912292480469, 206.38653564453125], 'name': 'bottle', 'prob': 0.9810202717781067}, '6': {'coordinate': [1.288892388343811, 269.5746154785156, 74.81587982177734, 339.3921203613281], 'name': 'potted plant', 'prob': 0.9858543276786804}, '7': {'coordinate': [137.77490234375, 134.90220642089844, 183.2091827392578, 317.4154968261719], 'name': 'knife', 'prob': 0.721992015838623}, '8': {'coordinate': [75.06596374511719, 75.0326919555664, 112.09354400634766, 195.32078552246094], 'name': 'bottle', 'prob': 0.9503021836280823}, '9': {'coordinate': [79.4510498046875, -0.4979982376098633, 363.69842529296875, 332.9210510253906], 'name': 'person', 'prob': 0.9948445558547974}, '10': {'coordinate': [-1.374638557434082, 277.81463623046875, 592.2224731445312, 408.3563232421875], 'name': 'dining table', 'prob': 0.9004560708999634}, '11': {'coordinate': [43.818260192871094, 91.86248016357422, 85.21537017822266, 209.40110778808594], 'name': 'bottle', 'prob': 0.9653800129890442}, '12': {'coordinate': [250.33604431152344, 352.6546936035156, 318.8260192871094, 407.9125061035156], 'name': 'potted plant', 'prob': 0.9767836332321167}, '13': {'coordinate': [305.0981140136719, -0.11127018928527832, 611.744384765625, 407.7996520996094], 'name': 'person', 'prob': 0.9988771080970764}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 324.02156379120424}, '1': {'idA': 0, 'idB': 9, 'area': 946.26322751306}, '2': {'idA': 0, 'idB': 10, 'area': 6307.449152299203}, '3': {'idA': 1, 'idB': 3, 'area': 105.00180996768177}, '4': {'idA': 1, 'idB': 7, 'area': 198.26259351428598}, '5': {'idA': 1, 'idB': 9, 'area': 743.1530743809417}, '6': {'idA': 1, 'idB': 10, 'area': 1187.1968947052956}, '7': {'idA': 2, 'idB': 10, 'area': 2828.381557017565}, '8': {'idA': 2, 'idB': 12, 'area': 1.9304114021360874}, '9': {'idA': 2, 'idB': 13, 'area': 2816.136559797451}, '10': {'idA': 3, 'idB': 7, 'area': 1794.772407464683}, '11': {'idA': 3, 'idB': 9, 'area': 2235.4296553949825}, '12': {'idA': 3, 'idB': 10, 'area': 1126.467638546601}, '13': {'idA': 4, 'idB': 10, 'area': 3056.446374029387}, '14': {'idA': 5, 'idB': 11, 'area': 2589.4876979842666}, '15': {'idA': 6, 'idB': 10, 'area': 4527.60690187215}, '16': {'idA': 7, 'idB': 9, 'area': 8292.360012179939}, '17': {'idA': 7, 'idB': 10, 'area': 1799.2366042085923}, '18': {'idA': 8, 'idB': 9, 'area': 3926.503396786109}, '19': {'idA': 8, 'idB': 11, 'area': 1050.0403899676749}, '20': {'idA': 9, 'idB': 10, 'area': 15663.853778025135}, '21': {'idA': 9, 'idB': 11, 'area': 677.530305893335}, '22': {'idA': 9, 'idB': 13, 'area': 19515.797689246792}, '23': {'idA': 10, 'idB': 12, 'area': 3784.60619533062}, '24': {'idA': 10, 'idB': 13, 'area': 37321.86437804159}, '25': {'idA': 12, 'idB': 13, 'area': 757.0247665420175}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 152752}, '1': {'name': 'table', 'area': 14162}, '2': {'name': 'food', 'area': 21964}, '3': {'name': 'floor', 'area': 51234}}}, {'imageId': '632913cc354779c2db08b6d3', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [318.7610778808594, 241.75245666503906, 337.6235046386719, 256.0509338378906], 'name': 'apple', 'prob': 0.9377766251564026}, '1': {'coordinate': [59.84162521362305, 58.02473449707031, 77.54102325439453, 107.45426940917969], 'name': 'bottle', 'prob': 0.8049001097679138}, '2': {'coordinate': [388.6544189453125, 34.192657470703125, 612.0230712890625, 347.813232421875], 'name': 'person', 'prob': 0.8966983556747437}, '3': {'coordinate': [274.1178894042969, 373.153564453125, 329.479736328125, 390.2104187011719], 'name': 'knife', 'prob': 0.7563191652297974}, '4': {'coordinate': [450.9858703613281, 310.851318359375, 488.9418029785156, 340.8000793457031], 'name': 'spoon', 'prob': 0.7205504179000854}, '5': {'coordinate': [466.4474792480469, 369.0823974609375, 530.4011840820312, 403.2651062011719], 'name': 'bowl', 'prob': 0.9925884008407593}, '6': {'coordinate': [-0.009636472910642624, 48.4998893737793, 11.311745643615723, 102.22903442382812], 'name': 'wine glass', 'prob': 0.7568489909172058}, '7': {'coordinate': [551.985107421875, 341.1947021484375, 612.0208740234375, 407.5306091308594], 'name': 'bowl', 'prob': 0.895610511302948}, '8': {'coordinate': [300.0712890625, 251.02488708496094, 351.8426513671875, 276.4806823730469], 'name': 'bowl', 'prob': 0.9788042902946472}, '9': {'coordinate': [237.21841430664062, 186.02757263183594, 251.98690795898438, 215.53359985351562], 'name': 'vase', 'prob': 0.9612118005752563}, '10': {'coordinate': [223.3229522705078, 261.6463623046875, 251.48291015625, 296.4978332519531], 'name': 'spoon', 'prob': 0.8664640784263611}, '11': {'coordinate': [478.78460693359375, 250.5168914794922, 611.6942138671875, 387.51739501953125], 'name': 'potted plant', 'prob': 0.7913771271705627}, '12': {'coordinate': [333.783935546875, 242.0440673828125, 351.8841857910156, 256.6432189941406], 'name': 'apple', 'prob': 0.7150794267654419}, '13': {'coordinate': [27.282588958740234, 133.11705017089844, 45.51913833618164, 165.3909149169922], 'name': 'wine glass', 'prob': 0.9594250321388245}, '14': {'coordinate': [147.00706481933594, 101.83195495605469, 265.066162109375, 256.33160400390625], 'name': 'potted plant', 'prob': 0.9617018699645996}, '15': {'coordinate': [288.28131103515625, 370.47540283203125, 376.9606628417969, 383.1163024902344], 'name': 'knife', 'prob': 0.7175058126449585}, '16': {'coordinate': [12.526822090148926, 210.78257751464844, 58.17671585083008, 236.7147216796875], 'name': 'bowl', 'prob': 0.9603115916252136}, '17': {'coordinate': [182.48036193847656, 209.96717834472656, 219.49620056152344, 255.14830017089844], 'name': 'vase', 'prob': 0.9486857652664185}, '18': {'coordinate': [99.36622619628906, 291.0971984863281, 124.60587310791016, 335.66412353515625], 'name': 'bottle', 'prob': 0.7606009840965271}, '19': {'coordinate': [34.059139251708984, 131.03016662597656, 52.37997817993164, 165.65077209472656], 'name': 'wine glass', 'prob': 0.9598415493965149}, '20': {'coordinate': [73.06573486328125, 65.56121826171875, 90.01444244384766, 108.06269836425781], 'name': 'bottle', 'prob': 0.9491167664527893}, '21': {'coordinate': [102.49773406982422, 273.8460998535156, 215.56996154785156, 328.20245361328125], 'name': 'bowl', 'prob': 0.9877429008483887}, '22': {'coordinate': [52.550682067871094, 56.93409729003906, 70.59223937988281, 107.00083923339844], 'name': 'bottle', 'prob': 0.7122369408607483}, '23': {'coordinate': [146.00546264648438, 292.119384765625, 173.2444610595703, 336.5868225097656], 'name': 'bottle', 'prob': 0.912943422794342}, '24': {'coordinate': [7.511847019195557, 43.37321853637695, 30.514202117919922, 102.0530014038086], 'name': 'wine glass', 'prob': 0.7538096904754639}, '25': {'coordinate': [0.05482649803161621, 295.0214538574219, 108.1719970703125, 376.4740905761719], 'name': 'bowl', 'prob': 0.9941463470458984}, '26': {'coordinate': [296.5599365234375, 46.13285827636719, 466.447509765625, 335.0905456542969], 'name': 'person', 'prob': 0.9866543412208557}, '27': {'coordinate': [-0.05608499050140381, 270.1891784667969, 611.8795776367188, 406.4186096191406], 'name': 'dining table', 'prob': 0.8226128220558167}, '28': {'coordinate': [51.46726608276367, 210.9925994873047, 85.36898040771484, 298.8743896484375], 'name': 'bottle', 'prob': 0.9517953991889954}, '29': {'coordinate': [21.05573081970215, 130.13050842285156, 39.21661376953125, 164.22915649414062], 'name': 'wine glass', 'prob': 0.9347251057624817}, '30': {'coordinate': [52.91444778442383, 130.9113006591797, 71.86266326904297, 167.46376037597656], 'name': 'wine glass', 'prob': 0.8923563361167908}, '31': {'coordinate': [0.9831197261810303, 323.8998107910156, 610.66748046875, 406.8184509277344], 'name': 'dining table', 'prob': 0.8046678900718689}, '32': {'coordinate': [270.8251037597656, 337.8017578125, 301.847900390625, 373.1645812988281], 'name': 'cup', 'prob': 0.9109030365943909}, '33': {'coordinate': [477.02386474609375, 250.797607421875, 612.0661010742188, 347.44744873046875], 'name': 'potted plant', 'prob': 0.8782609701156616}, '34': {'coordinate': [281.86297607421875, 370.05072021484375, 402.2138366699219, 386.8561706542969], 'name': 'knife', 'prob': 0.7712477445602417}, '35': {'coordinate': [41.65229034423828, 130.7222442626953, 60.52336502075195, 166.63043212890625], 'name': 'wine glass', 'prob': 0.9535910487174988}, '36': {'coordinate': [300.6332092285156, 34.2870979309082, 612.1565551757812, 350.93206787109375], 'name': 'person', 'prob': 0.8586295247077942}, '37': {'coordinate': [321.5993347167969, 241.30789184570312, 342.901611328125, 256.5766906738281], 'name': 'apple', 'prob': 0.8897369503974915}}, 'overlap': {'0': {'idA': 0, 'idB': 8, 'area': 94.80343875847757}, '1': {'idA': 0, 'idB': 12, 'area': 53.78033151384443}, '2': {'idA': 0, 'idB': 26, 'area': 269.70397842116654}, '3': {'idA': 0, 'idB': 36, 'area': 269.70397842116654}, '4': {'idA': 0, 'idB': 37, 'area': 229.1212278418243}, '5': {'idA': 1, 'idB': 20, 'area': 187.48348546854686}, '6': {'idA': 1, 'idB': 22, 'area': 526.5232053865911}, '7': {'idA': 2, 'idB': 4, 'area': 1136.7331539653242}, '8': {'idA': 2, 'idB': 7, 'area': 397.3485387414694}, '9': {'idA': 2, 'idB': 11, 'area': 12931.618430729024}, '10': {'idA': 2, 'idB': 26, 'area': 22478.91161741875}, '11': {'idA': 2, 'idB': 27, 'area': 17327.641762392595}, '12': {'idA': 2, 'idB': 31, 'area': 5309.0919477678835}, '13': {'idA': 2, 'idB': 33, 'area': 13047.651889164}, '14': {'idA': 2, 'idB': 36, 'area': 70031.91013579257}, '15': {'idA': 3, 'idB': 15, 'area': 410.4491187352687}, '16': {'idA': 3, 'idB': 27, 'area': 944.2989538824186}, '17': {'idA': 3, 'idB': 31, 'area': 944.2989538824186}, '18': {'idA': 3, 'idB': 32, 'area': 0.30549725238233805}, '19': {'idA': 3, 'idB': 34, 'area': 652.4737143348902}, '20': {'idA': 4, 'idB': 11, 'area': 304.1954366406426}, '21': {'idA': 4, 'idB': 26, 'area': 374.7781918728724}, '22': {'idA': 4, 'idB': 27, 'area': 1136.7331539653242}, '23': {'idA': 4, 'idB': 31, 'area': 641.4654544740915}, '24': {'idA': 4, 'idB': 33, 'area': 356.9274835726246}, '25': {'idA': 4, 'idB': 36, 'area': 1136.7331539653242}, '26': {'idA': 5, 'idB': 11, 'area': 951.5514737144113}, '27': {'idA': 5, 'idB': 27, 'area': 2186.110865199007}, '28': {'idA': 5, 'idB': 31, 'area': 2186.110865199007}, '29': {'idA': 6, 'idB': 24, 'area': 203.49639673632737}, '30': {'idA': 7, 'idB': 11, 'area': 2765.886599473655}, '31': {'idA': 7, 'idB': 27, 'area': 3906.551383299753}, '32': {'idA': 7, 'idB': 31, 'area': 3850.957306601107}, '33': {'idA': 7, 'idB': 33, 'area': 375.3884344175458}, '34': {'idA': 7, 'idB': 36, 'area': 584.5902158394456}, '35': {'idA': 8, 'idB': 12, 'area': 101.45985933206975}, '36': {'idA': 8, 'idB': 26, 'area': 1317.881200613454}, '37': {'idA': 8, 'idB': 27, 'area': 325.7197281718254}, '38': {'idA': 8, 'idB': 36, 'area': 1303.577075899113}, '39': {'idA': 8, 'idB': 37, 'area': 118.26605574181303}, '40': {'idA': 9, 'idB': 14, 'area': 435.75957572925836}, '41': {'idA': 10, 'idB': 27, 'area': 740.8506107805297}, '42': {'idA': 11, 'idB': 27, 'area': 15594.047144243494}, '43': {'idA': 11, 'idB': 31, 'area': 8390.069815421477}, '44': {'idA': 11, 'idB': 33, 'area': 12845.692418519408}, '45': {'idA': 11, 'idB': 36, 'area': 13346.141624375246}, '46': {'idA': 12, 'idB': 26, 'area': 264.2482975171879}, '47': {'idA': 12, 'idB': 36, 'area': 264.2482975171879}, '48': {'idA': 12, 'idB': 37, 'area': 132.50374741852283}, '49': {'idA': 13, 'idB': 19, 'area': 369.8584604426287}, '50': {'idA': 13, 'idB': 29, 'area': 371.2926487775403}, '51': {'idA': 13, 'idB': 35, 'area': 124.7981290856842}, '52': {'idA': 14, 'idB': 17, 'area': 1672.417114325799}, '53': {'idA': 15, 'idB': 27, 'area': 1120.9867879422382}, '54': {'idA': 15, 'idB': 31, 'area': 1120.9867879422382}, '55': {'idA': 15, 'idB': 32, 'area': 36.48297996260226}, '56': {'idA': 15, 'idB': 34, 'area': 1120.9867879422382}, '57': {'idA': 16, 'idB': 28, 'area': 172.58128677785862}, '58': {'idA': 18, 'idB': 21, 'area': 820.3281393903308}, '59': {'idA': 18, 'idB': 25, 'area': 357.8900368907489}, '60': {'idA': 18, 'idB': 27, 'area': 1124.8534521691035}, '61': {'idA': 18, 'idB': 31, 'area': 296.9270998199936}, '62': {'idA': 19, 'idB': 29, 'area': 171.22294426249573}, '63': {'idA': 19, 'idB': 35, 'area': 371.39904815144837}, '64': {'idA': 21, 'idB': 23, 'area': 982.8666550805792}, '65': {'idA': 21, 'idB': 25, 'area': 188.27771923388354}, '66': {'idA': 21, 'idB': 27, 'area': 6146.193997200346}, '67': {'idA': 21, 'idB': 31, 'area': 486.5094079559203}, '68': {'idA': 23, 'idB': 27, 'area': 1211.2484661466442}, '69': {'idA': 23, 'idB': 31, 'area': 345.58149207383394}, '70': {'idA': 25, 'idB': 27, 'area': 8806.428617683123}, '71': {'idA': 25, 'idB': 28, 'area': 130.6211284993915}, '72': {'idA': 25, 'idB': 31, 'area': 5635.378027347164}, '73': {'idA': 26, 'idB': 27, 'area': 11025.93577158451}, '74': {'idA': 26, 'idB': 31, 'area': 1901.1667887195945}, '75': {'idA': 26, 'idB': 36, 'area': 47913.31681739213}, '76': {'idA': 26, 'idB': 37, 'area': 325.26017615944147}, '77': {'idA': 27, 'idB': 28, 'area': 972.4778348308755}, '78': {'idA': 27, 'idB': 31, 'area': 50310.42111277004}, '79': {'idA': 27, 'idB': 32, 'area': 1097.053681309335}, '80': {'idA': 27, 'idB': 33, 'area': 10418.719113104045}, '81': {'idA': 27, 'idB': 34, 'area': 2022.5504230866209}, '82': {'idA': 27, 'idB': 36, 'area': 25130.931101872586}, '83': {'idA': 30, 'idB': 35, 'area': 271.7839151066728}, '84': {'idA': 31, 'idB': 32, 'area': 1097.053681309335}, '85': {'idA': 31, 'idB': 33, 'area': 3146.9914759565145}, '86': {'idA': 31, 'idB': 34, 'area': 2022.5504230866209}, '87': {'idA': 31, 'idB': 36, 'area': 8380.926123800687}, '88': {'idA': 32, 'idB': 34, 'area': 62.23027809523046}, '89': {'idA': 32, 'idB': 36, 'area': 15.949271583929658}, '90': {'idA': 33, 'idB': 36, 'area': 13051.810711070895}, '91': {'idA': 36, 'idB': 37, 'area': 325.26017615944147}}}, 'panoptic_segmentation': {'0': {'name': 'shelf', 'area': 68632}, '1': {'name': 'curtain', 'area': 401587}, '2': {'name': 'window-blind', 'area': 24636}, '3': {'name': 'table', 'area': 54568}}}, {'imageId': '632913cc354779c2db08b6d7', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [511.7327575683594, 340.65093994140625, 549.1339721679688, 364.51373291015625], 'name': 'carrot', 'prob': 0.7252945303916931}, '1': {'coordinate': [454.08441162109375, 290.347412109375, 600.8590087890625, 339.7791442871094], 'name': 'bowl', 'prob': 0.9819536209106445}, '2': {'coordinate': [574.4869995117188, 200.02627563476562, 594.3703002929688, 277.6988830566406], 'name': 'bottle', 'prob': 0.9896602630615234}, '3': {'coordinate': [361.3047180175781, 360.9347229003906, 422.831298828125, 395.1675720214844], 'name': 'carrot', 'prob': 0.943374752998352}, '4': {'coordinate': [-0.09972640872001648, 251.01246643066406, 84.75713348388672, 290.7824401855469], 'name': 'sink', 'prob': 0.7255919575691223}, '5': {'coordinate': [127.92195892333984, 86.95527648925781, 332.5058898925781, 385.2647399902344], 'name': 'person', 'prob': 0.9993416666984558}, '6': {'coordinate': [262.4319152832031, 5.490492820739746, 482.96337890625, 329.1349182128906], 'name': 'person', 'prob': 0.9984690546989441}, '7': {'coordinate': [60.94186782836914, 251.22901916503906, 142.27500915527344, 272.2682800292969], 'name': 'sink', 'prob': 0.9805709719657898}, '8': {'coordinate': [243.41456604003906, 336.6963806152344, 325.3328552246094, 369.780517578125], 'name': 'knife', 'prob': 0.9834321141242981}, '9': {'coordinate': [380.259521484375, 264.0983581542969, 611.3814086914062, 399.95013427734375], 'name': 'oven', 'prob': 0.7926172018051147}, '10': {'coordinate': [379.1182556152344, 244.38145446777344, 611.2468872070312, 403.46771240234375], 'name': 'oven', 'prob': 0.7211033701896667}, '11': {'coordinate': [437.4015197753906, 266.49664306640625, 514.9474487304688, 291.712646484375], 'name': 'knife', 'prob': 0.9563960433006287}}, 'overlap': {'0': {'idA': 0, 'idB': 9, 'area': 892.4974407702684}, '1': {'idA': 0, 'idB': 10, 'area': 892.4974407702684}, '2': {'idA': 1, 'idB': 6, 'area': 1120.143119836226}, '3': {'idA': 1, 'idB': 9, 'area': 7255.3225777018815}, '4': {'idA': 1, 'idB': 10, 'area': 7255.3225777018815}, '5': {'idA': 1, 'idB': 11, 'area': 83.09231042861938}, '6': {'idA': 2, 'idB': 9, 'area': 270.42332741618156}, '7': {'idA': 2, 'idB': 10, 'area': 662.460453890264}, '8': {'idA': 3, 'idB': 9, 'area': 1457.353230625391}, '9': {'idA': 3, 'idB': 10, 'area': 1496.422012930736}, '10': {'idA': 4, 'idB': 7, 'area': 501.05558667803416}, '11': {'idA': 5, 'idB': 6, 'area': 16970.49006504938}, '12': {'idA': 5, 'idB': 7, 'area': 301.977568027447}, '13': {'idA': 5, 'idB': 8, 'area': 2710.195899148006}, '14': {'idA': 6, 'idB': 9, 'area': 6679.505591467023}, '15': {'idA': 6, 'idB': 10, 'area': 8801.233891952317}, '16': {'idA': 6, 'idB': 11, 'area': 1148.8879955727607}, '17': {'idA': 9, 'idB': 10, 'area': 31380.04389540665}, '18': {'idA': 9, 'idB': 11, 'area': 1955.3984095808119}, '19': {'idA': 10, 'idB': 11, 'area': 1955.3984095808119}}}, 'panoptic_segmentation': {'0': {'name': 'window', 'area': 103211}, '1': {'name': 'food', 'area': 38999}, '2': {'name': 'cabinet', 'area': 236704}, '3': {'name': 'ceiling', 'area': 28444}, '4': {'name': 'counter', 'area': 67369}, '5': {'name': 'wall', 'area': 85893}}}, {'imageId': '632913cc354779c2db08b6db', 'attributes': {'height': 388, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [0.0028823353350162506, 252.0472869873047, 9.796481132507324, 268.95843505859375], 'name': 'bowl', 'prob': 0.757896900177002}, '1': {'coordinate': [0.18428251147270203, 282.2306823730469, 131.6817169189453, 387.3287353515625], 'name': 'oven', 'prob': 0.9306049346923828}, '2': {'coordinate': [162.56121826171875, 164.4379119873047, 179.32664489746094, 202.44577026367188], 'name': 'bottle', 'prob': 0.873262345790863}, '3': {'coordinate': [112.09542083740234, 153.42428588867188, 125.18476104736328, 192.430419921875], 'name': 'bottle', 'prob': 0.9593839049339294}, '4': {'coordinate': [95.87908172607422, 149.057861328125, 111.72796630859375, 202.79359436035156], 'name': 'bottle', 'prob': 0.9814448356628418}, '5': {'coordinate': [548.548095703125, 36.99790573120117, 577.2840576171875, 53.5571174621582], 'name': 'bowl', 'prob': 0.8069807887077332}, '6': {'coordinate': [427.333251953125, 323.8323974609375, 535.94970703125, 387.9566345214844], 'name': 'bowl', 'prob': 0.9968519806861877}, '7': {'coordinate': [448.67291259765625, 285.3108825683594, 498.2165222167969, 316.31536865234375], 'name': 'sandwich', 'prob': 0.9195751547813416}, '8': {'coordinate': [373.81011962890625, 288.2014465332031, 461.1450500488281, 314.0047302246094], 'name': 'knife', 'prob': 0.9867532253265381}, '9': {'coordinate': [581.8794555664062, 279.26824951171875, 612.0587158203125, 308.2594299316406], 'name': 'bowl', 'prob': 0.7971720695495605}, '10': {'coordinate': [537.13720703125, 51.89031219482422, 603.078125, 124.7392349243164], 'name': 'microwave', 'prob': 0.8719881772994995}, '11': {'coordinate': [361.4433288574219, 187.7773895263672, 388.655517578125, 228.913330078125], 'name': 'bottle', 'prob': 0.7132236957550049}, '12': {'coordinate': [147.1449432373047, 167.13763427734375, 160.90884399414062, 205.2083282470703], 'name': 'bottle', 'prob': 0.8251306414604187}, '13': {'coordinate': [110.44243621826172, 183.50198364257812, 121.03130340576172, 207.1390380859375], 'name': 'knife', 'prob': 0.7586151957511902}, '14': {'coordinate': [135.97320556640625, 303.8075256347656, 222.63516235351562, 379.37908935546875], 'name': 'chair', 'prob': 0.8713371753692627}, '15': {'coordinate': [0.18814918398857117, 236.6151885986328, 134.8270263671875, 386.705078125], 'name': 'oven', 'prob': 0.968809187412262}, '16': {'coordinate': [205.40321350097656, 46.96031188964844, 479.4765930175781, 355.7718200683594], 'name': 'person', 'prob': 0.9994530081748962}, '17': {'coordinate': [125.16207122802734, 265.5054931640625, 609.8182983398438, 385.961181640625], 'name': 'dining table', 'prob': 0.8873444199562073}, '18': {'coordinate': [112.84901428222656, 180.7782745361328, 123.96919250488281, 206.267578125], 'name': 'knife', 'prob': 0.7986379861831665}, '19': {'coordinate': [127.87186431884766, 304.6764831542969, 606.8658447265625, 386.2017822265625], 'name': 'dining table', 'prob': 0.814873218536377}, '20': {'coordinate': [290.1741943359375, 313.4661865234375, 382.0536804199219, 379.9022521972656], 'name': 'bowl', 'prob': 0.9980142116546631}}, 'overlap': {'0': {'idA': 0, 'idB': 15, 'area': 162.487924299498}, '1': {'idA': 1, 'idB': 15, 'area': 13737.711034378124}, '2': {'idA': 1, 'idB': 17, 'area': 676.2861025666352}, '3': {'idA': 1, 'idB': 19, 'area': 310.59937264421023}, '4': {'idA': 3, 'idB': 13, 'area': 79.78345811087638}, '5': {'idA': 3, 'idB': 18, 'area': 129.57393336575478}, '6': {'idA': 4, 'idB': 13, 'area': 24.79994606866967}, '7': {'idA': 5, 'idB': 10, 'area': 47.89725268026814}, '8': {'idA': 6, 'idB': 16, 'area': 1665.4282064205036}, '9': {'idA': 6, 'idB': 17, 'area': 6748.2082959115505}, '10': {'idA': 6, 'idB': 19, 'area': 6774.3414786458015}, '11': {'idA': 7, 'idB': 8, 'area': 321.82210089080036}, '12': {'idA': 7, 'idB': 16, 'area': 955.0522809149697}, '13': {'idA': 7, 'idB': 17, 'area': 1536.074154987}, '14': {'idA': 7, 'idB': 19, 'area': 576.6323995171115}, '15': {'idA': 8, 'idB': 16, 'area': 2253.5279857944697}, '16': {'idA': 8, 'idB': 17, 'area': 2253.5279857944697}, '17': {'idA': 8, 'idB': 19, 'area': 814.6818088255823}, '18': {'idA': 8, 'idB': 20, 'area': 4.439517739228904}, '19': {'idA': 9, 'idB': 17, 'area': 809.980031568557}, '20': {'idA': 9, 'idB': 19, 'area': 89.52490251883864}, '21': {'idA': 11, 'idB': 16, 'area': 1119.3989774980582}, '22': {'idA': 13, 'idB': 18, 'area': 186.27467612433247}, '23': {'idA': 14, 'idB': 16, 'area': 895.4460638379678}, '24': {'idA': 14, 'idB': 17, 'area': 6549.179589497857}, '25': {'idA': 14, 'idB': 19, 'area': 6473.874030490406}, '26': {'idA': 15, 'idB': 17, 'area': 1164.1988253826275}, '27': {'idA': 15, 'idB': 19, 'area': 567.0216660869773}, '28': {'idA': 16, 'idB': 17, 'area': 24739.59727121098}, '29': {'idA': 16, 'idB': 19, 'area': 14003.871665576473}, '30': {'idA': 16, 'idB': 20, 'area': 3887.019868564792}, '31': {'idA': 17, 'idB': 19, 'area': 38934.88127420726}, '32': {'idA': 17, 'idB': 20, 'area': 6104.111571553163}, '33': {'idA': 19, 'idB': 20, 'area': 6104.111571553163}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 447870}, '1': {'name': 'cabinet', 'area': 61037}, '2': {'name': 'food', 'area': 40664}, '3': {'name': 'door-stuff', 'area': 76173}, '4': {'name': 'window', 'area': 73104}}}, {'imageId': '632913cc354779c2db08b6df', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [64.60090637207031, 333.2440490722656, 145.2723846435547, 400.21026611328125], 'name': 'bowl', 'prob': 0.8856605887413025}, '1': {'coordinate': [331.55780029296875, 131.48861694335938, 461.0308532714844, 190.7632293701172], 'name': 'knife', 'prob': 0.9760673642158508}, '2': {'coordinate': [224.9777374267578, 313.24261474609375, 268.9390869140625, 353.7640686035156], 'name': 'orange', 'prob': 0.9811433553695679}, '3': {'coordinate': [109.04398345947266, 278.9034729003906, 245.97239685058594, 382.573486328125], 'name': 'fork', 'prob': 0.9849261045455933}, '4': {'coordinate': [0.5714558959007263, 0.3258218765258789, 273.0832824707031, 177.47262573242188], 'name': 'person', 'prob': 0.9934709072113037}, '5': {'coordinate': [40.683448791503906, 109.81546783447266, 612.509033203125, 405.50701904296875], 'name': 'dining table', 'prob': 0.939620316028595}, '6': {'coordinate': [158.72804260253906, 128.8756103515625, 236.45855712890625, 176.4401092529297], 'name': 'knife', 'prob': 0.8497524261474609}, '7': {'coordinate': [495.8326416015625, 378.7595520019531, 599.3809204101562, 407.9831237792969], 'name': 'bowl', 'prob': 0.9533421397209167}, '8': {'coordinate': [280.4667663574219, 0.44821178913116455, 493.5566101074219, 165.64723205566406], 'name': 'person', 'prob': 0.9960152506828308}, '9': {'coordinate': [301.251953125, 298.5693054199219, 333.0953063964844, 321.845947265625], 'name': 'orange', 'prob': 0.8381083607673645}}, 'overlap': {'0': {'idA': 0, 'idB': 3, 'area': 1787.126643090276}, '1': {'idA': 0, 'idB': 5, 'area': 5402.263722947799}, '2': {'idA': 1, 'idB': 5, 'area': 7674.465035010595}, '3': {'idA': 1, 'idB': 8, 'area': 4422.620184108149}, '4': {'idA': 2, 'idB': 3, 'area': 850.7341230949387}, '5': {'idA': 2, 'idB': 5, 'area': 1781.3777947598137}, '6': {'idA': 3, 'idB': 5, 'area': 14195.370454895077}, '7': {'idA': 4, 'idB': 5, 'area': 15723.512242690718}, '8': {'idA': 4, 'idB': 6, 'area': 3697.2129727920983}, '9': {'idA': 5, 'idB': 6, 'area': 3697.2129727920983}, '10': {'idA': 5, 'idB': 7, 'area': 2769.654174586758}, '11': {'idA': 5, 'idB': 8, 'area': 11897.181914180517}, '12': {'idA': 5, 'idB': 9, 'area': 741.2063292665407}}}, 'panoptic_segmentation': {'0': {'name': 'floor-wood', 'area': 240776}, '1': {'name': 'food', 'area': 482236}}}, {'imageId': '632913cc354779c2db08b6e3', 'attributes': {'height': 389, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [263.3772888183594, 308.2655944824219, 330.2068176269531, 347.3662109375], 'name': 'bowl', 'prob': 0.9707821607589722}, '1': {'coordinate': [114.56187438964844, 315.5291442871094, 136.2111358642578, 332.9482116699219], 'name': 'apple', 'prob': 0.8642656207084656}, '2': {'coordinate': [74.60369110107422, 309.7039489746094, 108.2837905883789, 348.8556823730469], 'name': 'apple', 'prob': 0.8781289458274841}, '3': {'coordinate': [450.663330078125, 341.1011657714844, 495.28985595703125, 360.4489440917969], 'name': 'bowl', 'prob': 0.9505892395973206}, '4': {'coordinate': [308.5809631347656, 282.9507751464844, 411.4473571777344, 298.80181884765625], 'name': 'knife', 'prob': 0.9775062799453735}, '5': {'coordinate': [126.74430847167969, 314.72235107421875, 156.72105407714844, 334.6339416503906], 'name': 'apple', 'prob': 0.7068269848823547}, '6': {'coordinate': [0.008377410471439362, 266.3555603027344, 21.40154457092285, 288.7724914550781], 'name': 'cup', 'prob': 0.9396883249282837}, '7': {'coordinate': [542.5374755859375, 252.4137420654297, 597.9537353515625, 294.4898986816406], 'name': 'microwave', 'prob': 0.9838278293609619}, '8': {'coordinate': [479.7378845214844, 230.5264434814453, 516.4859008789062, 293.1311950683594], 'name': 'vase', 'prob': 0.8367006182670593}, '9': {'coordinate': [120.84867858886719, 312.77191162109375, 141.75961303710938, 329.4023132324219], 'name': 'apple', 'prob': 0.8523075580596924}, '10': {'coordinate': [449.0555419921875, 58.51570129394531, 507.817138671875, 124.61753845214844], 'name': 'potted plant', 'prob': 0.9226883053779602}, '11': {'coordinate': [122.93661499023438, 339.8233947753906, 144.7574462890625, 359.2272033691406], 'name': 'apple', 'prob': 0.815187931060791}, '12': {'coordinate': [95.36671447753906, 312.68505859375, 122.08596801757812, 347.3222351074219], 'name': 'apple', 'prob': 0.964410126209259}, '13': {'coordinate': [75.26575469970703, 310.973876953125, 101.59064483642578, 334.06732177734375], 'name': 'apple', 'prob': 0.9688290357589722}, '14': {'coordinate': [132.12757873535156, 253.6421661376953, 159.12542724609375, 282.6025390625], 'name': 'potted plant', 'prob': 0.986491858959198}, '15': {'coordinate': [115.02454376220703, 335.8303527832031, 145.07557678222656, 362.7336730957031], 'name': 'apple', 'prob': 0.9830801486968994}, '16': {'coordinate': [11.915877342224121, 220.93917846679688, 35.81210708618164, 277.8175354003906], 'name': 'potted plant', 'prob': 0.8101221919059753}, '17': {'coordinate': [214.1237030029297, 147.1774139404297, 350.66192626953125, 326.02593994140625], 'name': 'person', 'prob': 0.9992468357086182}, '18': {'coordinate': [102.83821105957031, 309.24468994140625, 129.1717987060547, 327.2453918457031], 'name': 'apple', 'prob': 0.939720094203949}, '19': {'coordinate': [43.13362503051758, 325.68634033203125, 613.4185791015625, 386.9350280761719], 'name': 'dining table', 'prob': 0.8205149173736572}, '20': {'coordinate': [339.7153015136719, 134.2469482421875, 498.40069580078125, 338.1763000488281], 'name': 'person', 'prob': 0.9992939233779907}}, 'overlap': {'0': {'idA': 0, 'idB': 17, 'area': 1186.9155185017735}, '1': {'idA': 0, 'idB': 19, 'area': 1448.8555371947587}, '2': {'idA': 1, 'idB': 5, 'area': 164.90330425277352}, '3': {'idA': 1, 'idB': 9, 'area': 213.1259651966393}, '4': {'idA': 1, 'idB': 12, 'area': 131.0626938994974}, '5': {'idA': 1, 'idB': 18, 'area': 171.1734901033342}, '6': {'idA': 1, 'idB': 19, 'area': 157.21415138896555}, '7': {'idA': 2, 'idB': 12, 'area': 447.4110452916939}, '8': {'idA': 2, 'idB': 13, 'area': 607.9323978759348}, '9': {'idA': 2, 'idB': 18, 'area': 95.52332220459357}, '10': {'idA': 2, 'idB': 19, 'area': 780.3457449967973}, '11': {'idA': 3, 'idB': 19, 'area': 863.4241299107671}, '12': {'idA': 4, 'idB': 17, 'area': 667.0271856365725}, '13': {'idA': 4, 'idB': 20, 'area': 1137.0279491059482}, '14': {'idA': 5, 'idB': 9, 'area': 220.42410281440243}, '15': {'idA': 5, 'idB': 18, 'area': 30.399559177458286}, '16': {'idA': 5, 'idB': 19, 'area': 268.2199684996158}, '17': {'idA': 6, 'idB': 16, 'area': 108.72448155999882}, '18': {'idA': 8, 'idB': 20, 'area': 1168.3806640538387}, '19': {'idA': 9, 'idB': 12, 'area': 20.57662010891363}, '20': {'idA': 9, 'idB': 18, 'area': 120.46451442316175}, '21': {'idA': 9, 'idB': 19, 'area': 77.70446573151276}, '22': {'idA': 11, 'idB': 15, 'area': 423.40723387897015}, '23': {'idA': 11, 'idB': 19, 'area': 423.40723387897015}, '24': {'idA': 12, 'idB': 13, 'area': 133.08171697007492}, '25': {'idA': 12, 'idB': 15, 'area': 81.14905658410862}, '26': {'idA': 12, 'idB': 18, 'area': 280.2537556611933}, '27': {'idA': 12, 'idB': 19, 'area': 578.0949580692686}, '28': {'idA': 13, 'idB': 19, 'area': 220.62841578572989}, '29': {'idA': 15, 'idB': 19, 'area': 808.4725670590997}, '30': {'idA': 17, 'idB': 19, 'area': 46.36832728609443}, '31': {'idA': 17, 'idB': 20, 'area': 1957.7877022712491}, '32': {'idA': 18, 'idB': 19, 'area': 41.05541968066245}, '33': {'idA': 19, 'idB': 20, 'area': 1981.974182290025}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 507009}, '1': {'name': 'window', 'area': 126339}, '2': {'name': 'cabinet', 'area': 74472}, '3': {'name': 'ceiling', 'area': 33010}, '4': {'name': 'door-stuff', 'area': 6781}, '5': {'name': 'wall-wood', 'area': 79707}}}, {'imageId': '632914e5354779c2db08b6e7', 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [0.11394582688808441, -0.06676800549030304, 16.964574813842773, 35.562435150146484], 'name': 'bottle', 'prob': 0.9148539900779724}, '1': {'coordinate': [96.89492797851562, 92.85528564453125, 149.84434509277344, 149.91268920898438], 'name': 'dining table', 'prob': 0.9576788544654846}, '2': {'coordinate': [113.75642395019531, 85.1057357788086, 144.47857666015625, 100.80021667480469], 'name': 'laptop', 'prob': 0.9784938097000122}, '3': {'coordinate': [37.66682052612305, 46.524959564208984, 73.54615783691406, 128.17095947265625], 'name': 'person', 'prob': 0.9805678725242615}, '4': {'coordinate': [69.56942749023438, 24.66136932373047, 100.36494445800781, 90.3447036743164], 'name': 'person', 'prob': 0.7027184367179871}, '5': {'coordinate': [28.18231201171875, 97.9918441772461, 68.56185150146484, 149.24716186523438], 'name': 'chair', 'prob': 0.7373656630516052}, '6': {'coordinate': [44.41250991821289, 52.974971771240234, 61.04452896118164, 76.81420135498047], 'name': 'cell phone', 'prob': 0.8783667683601379}, '7': {'coordinate': [38.82007598876953, 92.95704650878906, 55.434669494628906, 125.37741088867188], 'name': 'chair', 'prob': 0.7925463914871216}, '8': {'coordinate': [-0.040096789598464966, 19.851966857910156, 43.24635696411133, 143.33944702148438], 'name': 'person', 'prob': 0.9990317821502686}, '9': {'coordinate': [105.0103759765625, 31.444185256958008, 126.5670394897461, 85.61231994628906], 'name': 'person', 'prob': 0.9573771953582764}, '10': {'coordinate': [69.56572723388672, 24.635822296142578, 100.00332641601562, 115.50177001953125], 'name': 'person', 'prob': 0.9832358956336975}}, 'overlap': {'0': {'idA': 0, 'idB': 8, 'area': 264.73127240379}, '1': {'idA': 1, 'idB': 2, 'area': 244.08538438216783}, '2': {'idA': 1, 'idB': 10, 'area': 70.39429664611816}, '3': {'idA': 2, 'idB': 9, 'area': 6.4896550080156885}, '4': {'idA': 3, 'idB': 4, 'area': 174.25930618640268}, '5': {'idA': 3, 'idB': 5, 'area': 932.3847018601082}, '6': {'idA': 3, 'idB': 6, 'area': 396.49452040647157}, '7': {'idA': 3, 'idB': 7, 'area': 538.6511754835956}, '8': {'idA': 3, 'idB': 8, 'area': 455.5468315051694}, '9': {'idA': 3, 'idB': 10, 'area': 274.5574072355812}, '10': {'idA': 4, 'idB': 10, 'area': 1998.999958734028}, '11': {'idA': 5, 'idB': 7, 'area': 455.00005883793347}, '12': {'idA': 5, 'idB': 8, 'area': 683.118327728851}, '13': {'idA': 7, 'idB': 8, 'area': 143.50164206832414}}}, 'panoptic_segmentation': {'0': {'name': 'paper', 'area': 7622}}}, {'imageId': '632914e5354779c2db08b6eb', 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [66.62181091308594, 84.56367492675781, 97.33167266845703, 131.35821533203125], 'name': 'handbag', 'prob': 0.7465758323669434}, '1': {'coordinate': [-0.054536014795303345, 38.09510803222656, 60.98358154296875, 150.19798278808594], 'name': 'person', 'prob': 0.9733560085296631}, '2': {'coordinate': [0.022038817405700684, 52.9835090637207, 34.99045181274414, 150.1617889404297], 'name': 'person', 'prob': 0.9686804413795471}, '3': {'coordinate': [67.94507598876953, 13.973231315612793, 131.5884246826172, 150.28463745117188], 'name': 'person', 'prob': 0.9969537258148193}}, 'overlap': {'0': {'idA': 0, 'idB': 3, 'area': 1375.132285701111}, '1': {'idA': 1, 'idB': 2, 'area': 3398.1702249053465}}}, 'panoptic_segmentation': {'0': {'name': 'banner', 'area': 58252}}}, {'imageId': '632914e5354779c2db08b6ef', 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [6.0451202392578125, 83.49275970458984, 53.41551208496094, 131.125], 'name': 'chair', 'prob': 0.7206072211265564}, '1': {'coordinate': [5.986270427703857, 82.70198059082031, 25.237695693969727, 132.06423950195312], 'name': 'chair', 'prob': 0.8490645289421082}, '2': {'coordinate': [113.0283203125, 98.62174987792969, 149.95851135253906, 143.91094970703125], 'name': 'suitcase', 'prob': 0.9871096611022949}, '3': {'coordinate': [40.045623779296875, 60.693111419677734, 56.367156982421875, 82.16864776611328], 'name': 'handbag', 'prob': 0.754105806350708}, '4': {'coordinate': [63.35218048095703, 21.7064151763916, 77.21699523925781, 67.37018585205078], 'name': 'person', 'prob': 0.9908947944641113}, '5': {'coordinate': [6.666521072387695, 34.299896240234375, 67.33078002929688, 132.87786865234375], 'name': 'person', 'prob': 0.9991475343704224}, '6': {'coordinate': [71.9251708984375, 28.38128089904785, 136.19100952148438, 129.0768280029297], 'name': 'person', 'prob': 0.9685139060020447}, '7': {'coordinate': [41.548675537109375, 58.8112678527832, 46.947166442871094, 63.500457763671875], 'name': 'cell phone', 'prob': 0.7524163126945496}, '8': {'coordinate': [83.4301986694336, 84.04973602294922, 115.48234558105469, 127.00112915039062], 'name': 'chair', 'prob': 0.9412588477134705}, '9': {'coordinate': [71.69607543945312, 29.25604820251465, 145.11659240722656, 129.05648803710938], 'name': 'person', 'prob': 0.9049137830734253}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 914.1853659466287}, '1': {'idA': 0, 'idB': 5, 'area': 2226.7591734788584}, '2': {'idA': 1, 'idB': 5, 'area': 916.7151299543912}, '3': {'idA': 2, 'idB': 6, 'area': 705.4215094447136}, '4': {'idA': 2, 'idB': 8, 'area': 69.64371384051628}, '5': {'idA': 2, 'idB': 9, 'area': 976.5981591835152}, '6': {'idA': 3, 'idB': 5, 'area': 350.51367953326553}, '7': {'idA': 3, 'idB': 7, 'area': 15.155433707375778}, '8': {'idA': 4, 'idB': 5, 'area': 131.57343931304058}, '9': {'idA': 4, 'idB': 6, 'area': 206.32243625223055}, '10': {'idA': 4, 'idB': 9, 'area': 210.42509720180533}, '11': {'idA': 5, 'idB': 7, 'area': 25.3145490893221}, '12': {'idA': 6, 'idB': 8, 'area': 1376.6843625795445}, '13': {'idA': 6, 'idB': 9, 'area': 6413.758960919164}, '14': {'idA': 8, 'idB': 9, 'area': 1376.6843625795445}}}, 'panoptic_segmentation': {'0': {'name': 'pavement', 'area': 343258}}}, {'imageId': '632914e5354779c2db08b6f3', 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [6.0451202392578125, 83.49275970458984, 53.41551208496094, 131.125], 'name': 'chair', 'prob': 0.7206072211265564}, '1': {'coordinate': [5.986270427703857, 82.70198059082031, 25.237695693969727, 132.06423950195312], 'name': 'chair', 'prob': 0.8490645289421082}, '2': {'coordinate': [113.0283203125, 98.62174987792969, 149.95851135253906, 143.91094970703125], 'name': 'suitcase', 'prob': 0.9871096611022949}, '3': {'coordinate': [40.045623779296875, 60.693111419677734, 56.367156982421875, 82.16864776611328], 'name': 'handbag', 'prob': 0.754105806350708}, '4': {'coordinate': [63.35218048095703, 21.7064151763916, 77.21699523925781, 67.37018585205078], 'name': 'person', 'prob': 0.9908947944641113}, '5': {'coordinate': [6.666521072387695, 34.299896240234375, 67.33078002929688, 132.87786865234375], 'name': 'person', 'prob': 0.9991475343704224}, '6': {'coordinate': [71.9251708984375, 28.38128089904785, 136.19100952148438, 129.0768280029297], 'name': 'person', 'prob': 0.9685139060020447}, '7': {'coordinate': [41.548675537109375, 58.8112678527832, 46.947166442871094, 63.500457763671875], 'name': 'cell phone', 'prob': 0.7524163126945496}, '8': {'coordinate': [83.4301986694336, 84.04973602294922, 115.48234558105469, 127.00112915039062], 'name': 'chair', 'prob': 0.9412588477134705}, '9': {'coordinate': [71.69607543945312, 29.25604820251465, 145.11659240722656, 129.05648803710938], 'name': 'person', 'prob': 0.9049137830734253}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 914.1853659466287}, '1': {'idA': 0, 'idB': 5, 'area': 2226.7591734788584}, '2': {'idA': 1, 'idB': 5, 'area': 916.7151299543912}, '3': {'idA': 2, 'idB': 6, 'area': 705.4215094447136}, '4': {'idA': 2, 'idB': 8, 'area': 69.64371384051628}, '5': {'idA': 2, 'idB': 9, 'area': 976.5981591835152}, '6': {'idA': 3, 'idB': 5, 'area': 350.51367953326553}, '7': {'idA': 3, 'idB': 7, 'area': 15.155433707375778}, '8': {'idA': 4, 'idB': 5, 'area': 131.57343931304058}, '9': {'idA': 4, 'idB': 6, 'area': 206.32243625223055}, '10': {'idA': 4, 'idB': 9, 'area': 210.42509720180533}, '11': {'idA': 5, 'idB': 7, 'area': 25.3145490893221}, '12': {'idA': 6, 'idB': 8, 'area': 1376.6843625795445}, '13': {'idA': 6, 'idB': 9, 'area': 6413.758960919164}, '14': {'idA': 8, 'idB': 9, 'area': 1376.6843625795445}}}, 'panoptic_segmentation': {'0': {'name': 'pavement', 'area': 343258}}}, {'imageId': '632914e6354779c2db08b6f7', 'attributes': {'height': 150, 'width': 150}, 'object_detect': {'object': {'0': {'coordinate': [83.85919952392578, 47.28169250488281, 87.87818908691406, 60.0778694152832], 'name': 'tie', 'prob': 0.9088165760040283}, '1': {'coordinate': [114.48242950439453, 32.80266189575195, 147.8050079345703, 126.8514633178711], 'name': 'person', 'prob': 0.9991410970687866}, '2': {'coordinate': [117.99038696289062, 61.75221252441406, 136.4730987548828, 82.35226440429688], 'name': 'handbag', 'prob': 0.889991044998169}, '3': {'coordinate': [43.0402717590332, 85.99723052978516, 63.23572540283203, 98.62818145751953], 'name': 'frisbee', 'prob': 0.703628420829773}, '4': {'coordinate': [32.88535690307617, 96.22903442382812, 67.26811218261719, 131.65245056152344], 'name': 'chair', 'prob': 0.9451472163200378}, '5': {'coordinate': [117.79945373535156, 50.84833908081055, 136.9705810546875, 82.3585433959961], 'name': 'handbag', 'prob': 0.9322298765182495}, '6': {'coordinate': [-0.006397068500518799, 29.79129981994629, 12.883790969848633, 131.33892822265625], 'name': 'person', 'prob': 0.8125571608543396}, '7': {'coordinate': [11.852926254272461, 121.1464614868164, 17.679218292236328, 130.3458251953125], 'name': 'cup', 'prob': 0.8768479824066162}, '8': {'coordinate': [22.237693786621094, 122.07140350341797, 30.878774642944336, 131.84600830078125], 'name': 'cup', 'prob': 0.8066750168800354}, '9': {'coordinate': [0.010776892304420471, 30.414278030395508, 36.01173782348633, 131.70779418945312], 'name': 'person', 'prob': 0.9938784241676331}, '10': {'coordinate': [33.11544418334961, 56.13359069824219, 75.68634796142578, 139.22976684570312], 'name': 'person', 'prob': 0.9992058873176575}, '11': {'coordinate': [70.3190689086914, 29.553565979003906, 104.0953140258789, 123.16600036621094], 'name': 'person', 'prob': 0.9959352016448975}}, 'overlap': {'0': {'idA': 0, 'idB': 11, 'area': 51.4277014490508}, '1': {'idA': 1, 'idB': 2, 'area': 380.7448217959609}, '2': {'idA': 1, 'idB': 5, 'area': 604.0861387847108}, '3': {'idA': 2, 'idB': 5, 'area': 380.7448217959609}, '4': {'idA': 3, 'idB': 4, 'area': 48.45186270357226}, '5': {'idA': 3, 'idB': 10, 'area': 255.08778393815737}, '6': {'idA': 4, 'idB': 9, 'area': 110.74709234863985}, '7': {'idA': 4, 'idB': 10, 'area': 1209.8041707506054}, '8': {'idA': 6, 'idB': 7, 'area': 9.483299452840583}, '9': {'idA': 6, 'idB': 9, 'area': 1299.2044426961977}, '10': {'idA': 7, 'idB': 9, 'area': 53.598179529144545}, '11': {'idA': 8, 'idB': 9, 'area': 83.26883108114998}, '12': {'idA': 9, 'idB': 10, 'area': 218.88508492999244}, '13': {'idA': 10, 'idB': 11, 'area': 359.7816482651979}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 263601}, '1': {'name': 'pavement', 'area': 116480}}}, {'imageId': '632914e6354779c2db08b707', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [175.0190887451172, 0.4776921272277832, 371.16455078125, 250.90472412109375], 'name': 'person', 'prob': 0.78713458776474}, '1': {'coordinate': [478.40716552734375, 54.659976959228516, 611.8197021484375, 347.81011962890625], 'name': 'person', 'prob': 0.9948768019676208}, '2': {'coordinate': [165.93679809570312, 2.107835054397583, 370.85577392578125, 387.9115905761719], 'name': 'person', 'prob': 0.913496196269989}, '3': {'coordinate': [24.315488815307617, 6.317644119262695, 216.45034790039062, 405.9967346191406], 'name': 'person', 'prob': 0.9055546522140503}, '4': {'coordinate': [-0.247467041015625, 20.553844451904297, 167.72528076171875, 407.1293029785156], 'name': 'person', 'prob': 0.9924488067626953}, '5': {'coordinate': [157.01052856445312, 0.7607495784759521, 380.84674072265625, 407.0490417480469], 'name': 'person', 'prob': 0.7319321632385254}, '6': {'coordinate': [185.97727966308594, 240.3314666748047, 426.4595031738281, 407.4674072265625], 'name': 'person', 'prob': 0.9919509887695312}, '7': {'coordinate': [344.2085266113281, 65.36304473876953, 495.65216064453125, 326.1549072265625], 'name': 'person', 'prob': 0.9926579594612122}}, 'overlap': {'0': {'idA': 0, 'idB': 2, 'area': 48723.55803808318}, '1': {'idA': 0, 'idB': 3, 'area': 10133.55069758746}, '2': {'idA': 0, 'idB': 5, 'area': 49064.60546221641}, '3': {'idA': 0, 'idB': 6, 'area': 1958.0326933080796}, '4': {'idA': 0, 'idB': 7, 'area': 5001.465993957827}, '5': {'idA': 1, 'idB': 7, 'area': 4497.354395204224}, '6': {'idA': 2, 'idB': 3, 'area': 19275.664819518337}, '7': {'idA': 2, 'idB': 4, 'area': 657.0129611698212}, '8': {'idA': 2, 'idB': 5, 'area': 79058.51045291984}, '9': {'idA': 2, 'idB': 6, 'area': 27284.391089986777}, '10': {'idA': 2, 'idB': 7, 'area': 6949.38525730907}, '11': {'idA': 3, 'idB': 4, 'area': 55276.28468610676}, '12': {'idA': 3, 'idB': 5, 'area': 23756.852931664558}, '13': {'idA': 3, 'idB': 6, 'area': 5048.329014619114}, '14': {'idA': 4, 'idB': 5, 'area': 4141.200264461455}, '15': {'idA': 5, 'idB': 6, 'area': 32488.16400368116}, '16': {'idA': 5, 'idB': 7, 'area': 9554.9480963198}, '17': {'idA': 6, 'idB': 7, 'area': 7059.061797335744}}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 149349}}}, {'imageId': '632914e6354779c2db08b70b', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [48.97996139526367, 2.0441930294036865, 396.5402526855469, 405.36297607421875], 'name': 'person', 'prob': 0.9990538954734802}}, 'overlap': {}}, 'panoptic_segmentation': {'0': {'name': 'wall', 'area': 18571}}}, {'imageId': '632914e6354779c2db08b70f', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [0.18491175770759583, 258.2222900390625, 85.91038513183594, 407.0570068359375], 'name': 'person', 'prob': 0.9951294660568237}, '1': {'coordinate': [208.46588134765625, 47.59307098388672, 521.2777099609375, 405.3724365234375], 'name': 'person', 'prob': 0.9894952178001404}}, 'overlap': {}}, 'panoptic_segmentation': {}}, {'imageId': '632914e6354779c2db08b713', 'attributes': {'height': 408, 'width': 612}, 'object_detect': {'object': {'0': {'coordinate': [16.844694137573242, 195.21861267089844, 149.41896057128906, 330.0519714355469], 'name': 'person', 'prob': 0.981202244758606}, '1': {'coordinate': [69.55531311035156, 13.073620796203613, 361.1604919433594, 407.6097412109375], 'name': 'person', 'prob': 0.9974122643470764}, '2': {'coordinate': [394.53680419921875, 115.46208953857422, 611.2327880859375, 407.8034973144531], 'name': 'person', 'prob': 0.9994164705276489}}, 'overlap': {'0': {'idA': 0, 'idB': 1, 'area': 10768.28383035399}}}, 'panoptic_segmentation': {}}]
    rules = {'a': [['bowl(X,B)'], ['sandwich(X,A)']], 'b': [['none']]}
    print(label(human_label, need_label, rules))