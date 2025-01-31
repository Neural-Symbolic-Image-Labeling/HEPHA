import math,re,copy,json,time

#This function is to calculate the information gain to make sure the best literal can be added into the final output
def foil_gain(pre_p,pre_n,now_p,now_n):
    if (pre_p==0 or now_p==0):
        return -99                        #There are some cases that the numerator may be 0. Set to -99 for not affecting the normal comparision among the multiple gains
    gain=now_p*(math.log2(now_p/(now_n+now_p))-math.log2(pre_p/(pre_p+pre_n)))        #now_p:new positive, pre_n: previous negative
    return gain
'''print(foil_gain(3,3,3,2))'''

#This function can help change the input into the right format (two dimentional input, the number of first dimentional list is the number of images)
'''possible_clause=get_possile_clause(total_list)'''
'''def add_image(image_list):
    total_list=[]
    total_list.append(image_list)
    return total_list'''
#print(add_image(['people','has(person)']))
    
#This function is to get parameter(s), for example:only when you have "person" or "guitar", you can have overlap(person,guitar)
def get_parameter_list(result):
    parameter_list=[]
    for clause in result:
        a=re.split(r'[(|,|)]',clause)
        if a[0]!="overlap" and a[0]!="num" and a[0]!='area':
            parameter_list.append(a[2])
        '''for parameter_number,parameter in enumerate(a):
            if (parameter_number!=0 and parameter_number!=len(a)-1):     #The format is ["has(x,person)"],want to get "person"
                parameter_list.append(parameter)'''
    return parameter_list

'''This function is to get positive and negative list according to the target(such as "guitarist") and see if the image classified as "guitarist" has the clause,
if yes, it is positive, otherwise negative'''
def pos_neg_list(target,total_list):
    positive_list=[]
    negative_list=[]
    for image_number,image in enumerate(total_list):
        for i,clause in enumerate(image):
            if i==0:
                if clause==target:
                    positive_list.append(image_number)
                else:
                    negative_list.append(image_number)
    return positive_list,negative_list

"""This function is to get new possible list, such as we have a clause :has("person"), then next time we delete all the definition which does not has this clause.
return is a three dimentional list, for the second dimension, it is one-to-one correspond to the result_list (ie, [[has("person")],[has("guitar")]], then the inner
dimension has the correspond images which has the clause in the result_list"""
def get_new_total_list(result_list,total_list):
    del_number_hd=[]
    new_total=copy.deepcopy(total_list)
    for i in range(len(result_list)):
        if i!=len(result_list)-1:
            for image_number,image in enumerate(total_list):
                del_result=True
                for clause in result_list[i]:
                    if (clause not in image):        #remember the position of image that does not has special clause
                        del_result=False
                        break
                if del_result==True:
                    del_number_hd.append(image_number)
        else:
            for image_number,image in enumerate(total_list):
                for clause in result_list[i]:
                    if (clause not in image):
                        del_number_hd.append(image_number)
                        break
    del_number=list(set(del_number_hd))         #del_number has no duplicate
    del_number.sort()
    for i in range(len(del_number)):
        del new_total[del_number[len(del_number)-1-i]]               #the position is in positive sequence, first delete the back one
    return new_total   #two dimentional list, get the result which not has the positive that satisfy right side
    
def get_new_total_list1(result_list,total_list):        #use for outer loop
    del_number_hd=[]
    new_total=copy.deepcopy(total_list)           #use deepcopy for not changing the total_list
    for clauses_list in result_list:
        for image_number,image in enumerate(total_list):
            del_result=True
            for clause in clauses_list:
                if (clause not in image):        #remember the position of image that does not has special clause
                    del_result=False
                    break
            if del_result==True:
                del_number_hd.append(image_number)
    del_number=list(set(del_number_hd))         #del_number has no duplicate
    del_number.sort()
    for i in range(len(del_number)):
        del new_total[del_number[len(del_number)-1-i]]               #the position is in positive sequence, first delete the back one
    return new_total   #two dimentional list, get the result which not has the positive that satisfy right side

def get_possible_clause1(counting,total_list,result_list):
    if counting==0:
        new_total=get_new_total_list1(result_list,total_list)
        clause_total=[]
        for image in new_total:
            for i,clause in enumerate(image):
                if i!=0 and (clause not in clause_total):        # The first position of each image is classification, so clauses start from the second position
                    clause_total.append(clause)
    else:
        new_total=get_new_total_list(result_list,total_list)
        clause_total=[]
        for image in new_total:
            for i,clause in enumerate(image):
                if i!=0 and (clause not in result_list[len(result_list)-1]) and (clause not in clause_total):        # The first position of each image is classification, so clauses start from the second position
                    clause_total.append(clause)
    return clause_total
    
def rank_the_result(result_list):
    result=sorted(result_list,key=lambda i:len(i))
    return result

def get_total_list(total_list1):
    total_list=[]
    for image in total_list1:
        list=[]
        sub=re.split(r'[(|,|)]',image[0])[1]     #"campus(image1)",get "image1"
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

def get_int(elem):
    return int(elem)
    
def get_result_list(target,result_list,total_list,variable1,variable2):
    new_result_list=[]
    number=[]
    character=[]
    for image in result_list:
        for clauses in image:
            a=re.split(r'[¬|(|,|)]',clauses)
            if len(a)==5:
                if a[3] not in number:
                    number.append(a[3])
            elif a[0]!="overlap" and a[0]!="num" and a[0]!="area":
                if a[2] not in number:
                    number.append(a[2])
            elif a[0]=="overlap":
                if a[2] not in number:
                    number.append(a[2])
                if a[1] not in number:
                    number.append(a[1])
            else:
                if a[1] not in number:
                    number.append(a[1])
    number.sort(key=get_int)
    for i in range(len(number)):
        if i<13:
            character.append(chr(i+65))
        elif 13<=i<23:
            character.append(chr(i+65+1))
        else:
            character.append(chr(i+65+2))
    for image in result_list:
        result=[]
        for clauses in image:
            a=re.split(r'[¬|(|,|)]',clauses)
            if len(a)==5:
                position=number.index(a[3])
                a[3]=character[position]
                clause="¬"+a[1]+"("+a[2]+","+a[3]+")"+a[4]
                result.append(clause)
            elif a[0]!="overlap" and a[0]!='num'and a[0]!='area' and a[0]!='color':
                position=number.index(a[2])
                a[2]=character[position]
                clause=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                result.append(clause)
            elif a[0]=="overlap":
                position1=number.index(a[1])
                position2=number.index(a[2])
                a[1]=character[position1]
                a[2]=character[position2]
                clause=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                result.append(clause)
            elif a[0]=="color":
                position=number.index(a[1])
                a[1]=character[position]
                clause=a[0]+"("+a[1]+","+a[2]+")"+a[3]
                result.append(clause)
            else:
                position=number.index(a[1])
                a[1]=character[position]
                clause=a[0]+"("+a[1]+","+"N"+")"+a[3]
                result.append(clause)
                mini,maxi=threshold(target,clauses,total_list,variable1,variable2)
                if mini!=0:
                    threshold_clause="N>"+str(mini)
                else:
                    threshold_clause="N<"+str(maxi)
                result.append(threshold_clause)
        new_result_list.append(result)
    return new_result_list
    
def get_total_list1(input_list):
    total_object=[]
    total_list=[]
    object_detection=[]
    segmentation=[]
    for image_num in range(len(input_list)):
        for objects_num in range(len(input_list[image_num]['object_detect']['object'])):
            name=input_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            if name not in total_object:
                total_object.append(name)
                object_detection.append(name)
        for objects_num in range(len(input_list[image_num]['panoptic_segmentation'])):
            name=input_list[image_num]['panoptic_segmentation'][str(objects_num)]['name']
            if name not in total_object:
                total_object.append(name)
                segmentation.append(name)
    #total_object=segmentation+object_detection
    print(total_object)
    for image_num in range(len(input_list)):
        image_list=[]
        string=input_list[image_num]['type']+"(image"+str(input_list[image_num]['imageId'])+")"
        image_list.append(string)
        position_list=[]
        position_list1=[]
        name_list=[]
        for objects_num in range(len(input_list[image_num]['object_detect']['object'])):
            name=input_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            if position not in position_list:
                position_list.append(position)
                name_list.append(name)
        for objects_num in range(len(input_list[image_num]['panoptic_segmentation'])):
            name=input_list[image_num]['panoptic_segmentation'][str(objects_num)]['name']
            position=total_object.index(name)
            if position not in position_list1:
                position_list1.append(position)
        object_numbers=[0 for i in range(len(position_list))]
        for objects_num in range(len(input_list[image_num]['object_detect']['object'])):
            name=input_list[image_num]['object_detect']['object'][str(objects_num)]['name']
            position=total_object.index(name)
            object_numbers[position_list.index(position)]+=1
        for index,objects in enumerate(position_list):
            has=total_object[objects]+"(image"+str(input_list[image_num]['imageId'])+","+str(objects)+")"
            num="num"+"("+str(objects)+","+str(object_numbers[index])+")"
            image_list.append(has)
            image_list.append(num)
        for index,objects in enumerate(position_list1):
            has=total_object[objects]+"(image"+str(input_list[image_num]['imageId'])+","+str(objects)+")"
            area="area"+"("+str(objects)+","+str(input_list[image_num]['panoptic_segmentation'][str(index)]['area'])+")"
            image_list.append(has)
            image_list.append(area)
        for index,objects in enumerate(total_object):
            if (index not in position_list) and (index not in position_list1):
                not_has="¬"+objects+"(image"+str(input_list[image_num]['imageId'])+","+str(index)+")"
                image_list.append(not_has)
        for objects_num in range(len(input_list[image_num]['object_detect']['overlap'])):
            object1_name=input_list[image_num]['object_detect']['object'][str(input_list[image_num]['object_detect']['overlap'][str(objects_num)]["idA"])]['name']
            object2_name=input_list[image_num]['object_detect']['object'][str(input_list[image_num]['object_detect']['overlap'][str(objects_num)]["idB"])]['name']
            position1=total_object.index(object1_name)
            position2=total_object.index(object2_name)
            if position1<position2:
                overlap="overlap("+str(position1)+","+str(position2)+")"
            else:
                overlap="overlap("+str(position2)+","+str(position1)+")"
            if overlap not in image_list:
                image_list.append(overlap)
        total_list.append(image_list)
    return total_list,object_detection,segmentation

def tfidf(target,total_list):
    pos_total_num=0
    pos_num=0
    num_image=len(total_list)
    for image in total_list:
         if image[0]==target:
             pos_total_num+=(len(image)-1)
             pos_num+=1
    neg_num=num_image-pos_num
    result_list=[]
    for image in total_list:
        if image[0]==target:
            for predicate_pos,predicate in enumerate(image):
                if predicate_pos!=0:
                    word_pos_total_num=0
                    word_total_num=0
                    for images in total_list:
                        if images[0]==target and (predicate in images):
                            word_pos_total_num+=1
                        if predicate in images:
                            word_total_num+=1
                    tf=word_pos_total_num/pos_total_num
                    idf=math.log(num_image/(1+word_total_num))
                    #idf=math.log(1+(word_pos_total_num/pos_num)*(0.01+(word_total_num-word_pos_total_num)/neg_num))
                    result=idf
                    #limit1=math.log((1+num_image/(1+pos_num))/2)
                    #limit2=math.log((num_image/2+num_image/(1+pos_num))/2)
                    if predicate not in result_list and 3>result>0.001:
                        result_list.append(predicate)
                        #result_list.append(result)
    #print(result_list)
    return result_list

def tfidf_test(target,total_list):
    pos_total_num=0
    num_image=len(total_list)
    for image in total_list:
         if image[0]==target:
             pos_total_num+=(len(image)-1)
    result_list=[]
    for image in total_list:
        if image[0]==target:
            #print(image)
            for predicate_pos,predicate in enumerate(image):
                if predicate_pos!=0:
                    word_pos_total_num=0
                    word_total_num=0
                    for images in total_list:
                        if images[0]==target and (predicate in images):
                            word_pos_total_num+=1
                        if predicate in images:
                            word_total_num+=1
                    tf=word_pos_total_num/pos_total_num
                    idf=math.log(num_image/(1+word_total_num))
                    #print(predicate,word_total_num,num_image)
                    result=tf*idf
                    if predicate not in result_list:
                        #result_list.append(tf)
                        #result_list.append(idf)
                        result_list.append(predicate)
                        result_list.append(result)
    return result_list

def change_total(total_list):
    result_list=[]
    for image in total_list:
        new=[]
        tfidf_list=tfidf(image[0],total_list)
        for predicate in image:
            if predicate in tfidf_list:
                new.append(predicate)
        still_has=[]
        new_image=[]
        new_image.append(image[0])
        for predicate in new:
            a=re.split(r'[¬|(|,|)]',predicate)
            if len(a)==5:
                if predicate not in new_image:
                    new_image.append(predicate)
            elif a[0]!="overlap" and a[0]!='num'and a[0]!='area' and a[0]!='color':
                still_has.append(a[2])
                if predicate not in new_image:
                    new_image.append(predicate)
            elif a[0]=="num" or a[0]=="area":
                if a[1] in still_has and predicate not in new_image:
                    new_image.append(predicate)
            elif a[0]=="overlap":
                if a[1] in still_has and a[2] in still_has and predicate not in new_image:
                    new_image.append(predicate)
        result_list.append(new_image)
    return result_list

def threshold(target,clause,total_list,variable1,variable2):
    a1=re.split(r'[(|,|)]',clause)
    if a1[0]=='num':
        positive_list=[]
        negative_list=[]
        positive_greater=negative_greater=0
        for image in total_list:
            for clauses in image:
                a=re.split(r'[(|,|)]',clauses)
                if a[0]=='num' and a[1]==a1[1]:
                    if image[0]==target:
                        positive_list.append(int(a[2]))
                    else:
                        negative_list.append(int(a[2]))
        for number in positive_list:
            if number>variable1:
                positive_greater+=1
        for number in negative_list:
            if number>variable1:
                negative_greater+=1
        if positive_greater>2/3*len(positive_list) and negative_greater<=1/3*len(negative_list):
            return variable1,10000
        elif positive_greater<=1/3*len(positive_list) and negative_greater>2/3*len(negative_list):
            return 0,variable1
        else:
            return False
    if a1[0]=='area':
        positive_list=[]
        negative_list=[]
        positive_greater=negative_greater=0
        for image in total_list:
            for clauses in image:
                a=re.split(r'[(|,|)]',clauses)
                if a[0]=='area' and a[1]==a1[1]:
                    if image[0]==target:
                        positive_list.append(float(a[2]))
                    else:
                        negative_list.append(float(a[2]))
        for number in positive_list:
            if number>variable2:
                positive_greater+=1
        for number in negative_list:
            if number>variable2:
                negative_greater+=1
        if positive_greater>2/3*len(positive_list) and negative_greater<=1/3*len(negative_list):
            return variable2,10000
        elif positive_greater<=1/3*len(positive_list) and negative_greater>2/3*len(negative_list):
            return 0,variable2
        else:
            return False

def still_has(possible_clause,foil_gain_list):
    has=False
    for clause_num,clauses in enumerate(possible_clause):
        a=re.split(r'[(|,|)]',clauses)
        if a[1]=='X' and foil_gain_list[clause_num]!=-99:
            has=True
            break
    return has

def still_has_num(result):
    has=0
    for clause_num,clauses in enumerate(result):
        a=re.split(r'[(|,|)]',clauses)
        if a[1]=='X':
            has+=1
    return has

def get_object_list(total_list):
    object_list=[]
    for image in total_list:
        for clauses in image:
            a=re.split(r'[(|,|)]',clauses)
            if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4 and (a[0] not in object_list):
                object_list.append(a[0])
    return object_list

def locking(target,total_list,lock):
    new_total_list=copy.deepcopy(total_list)
    c=re.split(r'[(|,|)]',target)
    delete_list=[]
    final_list=[]
    #print(lock['a'])
    for rule in lock[c[0]]:
        if rule==[]:
            continue
        for i,image in enumerate(new_total_list):
            satisfy_list=["False" for i in range(len(rule))]
            object_in_rule=[]
            object_character=[]
            for position,clauses in enumerate(rule):
                #print(clauses)
                a=re.split(r'[¬|(|,|)]',clauses)
                if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4:
                    object_in_rule.append(a[0])
                    object_character.append(a[2])
                    for predicate in image:
                        b=re.split(r'[(|,|)]',predicate)
                        if b[0]==a[0]:
                            satisfy_list[position]="True"
                            break
                elif len(a)==5:
                    for predicate in image:
                        b=re.split(r'[¬|(|,|)]',predicate)
                        if b[1]==a[1]:
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
                delete_list.append(i)
    #print(delete_list)
    for i,image in enumerate(new_total_list):
        if i not in delete_list:
            final_list.append(image)
    return final_list

def cha_to_num(target,total_list,lists):
    object_list=get_object_list(total_list)
    c=re.split(r'[(|,|)]',target)
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
            if len(a)==1:
                if len(re.split(r'[<]',predicate))==1:
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


def foil(target_list,target,total_list,variable1,variable2,deleted,locked):         #target should be a string, such as "guitarist"
    delete=copy.deepcopy(deleted)
    lock=copy.deepcopy(locked)
    if delete=={}:
        for targets in target_list:
            get_targets=re.split(r'[(|,|)]',targets)
            delete[get_targets[0]]=[[]]
    if lock=={}:
        for targets in target_list:
            get_targets=re.split(r'[(|,|)]',targets)
            lock[get_targets[0]]=[[]]
    for label in delete:
        if delete[label]==[]:
            delete[label]=[[]]
    for label in lock:
        if lock[label]==[]:
            lock[label]=[[]]
    #print(lock)
    result_list=[]     #two dimentional list
    object_list=get_object_list(total_list)
    #delete=cha_to_num(target,total_list,delete)
    new_lock=cha_to_num(target,total_list,lock)
    #print("this",lock)
    new_total_list=locking(target,total_list,lock)
    total_list1=copy.deepcopy(new_total_list)
    #print(new_total_list)
    positive_list,negative_list=pos_neg_list(target,new_total_list)   #get the initial_positive_list,to help find out the result that can satisfy all the positives
    c=re.split(r'[(|,|)]',target)
    initial_neg_length = len(negative_list)
    initial_pos_length = len(positive_list)
    i=0   #make sure that all the result in the result list has been proved that fulfill our requirements(can satisfy all the positives and reject all the negatives)
    #start=time.time()
    #print(positive_list)
    #print(len(positive_list),initial_pos_length)
    while (len(positive_list)> 0*initial_pos_length):
        #print("right")
        counting=0
        while (len(negative_list)> 0*initial_neg_length):
            if len(result_list)==i:                #the result_list is empty at initial state
                result=[]
            else:
                result=result_list[i]
            pre_p=len(positive_list)
            pre_n=len(negative_list)
            foil_gain_list=[]
            possible_clause=get_possible_clause1(counting,total_list1,result_list)
            for new_clause in possible_clause:           #calculate the new possible clause foil_gain
                now_p=now_n=0
                for image_number,image in enumerate(new_total_list):
                    for clause in image:
                        if clause==new_clause:
                            for positive_image_number in positive_list:
                                if image_number==positive_image_number:
                                    now_p+=1  
                            for negative_image_number in negative_list:
                                if image_number==negative_image_number:
                                    now_n+=1
                foil_gain_list.append(foil_gain(pre_p,pre_n,now_p,now_n))
            correct_clause=False              #first set false, if the correct one is found, jump out of the iteration
            parameter_list=get_parameter_list(result)
            #print(possible_clause)
            #print(foil_gain_list)    
            while correct_clause == False:
                for clause_number,clause_gain in enumerate(foil_gain_list):
                    if max(foil_gain_list)==-99:
                        return None
                    if clause_gain==max(foil_gain_list):
                        a=re.split(r'[¬|(|,|)]',possible_clause[clause_number])
                        if a[0]=="overlap":
                            if (a[1] in parameter_list) and (a[2] in parameter_list) and still_has_num(result)>=2:
                                new_result=copy.deepcopy(result)    #The following is to first add it to result, if it is a special case 
                                new_result.append(possible_clause[clause_number])       # such that only one positive has the clause and no negative has it, it may has the best gain.
                                result_list.append(new_result)
                                correct_clause=True
                                break
                            else:
                                foil_gain_list[clause_number]=-99
                                break
                        elif a[0]=="num" or a[0]=='area':
                            if a[1] in parameter_list and threshold(target,possible_clause[clause_number],total_list1,variable1,variable2)!=False and still_has_num(result)>=3:
                                new_result=copy.deepcopy(result)
                                new_result.append(possible_clause[clause_number])
                                result_list.append(new_result)
                                correct_clause=True
                                break
                            else:
                                foil_gain_list[clause_number]=-99
                                break 
                        else:
                            new_result=copy.deepcopy(result)
                            new_result.append(possible_clause[clause_number])
                            result_list.append(new_result)
                            correct_clause=True
                            break
            if counting!=0:          #Each time, because we add the updated version at the end of the list, so delete the old version
                del result_list[i]
            #print("This is result_list",result_list)
            #print(new_total_list)
            new_total_list=get_new_total_list(result_list,total_list1)
            #print(new_total_list[0])
            positive_list,negative_list=pos_neg_list(target,new_total_list)   # can use for next iteration when the answer is not perfect
            #print("This is ",positive_list)
            counting+=1           #just for the special case that at first the list is empty and we cannot delete the new added one. (Or we can say that we cannot delete the old empty version)
        delete_result=False
        for rule in delete[c[0]]:
                #print(result_list[i])
                if len(result_list[i])==len(rule):
                    result_in=True
                    for predicate in rule:
                        if predicate not in result_list[i]:
                            a=re.split(r'[¬|(|,|)]',predicate)
                            if a[0]!='num' and a[0]!='area':
                                result_in=False
                                break
                            else:
                                result_ins=False
                                for element in result_list[i]:
                                    b=re.split(r'[(|,|)]',element)
                                    if b[0]==a[0] and b[1]==a[1]:
                                        result_ins=True
                                        break
                                if result_ins==False:
                                    result_in=False
                                    break
                    if result_in==True:
                        del result_list[i]   
                        delete_result=True
                        break
        #print(result_list)
        if delete_result==True:
            continue        
        new_total_list=get_new_total_list1(result_list,total_list1)
        #print(new_total_list)
        positive_list,negative_list=pos_neg_list(target,new_total_list)
        i+=1
    for rule in lock[c[0]]:
        if rule!=[]:
            result_list.insert(0,rule)
    return result_list

def plural(word):
    special_list=['person','grass']
    plural_list=['people','grass']
    if word in special_list:
        return plural_list[special_list.index(word)]
    elif word.endswith('y'):
        return word[:-1]+"ies"
    elif word[-1] in 'sx' or word[-2:] in ['sh','ch']:
        return word+'es'
    elif word.endswith('an'):
        return word[:-2]+'en'
    else:
        return word+'s'
    
def NL(result_list,target,total_list):
    result=[]
    for results in result_list:
        result_list=[]
        objects=[]
        characters=[]
        for i,clauses in enumerate(results):
            n=''
            a=re.split(r'[¬|(|,|)]',clauses)
            if len(a)==5:
                n+='This image does not has '+a[1]
            elif a[0]!='overlap' and a[0]!="num" and a[0]!='area' and a[0]!='color' and len(a)==4:
                n+='This image has '+a[0]
                objects.append(a[0])
                characters.append(a[2])
            elif a[0]=="overlap":
                index1=characters.index(a[1])
                index2=characters.index(a[2])
                n+=objects[index1]+' is overlapping with '+objects[index2]
            elif a[0]=="color":
                index1=characters.index(a[1])
                n+='The color of '+objects[index1]+' is '+a[2]
            elif a[0]=='num':
                index=characters.index(a[1])
                object_name=objects[index]
                b=re.split(r'[<]',results[i+1])
                if len(b)!=1:
                    object_name= plural(object_name)
                    max=b[1]
                    n+='The number of '+object_name+" is less than "+max
                else:
                    b=re.split(r'[>]',results[i+1])
                    object_name= plural(object_name)
                    min=b[1]
                    n+='The number of '+object_name+" is greater than "+min
            elif a[0]=='area':
                index=characters.index(a[1])
                object_name=objects[index]
                b=re.split(r'[<]',results[i+1])
                if len(b)!=1:
                    max=b[1]
                    n+='The area of '+object_name+"is less than "+max
                else:
                    b=re.split(r'[>]',results[i+1])
                    min=b[1]
                    n+='The area of '+object_name+" is greater than "+min
            elif len(a)==1:
                b=re.split(r'[<]',clauses)
                if len(b)!=1:
                    object_name= plural(object_name)
                    max=b[1]
                    n+='The number is less than '+max
                else:
                    b=re.split(r'[>]',clauses)
                    object_name= plural(object_name)
                    min=b[1]
                    n+='The number is greater than '+min
            result_list.append(n)
        result.append(result_list)
    return result

def neg_FOIL(input_list,deleted,locked):
    global_variable1=10
    global_variable2=30
    dict_math={}
    dict_nl={}
    start=time.time()
    total_list1,object_detection,segmentation=get_total_list1(input_list)
    #print(object_detection)
    #print(segmentation)
    total_list=get_total_list(total_list1)
    #total_list_new=get_total_list(total_list1)
    #total_list=change_total(total_list_new)
    #object_list=get_object_list(total_list)    #initial object_list
    object_list=segmentation+object_detection
    #print(object_list)
    #print(total_list[0])
    target_list=[]
    for images in total_list:
        if images[0] not in target_list:
            target_list.append(images[0])
    for target in target_list:
        #print(target_list)
        result_list=foil(target_list,target,total_list,global_variable1,global_variable2,deleted,locked)
        if result_list==None:
            dict_math[target]=[['none']]
            dict_nl[target]=[['none']]
        else:
            math_format=get_result_list(target,result_list,total_list,global_variable1,global_variable2)
            natural_language=NL(math_format,target,result_list)
            dict_math[target]=result_list
            dict_nl[target]=natural_language
    end=time.time()
    with open("time.txt", "a") as f:
        f.write(str(end-start)+'\n')
    return dict_math,dict_nl,object_list,object_detection,segmentation
    #end=time.time()
    #print(end-start)

def main():
    input_list={"imageId": 1, "type": "downtown", "object_detect": {"object": {"0": {"coordinate": [53.72274398803711, 1, 218.57183837890625, 80.22314453125], "name": "tree", "prob": ""}, "1": {"coordinate": [159.80792236328125, 68.70646667480469, 241.29510498046875, 161.11410522460938], "name": "people", "prob": ""}, "2": {"coordinate": [60.43117141723633, 50.98613739013672, 85.02925109863281, 74.02437591552734], "name": "sign", "prob": ""}, "3": {"coordinate": [173.03334045410156, 128.81167602539062, 185.89761352539062, 159.0655059814453], "name": "pants", "prob": ""}, "4": {"coordinate": [1, 1, 54.487510681152344, 106.64070129394531], "name": "building", "prob": ""}, "5": {"coordinate": [67.45184326171875, 78.28890991210938, 82.33528137207031, 194], "name": "pole", "prob": ""}, "6": {"coordinate": [23.536527633666992, 88.72528076171875, 74.17586517333984, 116.10242462158203], "name": "car", "prob": ""}, "7": {"coordinate": [167.4889373779297, 79.05294799804688, 194.5413055419922, 162.79290771484375], "name": "person", "prob": ""}, "8": {"coordinate": [219.76768493652344, 76.2762451171875, 244.6170196533203, 160.63079833984375], "name": "person", "prob": ""}, "9": {"coordinate": [15.302437782287598, 85.9482421875, 65.42327880859375, 119.3118896484375], "name": "car", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 1, "area": 1.3469034158642688}, "1": {"idA": 0, "idB": 2, "area": 1.1278438621314668}, "2": {"idA": 0, "idB": 4, "area": 0.12058118509205573}, "3": {"idA": 0, "idB": 5, "area": 0.0572942348542748}, "4": {"idA": 0, "idB": 7, "area": 0.06300319914126602}, "5": {"idA": 1, "idB": 3, "area": 0.7745761453788016}, "6": {"idA": 1, "idB": 7, "area": 4.418159927679789}, "7": {"idA": 1, "idB": 8, "area": 3.614090474552127}, "8": {"idA": 3, "idB": 7, "area": 0.7745761453788016}, "9": {"idA": 4, "idB": 6, "area": 1.1035701890329883}, "10": {"idA": 4, "idB": 9, "area": 1.613731478212867}, "11": {"idA": 5, "idB": 6, "area": 0.36636650716738367}, "12": {"idA": 6, "idB": 9, "area": 2.28225055275697}}}, "panoptic_segmentation": {"0": {"name": "tree", "area": 537.8736615850019}, "1": {"name": "pavement", "area": 179.51080683039447}, "2": {"name": "flower", "area": 111.04366516737652}, "3": {"name": "fence", "area": 110.69139832026428}, "4": {"name": "building", "area": 518.8333399673606}, "5": {"name": "road", "area": 18.244238347331134}}}, {"imageId": 2, "type": "downtown", "object_detect": {"object": {"0": {"coordinate": [1, 1, 139.9405975341797, 135.53628540039062], "name": "building", "prob": ""}, "1": {"coordinate": [180.2319793701172, 1, 300, 130.92990112304688], "name": "building", "prob": ""}, "2": {"coordinate": [2.1371705532073975, 92.29581451416016, 265.0692443847656, 168], "name": "street", "prob": ""}, "3": {"coordinate": [102.75601959228516, 124.598876953125, 279.6453552246094, 163.35646057128906], "name": "road", "prob": ""}, "4": {"coordinate": [53.237239837646484, 1, 299.9039611816406, 150.42239379882812], "name": "buildings", "prob": ""}, "5": {"coordinate": [142.98040771484375, 118.72898864746094, 300, 164.26644897460938], "name": "street", "prob": ""}, "6": {"coordinate": [202.5288848876953, 110.3990478515625, 249.59646606445312, 146.15350341796875], "name": "car", "prob": ""}, "7": {"coordinate": [12.134008407592773, 95.82539367675781, 42.66816329956055, 142.8629150390625], "name": "people", "prob": ""}, "8": {"coordinate": [169.41383361816406, 13.8364839553833, 191.00057983398438, 87.70540618896484], "name": "shutter", "prob": ""}, "9": {"coordinate": [100.2275390625, 107.39332580566406, 132.365478515625, 134.18336486816406], "name": "car", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 2, "area": 11.822787842050632}, "1": {"idA": 0, "idB": 3, "area": 0.8069502319239767}, "2": {"idA": 0, "idB": 4, "area": 23.144340627446322}, "3": {"idA": 0, "idB": 7, "area": 2.4058303944197728}, "4": {"idA": 0, "idB": 9, "area": 1.7082870105902352}, "5": {"idA": 1, "idB": 2, "area": 6.503194929041673}, "6": {"idA": 1, "idB": 3, "area": 1.2487866772784084}, "7": {"idA": 1, "idB": 4, "area": 30.851128499941076}, "8": {"idA": 1, "idB": 5, "area": 2.899363367220974}, "9": {"idA": 1, "idB": 6, "area": 1.9173365138565368}, "10": {"idA": 1, "idB": 8, "area": 1.5783033933133244}, "11": {"idA": 2, "idB": 3, "area": 12.48188171077068}, "12": {"idA": 2, "idB": 4, "area": 24.4306940621791}, "13": {"idA": 2, "idB": 5, "area": 11.030983246516413}, "14": {"idA": 2, "idB": 6, "area": 3.3390391662750125}, "15": {"idA": 2, "idB": 7, "area": 2.849704291688203}, "16": {"idA": 2, "idB": 9, "area": 1.7082870105902352}, "17": {"idA": 3, "idB": 4, "area": 9.06330305263206}, "18": {"idA": 3, "idB": 5, "area": 10.509530021392347}, "19": {"idA": 3, "idB": 6, "area": 2.0129447041046142}, "20": {"idA": 3, "idB": 9, "area": 0.5630783754396751}, "21": {"idA": 4, "idB": 5, "area": 9.867939995665525}, "22": {"idA": 4, "idB": 6, "area": 3.3390391662750125}, "23": {"idA": 4, "idB": 8, "area": 3.1638684077231973}, "24": {"idA": 4, "idB": 9, "area": 1.7082870105902352}, "25": {"idA": 5, "idB": 6, "area": 2.561122173004107}}}, "panoptic_segmentation": {"0": {"name": "building", "area": 1481.4246031746031}, "1": {"name": "road", "area": 406.0337301587301}, "2": {"name": "pavement", "area": 86.5873015873016}, "3": {"name": "sky", "area": 75.42261904761904}}}, {"imageId": 3, "type": "downtown", "object_detect": {"object": {"0": {"coordinate": [164.43960571289062, 139.35948181152344, 194.26080322265625, 157.60484313964844], "name": "car", "prob": ""}, "1": {"coordinate": [1, 116.13583374023438, 193.54672241210938, 183], "name": "street", "prob": ""}, "2": {"coordinate": [174.9248809814453, 1, 275.1100158691406, 183], "name": "building", "prob": ""}, "3": {"coordinate": [28.27298355102539, 1, 275.1100158691406, 151.73104858398438], "name": "buildings", "prob": ""}, "4": {"coordinate": [1, 1, 104.76575469970703, 148.29014587402344], "name": "building", "prob": ""}, "5": {"coordinate": [119.56991577148438, 136.62362670898438, 275.1100158691406, 179.79031372070312], "name": "street", "prob": ""}, "6": {"coordinate": [69.5536880493164, 134.80528259277344, 275.1100158691406, 183], "name": "street", "prob": ""}, "7": {"coordinate": [188.7552947998047, 135.65794372558594, 209.36729431152344, 155.66404724121094], "name": "van", "prob": ""}, "8": {"coordinate": [1, 2.875933885574341, 248.00790405273438, 179.24368286132812], "name": "buildings", "prob": ""}, "9": {"coordinate": [57.0814094543457, 160.31898498535156, 175.82469177246094, 176.08120727539062], "name": "lines", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 1, "area": 1.0552804001930396}, "1": {"idA": 0, "idB": 2, "area": 0.701025112575106}, "2": {"idA": 0, "idB": 3, "area": 0.7331046919559091}, "3": {"idA": 0, "idB": 5, "area": 1.081169446205773}, "4": {"idA": 0, "idB": 6, "area": 1.081169446205773}, "5": {"idA": 0, "idB": 7, "area": 0.17837043676915834}, "6": {"idA": 0, "idB": 8, "area": 1.081169446205773}, "7": {"idA": 1, "idB": 2, "area": 2.4741855965880055}, "8": {"idA": 1, "idB": 3, "area": 11.689923979712107}, "9": {"idA": 1, "idB": 4, "area": 6.629938331669289}, "10": {"idA": 1, "idB": 5, "area": 6.345422073288219}, "11": {"idA": 1, "idB": 6, "area": 11.874434677753284}, "12": {"idA": 1, "idB": 7, "area": 0.1904774899143398}, "13": {"idA": 1, "idB": 8, "area": 24.145473436154035}, "14": {"idA": 1, "idB": 9, "area": 3.71914160227918}, "15": {"idA": 2, "idB": 3, "area": 30.006975527372536}, "16": {"idA": 2, "idB": 5, "area": 8.593463210976589}, "17": {"idA": 2, "idB": 6, "area": 9.594424767645009}, "18": {"idA": 2, "idB": 7, "area": 0.8194054563248032}, "19": {"idA": 2, "idB": 8, "area": 25.612495315303192}, "20": {"idA": 2, "idB": 9, "area": 0.0281828469090197}, "21": {"idA": 3, "idB": 4, "area": 22.38774251524612}, "22": {"idA": 3, "idB": 5, "area": 4.669269569110823}, "23": {"idA": 3, "idB": 6, "area": 6.913459121094859}, "24": {"idA": 3, "idB": 7, "area": 0.6583185881631651}, "25": {"idA": 3, "idB": 8, "area": 64.99486695385573}, "26": {"idA": 4, "idB": 6, "area": 0.9435268845122309}, "27": {"idA": 4, "idB": 8, "area": 29.983140488911292}, "28": {"idA": 5, "idB": 6, "area": 13.341581358543333}, "29": {"idA": 5, "idB": 7, "area": 0.7798532314221035}, "30": {"idA": 5, "idB": 8, "area": 10.877365668437045}, "31": {"idA": 5, "idB": 9, "area": 1.761947907011917}, "32": {"idA": 6, "idB": 7, "area": 0.8194054563248032}, "33": {"idA": 6, "idB": 8, "area": 15.758012678332847}, "34": {"idA": 6, "idB": 9, "area": 3.3284991230397876}, "35": {"idA": 7, "idB": 8, "area": 0.8194054563248032}, "36": {"idA": 8, "idB": 9, "area": 3.71914160227918}}}, "panoptic_segmentation": {"0": {"name": "building", "area": 1394.2712369597616}, "1": {"name": "road", "area": 267.5370094386488}, "2": {"name": "pavement", "area": 62.75409836065574}, "3": {"name": "sky", "area": 159.51117734724292}}}, {"imageId": 4, "type": "highway", "object_detect": {"object": {"0": {"coordinate": [152.2637481689453, 62.25938034057617, 167.3902130126953, 75.10128021240234], "name": "car", "prob": ""}, "1": {"coordinate": [23.445770263671875, 1, 200, 27.946285247802734], "name": "sky", "prob": ""}, "2": {"coordinate": [38.51877212524414, 90.47447204589844, 66.19488525390625, 118.3319091796875], "name": "car", "prob": ""}, "3": {"coordinate": [16.27655029296875, 1, 152.6809844970703, 121.6506118774414], "name": "train", "prob": ""}, "4": {"coordinate": [1.6880874633789062, 3.6604747772216797, 200, 31.909849166870117], "name": "sky", "prob": ""}, "5": {"coordinate": [108.84426879882812, 9.772014617919922, 200, 61.15297317504883], "name": "person", "prob": ""}, "6": {"coordinate": [66.73662567138672, 119.5621337890625, 95.58306121826172, 149.32940673828125], "name": "phone", "prob": ""}, "7": {"coordinate": [23.240406036376953, 68.69247436523438, 88.16389465332031, 131.06520080566406], "name": "car", "prob": ""}, "8": {"coordinate": [1, 26.961458206176758, 84.99134063720703, 72.44792175292969], "name": "water", "prob": ""}, "9": {"coordinate": [170.03817749023438, 92.2249755859375, 197.38131713867188, 118.93345642089844], "name": "foot", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 3, "area": 0.0178603571622322}, "1": {"idA": 1, "idB": 3, "area": 11.608029822646834}, "2": {"idA": 1, "idB": 4, "area": 14.292541870519635}, "3": {"idA": 1, "idB": 5, "area": 5.522296427716501}, "4": {"idA": 1, "idB": 8, "area": 0.20203913998717324}, "5": {"idA": 2, "idB": 3, "area": 2.56995193863113}, "6": {"idA": 2, "idB": 7, "area": 2.56995193863113}, "7": {"idA": 3, "idB": 4, "area": 12.844466434132773}, "8": {"idA": 3, "idB": 5, "area": 7.507908241906747}, "9": {"idA": 3, "idB": 6, "area": 0.20081716189160942}, "10": {"idA": 3, "idB": 7, "area": 11.46075679316098}, "11": {"idA": 3, "idB": 8, "area": 10.418642687053216}, "12": {"idA": 4, "idB": 5, "area": 6.726634985067066}, "13": {"idA": 4, "idB": 8, "area": 1.3740568833390716}, "14": {"idA": 6, "idB": 7, "area": 0.8215977036064335}, "15": {"idA": 7, "idB": 8, "area": 0.7730079534481047}}}, "panoptic_segmentation": {"0": {"name": "road", "area": 1679.0366666666666}, "1": {"name": "grass", "area": 196.47}, "2": {"name": "sky", "area": 554.6833333333334}, "3": {"name": "tree", "area": 239.84}}}, {"imageId": 5, "type": "highway", "object_detect": {"object": {"0": {"coordinate": [31.22481346130371, 2.58532977104187, 266, 111.0450668334961], "name": "bridge", "prob": ""}, "1": {"coordinate": [1, 132.2581787109375, 109.92855834960938, 190], "name": "tracks", "prob": ""}, "2": {"coordinate": [20.353740692138672, 168.1821746826172, 43.00471878051758, 186.8877716064453], "name": "vehicle", "prob": ""}, "3": {"coordinate": [1, 56.588504791259766, 222.64425659179688, 190], "name": "bridge", "prob": ""}, "4": {"coordinate": [26.796833038330078, 1, 217.84854125976562, 153.35482788085938], "name": "train", "prob": ""}, "5": {"coordinate": [60.340816497802734, 1, 244.83836364746094, 166.54783630371094], "name": "building", "prob": ""}, "6": {"coordinate": [4.4856438636779785, 1, 245.13137817382812, 29.930753707885742], "name": "wall", "prob": ""}, "7": {"coordinate": [88.64205169677734, 106.33787536621094, 104.34859466552734, 136.36514282226562], "name": "sign", "prob": ""}, "8": {"coordinate": [120.3564224243164, 149.67547607421875, 254.89962768554688, 190], "name": "street", "prob": ""}, "9": {"coordinate": [1.0571049451828003, 122.98873901367188, 266, 190], "name": "street", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 3, "area": 20.62533593376737}, "1": {"idA": 0, "idB": 4, "area": 40.04978323434153}, "2": {"idA": 0, "idB": 5, "area": 39.59350109323245}, "3": {"idA": 0, "idB": 6, "area": 11.573735051321542}, "4": {"idA": 0, "idB": 7, "area": 0.1462875050317524}, "5": {"idA": 1, "idB": 2, "area": 0.8383459953535393}, "6": {"idA": 1, "idB": 3, "area": 12.445060050451842}, "7": {"idA": 1, "idB": 4, "area": 3.470124344642607}, "8": {"idA": 1, "idB": 5, "area": 3.3643583080674526}, "9": {"idA": 1, "idB": 7, "area": 0.12763396969863344}, "10": {"idA": 1, "idB": 9, "area": 12.438535825007706}, "11": {"idA": 2, "idB": 3, "area": 0.8383459953535393}, "12": {"idA": 2, "idB": 9, "area": 0.8383459953535393}, "13": {"idA": 3, "idB": 4, "area": 36.57968208265799}, "14": {"idA": 3, "idB": 5, "area": 35.312183963012984}, "15": {"idA": 3, "idB": 7, "area": 0.933170887480553}, "16": {"idA": 3, "idB": 8, "area": 8.161274666012883}, "17": {"idA": 3, "idB": 9, "area": 29.380361001599375}, "18": {"idA": 4, "idB": 5, "area": 47.48132626833128}, "19": {"idA": 4, "idB": 6, "area": 10.936426426642662}, "20": {"idA": 4, "idB": 7, "area": 0.933170887480553}, "21": {"idA": 4, "idB": 8, "area": 0.7097503038591859}, "22": {"idA": 4, "idB": 9, "area": 11.479012960190124}, "23": {"idA": 5, "idB": 6, "area": 10.561244749299165}, "24": {"idA": 5, "idB": 7, "area": 0.933170887480553}, "25": {"idA": 5, "idB": 8, "area": 4.155726462966696}, "26": {"idA": 5, "idB": 9, "area": 15.90135853990014}, "27": {"idA": 7, "idB": 9, "area": 0.4157045136268874}, "28": {"idA": 8, "idB": 9, "area": 10.734845072433293}}}, "panoptic_segmentation": {"0": {"name": "fence", "area": 99.0799366838148}, "1": {"name": "tree", "area": 44.16303917688959}, "2": {"name": "sky", "area": 232.3565492679066}, "3": {"name": "road", "area": 1298.8009497427781}}}, {"imageId": 6, "type": "highway", "object_detect": {"object": {"0": {"coordinate": [39.57346725463867, 16.640880584716797, 79.61009979248047, 41.636962890625], "name": "sign", "prob": ""}, "1": {"coordinate": [52.01001739501953, 133.42510986328125, 80.19564819335938, 157.6800079345703], "name": "basket", "prob": ""}, "2": {"coordinate": [10.431106567382812, 15.329824447631836, 172.17361450195312, 180.72097778320312], "name": "bridge", "prob": ""}, "3": {"coordinate": [43.18440246582031, 1, 211.83201599121094, 140.35472106933594], "name": "train", "prob": ""}, "4": {"coordinate": [228.21237182617188, 79.84798431396484, 240.41213989257812, 101.99079132080078], "name": "chimney", "prob": ""}, "5": {"coordinate": [73.60723876953125, 1, 198.26315307617188, 183], "name": "bridge", "prob": ""}, "6": {"coordinate": [27.986543655395508, 2.768213987350464, 147.5013885498047, 183], "name": "tracks", "prob": ""}, "7": {"coordinate": [114.947509765625, 59.34185791015625, 275.1100158691406, 183], "name": "road", "prob": ""}, "8": {"coordinate": [67.68669128417969, 112.71853637695312, 86.0795669555664, 131.4995880126953], "name": "car", "prob": ""}, "9": {"coordinate": [97.41386413574219, 29.764009475708008, 275.1100158691406, 169.4478302001953], "name": "bridge", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 2, "area": 1.9885920758416213}, "1": {"idA": 0, "idB": 3, "area": 1.8092394007497223}, "2": {"idA": 0, "idB": 5, "area": 0.29815798946958166}, "3": {"idA": 0, "idB": 6, "area": 1.9885920758416213}, "4": {"idA": 1, "idB": 2, "area": 1.358449283832526}, "5": {"idA": 1, "idB": 3, "area": 0.38810822261280853}, "6": {"idA": 1, "idB": 5, "area": 0.3175383984637287}, "7": {"idA": 1, "idB": 6, "area": 1.358449283832526}, "8": {"idA": 2, "idB": 3, "area": 32.045430502002134}, "9": {"idA": 2, "idB": 5, "area": 32.3934556631744}, "10": {"idA": 2, "idB": 6, "area": 39.27808850036413}, "11": {"idA": 2, "idB": 7, "area": 13.802392899470059}, "12": {"idA": 2, "idB": 8, "area": 0.6864134082744168}, "13": {"idA": 2, "idB": 9, "area": 20.750576388596585}, "14": {"idA": 3, "idB": 5, "area": 34.51841066635856}, "15": {"idA": 3, "idB": 6, "area": 28.519840525813205}, "16": {"idA": 3, "idB": 7, "area": 15.59640585215715}, "17": {"idA": 3, "idB": 8, "area": 0.6864134082744168}, "18": {"idA": 3, "idB": 9, "area": 25.143735385840177}, "19": {"idA": 4, "idB": 7, "area": 0.536785116388661}, "20": {"idA": 4, "idB": 9, "area": 0.536785116388661}, "21": {"idA": 5, "idB": 6, "area": 26.46413232148021}, "22": {"idA": 5, "idB": 7, "area": 20.47224572042195}, "23": {"idA": 5, "idB": 8, "area": 0.4654613803871812}, "24": {"idA": 5, "idB": 9, "area": 27.992079476496773}, "25": {"idA": 6, "idB": 7, "area": 7.99911012075438}, "26": {"idA": 6, "idB": 8, "area": 0.6864134082744168}, "27": {"idA": 6, "idB": 9, "area": 13.902467522677172}, "28": {"idA": 7, "idB": 9, "area": 35.04192440921391}}}, "panoptic_segmentation": {"0": {"name": "grass", "area": 703.3462493790363}, "1": {"name": "road", "area": 827.9701937406855}, "2": {"name": "tree", "area": 266.956780923994}}}, {"imageId": 7, "type": "mountain", "object_detect": {"object": {"0": {"coordinate": [18.967044830322266, 1, 249.89993286132812, 107.74800109863281], "name": "sky", "prob": ""}, "1": {"coordinate": [122.30303955078125, 113.78858184814453, 269.146728515625, 165.61431884765625], "name": "road", "prob": ""}, "2": {"coordinate": [1, 1, 200.1698455810547, 61.78056335449219], "name": "clouds", "prob": ""}, "3": {"coordinate": [143.78334045410156, 1, 300, 71.12395477294922], "name": "sky", "prob": ""}, "4": {"coordinate": [1, 70.67668914794922, 169.65184020996094, 168], "name": "water", "prob": ""}, "5": {"coordinate": [84.44731903076172, 19.636030197143555, 300, 168], "name": "picture", "prob": ""}, "6": {"coordinate": [150.14927673339844, 119.38446807861328, 290.8342590332031, 168], "name": "road", "prob": ""}, "7": {"coordinate": [126.70770263671875, 1, 300, 94.60942840576172], "name": "sky", "prob": ""}, "8": {"coordinate": [1, 55.74809265136719, 237.08465576171875, 168], "name": "ground", "prob": ""}, "9": {"coordinate": [1, 112.05692291259766, 144.51187133789062, 166.6377410888672], "name": "grass", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 2, "area": 21.852397442542294}, "1": {"idA": 0, "idB": 3, "area": 14.76451414012667}, "2": {"idA": 0, "idB": 4, "area": 11.08349812647522}, "3": {"idA": 0, "idB": 5, "area": 28.925309316298026}, "4": {"idA": 0, "idB": 7, "area": 22.880861617771203}, "5": {"idA": 0, "idB": 8, "area": 22.50415833168437}, "6": {"idA": 1, "idB": 4, "area": 4.868822401200305}, "7": {"idA": 1, "idB": 5, "area": 15.099766675258122}, "8": {"idA": 1, "idB": 6, "area": 10.915147694025238}, "9": {"idA": 1, "idB": 8, "area": 11.802860821680431}, "10": {"idA": 1, "idB": 9, "area": 2.283708482668901}, "11": {"idA": 2, "idB": 3, "area": 6.800007038109471}, "12": {"idA": 2, "idB": 5, "area": 9.676729875497974}, "13": {"idA": 2, "idB": 7, "area": 8.85926673290669}, "14": {"idA": 2, "idB": 8, "area": 2.3839013063762753}, "15": {"idA": 3, "idB": 4, "area": 0.022956529188723793}, "16": {"idA": 3, "idB": 5, "area": 15.95887219084034}, "17": {"idA": 3, "idB": 7, "area": 21.735178509479738}, "18": {"idA": 3, "idB": 8, "area": 2.846405079230502}, "19": {"idA": 4, "idB": 5, "area": 16.45314702524474}, "20": {"idA": 4, "idB": 6, "area": 1.881205351673998}, "21": {"idA": 4, "idB": 7, "area": 2.039227871412766}, "22": {"idA": 4, "idB": 8, "area": 32.56697513992942}, "23": {"idA": 4, "idB": 9, "area": 15.54165745164602}, "24": {"idA": 5, "idB": 6, "area": 13.570387396539447}, "25": {"idA": 5, "idB": 7, "area": 25.778397652189593}, "26": {"idA": 5, "idB": 8, "area": 33.99569877116162}, "27": {"idA": 5, "idB": 9, "area": 6.504707159354034}, "28": {"idA": 6, "idB": 8, "area": 8.385733520335634}, "29": {"idA": 7, "idB": 8, "area": 8.51070602170177}, "30": {"idA": 8, "idB": 9, "area": 15.54165745164602}}}, "panoptic_segmentation": {"0": {"name": "road", "area": 368.37103174603175}, "1": {"name": "mountain", "area": 278.67261904761904}, "2": {"name": "grass", "area": 378.5}, "3": {"name": "sky", "area": 1191.845238095238}}}, {"imageId": 8, "type": "mountain", "object_detect": {"object": {"0": {"coordinate": [153.50442504882812, 1, 318, 137.17279052734375], "name": "cat", "prob": ""}, "1": {"coordinate": [19.689496994018555, 1, 272.41943359375, 122.06089782714844], "name": "wall", "prob": ""}, "2": {"coordinate": [178.7138671875, 111.53673553466797, 315.1858215332031, 159], "name": "tracks", "prob": ""}, "3": {"coordinate": [49.27947235107422, 1, 316.4447021484375, 150.792236328125], "name": "room", "prob": ""}, "4": {"coordinate": [81.40144348144531, 95.1271743774414, 198.233642578125, 156.1953887939453], "name": "bushes", "prob": ""}, "5": {"coordinate": [0.4220235049724579, 1, 234.6543426513672, 105.53791046142578], "name": "wall", "prob": ""}, "6": {"coordinate": [1, 11.090051651000977, 209.85638427734375, 159], "name": "building", "prob": ""}, "7": {"coordinate": [207.2923126220703, 102.32119750976562, 318, 159], "name": "line", "prob": ""}, "8": {"coordinate": [1, 102.95709991455078, 182.98355102539062, 159], "name": "floor", "prob": ""}, "9": {"coordinate": [111.9258041381836, 1, 260.9398498535156, 50.20563888549805], "name": "wall", "prob": ""}}, "overlap": {"0": {"idA": 0, "idB": 1, "area": 28.471891340475597}, "1": {"idA": 0, "idB": 2, "area": 6.919430652593615}, "2": {"idA": 0, "idB": 3, "area": 43.88282152990873}, "3": {"idA": 0, "idB": 4, "area": 3.719527532380641}, "4": {"idA": 0, "idB": 5, "area": 16.777902021847055}, "5": {"idA": 0, "idB": 6, "area": 14.052073415963076}, "6": {"idA": 0, "idB": 7, "area": 7.630907132654713}, "7": {"idA": 0, "idB": 8, "area": 1.9948749138673525}, "8": {"idA": 0, "idB": 9, "area": 10.455339417842517}, "9": {"idA": 1, "idB": 2, "area": 1.9504224290340193}, "10": {"idA": 1, "idB": 3, "area": 53.42653385774581}, "11": {"idA": 1, "idB": 4, "area": 6.223500139415139}, "12": {"idA": 1, "idB": 5, "area": 44.44439655805175}, "13": {"idA": 1, "idB": 6, "area": 41.73683872575186}, "14": {"idA": 1, "idB": 7, "area": 2.542600867281544}, "15": {"idA": 1, "idB": 8, "area": 6.169725502440834}, "16": {"idA": 1, "idB": 9, "area": 14.501663941963777}, "17": {"idA": 2, "idB": 3, "area": 10.595456888774931}, "18": {"idA": 2, "idB": 4, "area": 1.7240751569734127}, "19": {"idA": 2, "idB": 6, "area": 2.9233921220509007}, "20": {"idA": 2, "idB": 7, "area": 10.12811626822862}, "21": {"idA": 2, "idB": 8, "area": 0.40080126019769113}, "22": {"idA": 3, "idB": 4, "area": 12.862370160498546}, "23": {"idA": 3, "idB": 5, "area": 38.326612066869274}, "24": {"idA": 3, "idB": 6, "area": 44.36720344291362}, "25": {"idA": 3, "idB": 7, "area": 10.4638457929853}, "26": {"idA": 3, "idB": 8, "area": 12.649327246622336}, "27": {"idA": 3, "idB": 9, "area": 14.501663941963777}, "28": {"idA": 4, "idB": 5, "area": 2.405579666364167}, "29": {"idA": 4, "idB": 6, "area": 14.11086148725863}, "30": {"idA": 4, "idB": 8, "area": 10.695893331755633}, "31": {"idA": 5, "idB": 6, "area": 39.01356412697755}, "32": {"idA": 5, "idB": 7, "area": 0.17407498987174833}, "33": {"idA": 5, "idB": 8, "area": 0.9288894186228648}, "34": {"idA": 5, "idB": 9, "area": 11.943625938500556}, "35": {"idA": 6, "idB": 7, "area": 0.28742634966981423}, "36": {"idA": 6, "idB": 8, "area": 20.17104934004038}, "37": {"idA": 6, "idB": 9, "area": 7.576069281986918}}}, "panoptic_segmentation": {"0": {"name": "grass", "area": 92.65851825481587}, "1": {"name": "mountain", "area": 1703.8388513112616}, "2": {"name": "sea", "area": 271.0869823187374}, "3": {"name": "rock", "area": 172.50108777342666}, "4": {"name": "road", "area": 269.2239231043076}, "5": {"name": "sky", "area": 22.23606661128911}}}
    deleted={"downtown": [], "highway": [], "mountain": []} 
    #locked={"downtown": [["building(X,4)", "tree(X,9)"]], "highway": [], "mountain": []}
    locked={}
main()