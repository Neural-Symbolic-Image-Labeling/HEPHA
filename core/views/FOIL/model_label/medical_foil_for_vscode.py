import math,re,copy,json,time,random

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
    #print(elem)
    return float(elem)
    
def get_result_list(target,result_list,total_list,variable1,locked):
    new_result_list=[]
    number=[]
    character=[]
    #print("this is result_list",result_list)
    for image in result_list:
        for clauses in image:
            a=re.split(r'[¬|(|,|)]',clauses)
            if len(a)==5:
                if a[3] not in number:
                    number.append(a[3])
            elif a[0]!="overlap" and a[0]!="num" and a[0]!="area" and len(a)==4:
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
    #print(number)
    number.sort(key=get_int)
    for i in range(len(number)):
        if i<13:
            character.append(chr(i+65))
        elif 13<=i<23:
            character.append(chr(i+65+1))
        else:
            character.append(chr(i+65+2))
    #print(locked['gdrishti'])
    for image in result_list:
        result=[]
        for clauses in image:
            a=re.split(r'[¬|(|,|)]',clauses)
            if len(a)==5 and a[0]!='threshold':
                position=number.index(a[3])
                a[3]=character[position]
                clause="¬"+a[1]+"("+a[2]+","+a[3]+")"+a[4]
                result.append(clause)
            elif a[0]!="overlap" and a[0]!='num'and a[0]!='area' and len(a)==4:
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
            elif a[0]=='threshold':
                continue
            else:
                position=number.index(a[1])
                a[1]=character[position]
                clause=a[0]+"("+a[1]+","+"N"+")"+a[3]
                #print(clause)
                result.append(clause)
                mini,maxi=threshold(target,clauses,total_list,variable1,locked)
                #print(mini,maxi)
                if mini!=0:
                    threshold_clause="N>"+str(mini)
                else:
                    threshold_clause="N<"+str(maxi)
                threshold_clause="threshold(N,"+str(mini)+","+str(maxi)+")"
                result.append(threshold_clause)
        new_result_list.append(result)
    return new_result_list
    
def get_total_list1(input_list):
    #list=dict_list
    #list=[load_dict1]
    total_object=["OC","OD","HCup","HDisc","VCup","VDisc"]
    total_object1=["ACDR","HCDR","VCDR"]
    total_list=[]
    for image_num in range(len(input_list)):
        image_list=[]
        string=input_list[image_num]['type']+"(image"+str(input_list[image_num]['imageId'])+")"
        image_list.append(string)
        position_list1=[0,1,2]
        for index,objects in enumerate(position_list1):
            has=total_object1[objects]+"(image"+str(input_list[image_num]['imageId'])+","+str(objects)+")"
            area1=float(input_list[image_num]['object_detect']['space'][total_object[objects*2]])
            area2=float(input_list[image_num]['object_detect']['space'][total_object[objects*2+1]])
            area="area"+"("+str(objects)+","+str(round(area1/area2,2))+")"
            image_list.append(has)
            image_list.append(area)
        total_list.append(image_list)
    return total_list

def threshold(target,clause,total_list,variable1,locked):
    a1=re.split(r'[(|,|)]',clause)
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
        #print(positive_list)
        mini=min(positive_list)
        maxi=max(positive_list)
        negative_num=0
        for number in negative_list:
            if maxi>number>mini:
                negative_num+=1
        while (negative_num!=0 and mini!=maxi):
            negative_num=0
            mini+=0.01
            maxi-=0.01
            for number in negative_list:
                if mini<number<maxi:
                    negative_num+=1
        if mini!=maxi:
            if target=='ndrishti(X)':
                if locked['ndrishti']!=[]:
                    maxi_list=[]
                    for rule in locked['ndrishti']:
                        a=re.split(r'[¬|(|,|)]',rule[2])   #hard code
                        maxi_list.append(a[3])
                    maximum=max(maxi_list)
                    maxi=maximum
                mini=0
            else:
                if locked['gdrishti']!=[]:
                    mini_list=[]
                    for rule in locked['gdrishti']:
                        a=re.split(r'[¬|(|,|)]',rule[2])   #hard code
                        mini_list.append(a[2])
                    minimum=min(mini_list)
                    mini=minimum
                maxi=10000
            return mini,maxi
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

def still_has_OD(possible_clause,foil_gain_list):
    has=False
    for clause_num,clauses in enumerate(possible_clause):
        a=re.split(r'[(|,|)]',clauses)
        if a[1]=='1' and foil_gain_list[clause_num]!=-99:
            has=True
            break
    return has

def still_has_num(result):
    has=0
    for clause_num,clauses in enumerate(result):
        a=re.split(r'[¬|(|,|)]',clauses)
        if a[1]=='X':
            has+=1
    return has

def has_OD(result):
    has=0
    for clause_num,clauses in enumerate(result):
        a=re.split(r'[¬|(|,|)]',clauses)
        if a[1]=='1':
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
    clause_json = {'lock': lock, 'total_list': total_list}
    with open('clause.json', 'w') as f:
        json.dump(clause_json, f)
    new_total_list=copy.deepcopy(total_list)
    c=re.split(r'[(|,|)]',target)
    delete_list=[]
    final_list=[]
    for rule in lock[c[0]]:
        #print(rule)
        if rule==[]:
            continue
        for i,image in enumerate(new_total_list):
            satisfy_list=["False" for i in range(len(rule))]
            object_in_rule=[]
            object_character=[]
            for position,clauses in enumerate(rule):
                #print(position,clauses)
                a=re.split(r'[(|,|)]',clauses)
                #print(len(a))
                if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4:
                    object_in_rule.append(a[0])
                    object_character.append(a[2])
                    for predicate in image:
                        b=re.split(r'[(|,|)]',predicate)
                        if b[0]==a[0]:
                            satisfy_list[position]="True"
                            break
                elif a[0]=='area':
                    object_in_image=[]
                    object_number=[]
                    object1_in_rule=object_in_rule[object_character.index(a[1])]
                    #print(object1_in_rule)
                    for predicate in image:
                        b=re.split(r'[(|,|)]',predicate)
                        if b[0]!='overlap' and b[0]!='num' and b[0]!='area':
                            object_in_image.append(b[0])
                            object_number.append(b[2])
                        if b[0]==a[0]:
                            object1_in_image=object_in_image[object_number.index(b[1])]
                            c=re.split(r'[(|,|)]',rule[position+1])
                            maxi=float(c[3])
                            mini=float(c[2])
                            #print(maxi,mini)
                            if object1_in_image==object1_in_rule and mini<=float(b[2])<=maxi:
                                satisfy_list[position]="True"
                                break
            if "False" not in satisfy_list:
                delete_list.append(i)
    for i,image in enumerate(new_total_list):
        if i not in delete_list:
            final_list.append(image)
    return final_list

def cha_to_num(target,total_list,lists):
    object_list=get_object_list(total_list)
    c=re.split(r'[(|,|)]',target)
    for rules in lists[c[0]]:
        for rule in rules:
            if rule!=0 and rule!=1:
                position=[]
                for pos,predicate in enumerate(rule):
                    a=re.split(r'[(|,|)]',predicate)
                    if len(a)==1:
                        if len(re.split(r'[<]',predicate))==1:
                            d=str(object_list.index(a[0]))
                            rule[pos]=a[0]+'('+'X'+','+d+')'+''
                        else:
                            position.append(pos)
                    elif a[0]=='overlap':
                        a[1]=str(object_list.index(a[1]))
                        a[2]=str(object_list.index(a[2]))
                        rule[pos]=a[0]+'('+a[1]+','+a[2]+')'+a[3]
                    elif a[0]=='num' or a[0]=='area':
                        a[1]=str(object_list.index(a[1]))
                        rule[pos]=a[0]+'('+a[1]+','+a[2]+')'+a[3]
                for i in range(len(position)):
                    del rule[position[len(position)-1-i]]
    return lists

def foil(target_list,target,total_list,variable1,deleted,locked):
#target should be a string, such as "guitarist"
    delete=copy.deepcopy(deleted)
    lock=copy.deepcopy(locked)
    if delete=={}:
        for targets in target_list:
            get_targets=re.split(r'[(|,|)]',targets)
            delete[get_targets[0]]=[[[],[],0]]
    if lock=={}:
        for targets in target_list:
            get_targets=re.split(r'[(|,|)]',targets)
            lock[get_targets[0]]=[[[],[],0]]
    for label in delete:
        if delete[label]==[]:
            delete[label]==[[[],[],0]]
    for label in lock:
        #print(label)
        if lock[label]==[]:
            lock[label]==[[[],[],0]]
    result_list=[]     #two dimentional list
    object_list=get_object_list(total_list)
    #delete=cha_to_num(target,total_list,delete)
    #lock=cha_to_num(target,total_list,lock)
    foil_json = {'target_list': target_list, 'target': target, 'total_list': total_list, 'deleted': deleted, 'lock': lock}
    with open('medical_foil_debug.json', 'w') as f:
        json.dump(foil_json, f)
    new_total_list=locking(target,total_list,lock)
    total_list1=copy.deepcopy(total_list)
    #print(new_total_list)
    positive_list,negative_list=pos_neg_list(target,new_total_list)   #get the initial_positive_list,to help find out the result that can satisfy all the positives
    c=re.split(r'[(|,|)]',target)
    initial_neg_length = len(negative_list)
    initial_pos_length = len(positive_list)
    i=0   #make sure that all the result in the result list has been proved that fulfill our requirements(can satisfy all the positives and reject all the negatives)
    while (len(positive_list)> 0.2*initial_pos_length):
        counting=0
        while (len(negative_list)> 0.2*initial_neg_length):
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
                        '''if len(a)==5:
                            if still_has_num(result)>=2:
                                new_result=copy.deepcopy(result)    
                                new_result.append(possible_clause[clause_number])
                                result_list.append(new_result)
                                correct_clause=True
                                break
                            else:
                                foil_gain_list[clause_number]=-99
                                break'''
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
                            if a[1] in parameter_list and threshold(target,possible_clause[clause_number],total_list1,variable1,locked)!=False:
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
            new_total_list=get_new_total_list(result_list,total_list1)
            #print(new_total_list)
            positive_list,negative_list=pos_neg_list(target,new_total_list)   # can use for next iteration when the answer is not perfect
            #print(negative_list)
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
        #print(rule)
        if rule!=[]:
            result_list.insert(0,rule)
    #print(result_list)
    return result_list

def delete_duplicate(math_format1):
    rules=math_format1
    new_rules=[]
    for rule in rules:
        if rule not in new_rules:
            new_rules.append(rule)
    result=new_rules
    return result
    
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
            elif a[0]!='overlap' and a[0]!="num" and a[0]!='area' and len(a)==4:
                n+='This image has '+a[0]
                objects.append(a[0])
                characters.append(a[2])
            elif a[0]=="overlap":
                index1=characters.index(a[1])
                index2=characters.index(a[2])
                n+=objects[index1]+' is overlapping with '+objects[index2]
            elif a[0]=='num':
                index=characters.index(a[1])
                object_name=objects[index]
                '''b=re.split(r'[<]',results[i+1])
                if len(b)!=1:
                    object_name= plural(object_name)
                    max=b[1]
                    n+='The number of '+object_name+" is less than "+max
                else:
                    b=re.split(r'[>]',results[i+1])
                    object_name= plural(object_name)
                    min=b[1]
                    n+='The number of '+object_name+" is greater than "+min'''
                b=re.split(r'[(|,|)]',results[i+1])
                if len(b)==5:
                    object_name= plural(object_name)
                    min=b[2]
                    max=b[3]
                    n+='The number of '+object_name+" is greater than "+min+" and less than "+max
                elif len(b)==4 and b[0]=='greater':
                    object_name= plural(object_name)
                    max=b[2]
                    n+='The number of '+object_name+" is less than "+max
                else:
                    object_name= plural(object_name)
                    min=b[2]
                    n+='The number of '+object_name+" is greater than "+min
            elif a[0]=='area':
                index=characters.index(a[1])
                object_name=objects[index]
                '''b=re.split(r'[<]',results[i+1])
                if len(b)!=1:
                    max=b[1]
                    n+='The area of '+object_name+"is less than "+max
                else:
                    b=re.split(r'[>]',results[i+1])
                    min=b[1]
                    n+='The area of '+object_name+" is greater than "+min'''
                b=re.split(r'[(|,|)]',results[i+1])
                if len(b)==5:
                    object_name= plural(object_name)
                    min=b[2]
                    max=b[3]
                    n+='The area of '+object_name+" is greater than "+min+" and less than "+max
                elif len(b)==4 and b[0]=='greater':
                    object_name= plural(object_name)
                    max=b[2]
                    n+='The area of '+object_name+" is less than "+max
                else:
                    object_name= plural(object_name)
                    min=b[2]
                    n+='The area of '+object_name+" is greater than "+min
            elif a[1]=='N':
                b=re.split(r'[(|,|)]',clauses)
                if len(b)==5:
                    min=b[2]
                    max=b[3]
                    n+='The number is greater than '+min+" and less than "+max
                elif len(b)==4 and b[0]=='greater':
                    max=b[2]
                    n+='The number is less than '+max
                else:
                    min=b[2]
                    n+='The number is greater than '+min
            result_list.append(n)
        result.append(result_list)
    return result

def neg_FOIL(input_list,deleted,locked):
    # foil_json = {'deleted': deleted, 'locked': locked}
    # with open('medical_neg_foil_debug.json', 'w') as f:
    #     json.dump(foil_json, f)
    if deleted=={}:
        deleted={'gdrishti':[],'ndrishti':[]}
    if locked=={}:
        locked={'gdrishti':[],'ndrishti':[]}
        
    global_variable1=0.8
    #start=time.time()
    dict_math={}
    dict_nl={}
    total_list1=get_total_list1(input_list)
    total_list=get_total_list(total_list1)
    object_list=get_object_list(total_list)
    target_list=[]
    for images in total_list:
        if images[0] not in target_list:
            target_list.append(images[0])
    for target in target_list:
        result_list=foil(target_list,target,total_list,global_variable1,deleted,locked)
        #print(result_list)
        #result_list=[['ACDR(X,0)', 'area(0,0.29)'], ['ACDR(X,0)', 'area(0,0.54)'], ['ACDR(X,0)', 'area(0,0.43)'], ['ACDR(X,0)', 'area(0,0.56)'], ['ACDR(X,0)', 'area(0,0.3)']]
        if result_list==None:
            dict_math[target]=[['none']]
            dict_nl[target]=[['none']]
        else:
            math_format=get_result_list(target,result_list,total_list,global_variable1,locked)
            #print(math_format)
            natural_language=NL(math_format,target,result_list)
            dict_math[target]=math_format
            dict_nl[target]=natural_language
    # print(dict_math)
    return dict_math,dict_nl,object_list, [], []
    #end=time.time()
    #print(end-start)

# def main():
#     input_list={
#             "imageId": 1,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.017943252301764658,
#                     "HCup": 224,
#                     "HDisc": 310,
#                     "OC": 43203,
#                     "OD": 79396,
#                     "VCup": 254,
#                     "VDisc": 339
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "gdrishti"
#         },{
#             "imageId": 2,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.10552693387825327,
#                     "HCup": 220,
#                     "HDisc": 346,
#                     "OC": 43595,
#                     "OD": 102506,
#                     "VCup": 261,
#                     "VDisc": 382
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "gdrishti"
#         },{
#             "imageId": 3,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.05339243541919569,
#                     "HCup": 184,
#                     "HDisc": 280,
#                     "OC": 37911,
#                     "OD": 67612,
#                     "VCup": 256,
#                     "VDisc": 302
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "gdrishti"
#         },{
#             "imageId": 4,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.26563417734165723,
#                     "HCup": 69,
#                     "HDisc": 226,
#                     "OC": 4340,
#                     "OD": 38777,
#                     "VCup": 82,
#                     "VDisc": 219
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "ndrishti"
#         },{
#             "imageId": 5,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.16023072774027794,
#                     "HCup": 151,
#                     "HDisc": 278,
#                     "OC": 19673,
#                     "OD": 66613,
#                     "VCup": 164,
#                     "VDisc": 306
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "gdrishti"
#         },{
#             "imageId": 6,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.028194325557470604,
#                     "HCup": 247,
#                     "HDisc": 299,
#                     "OC": 58240,
#                     "OD": 76587,
#                     "VCup": 299,
#                     "VDisc": 327
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "gdrishti"
#         },{
#             "imageId": 7,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.3211264894433691,
#                     "HCup": 76,
#                     "HDisc": 294,
#                     "OC": 4092,
#                     "OD": 70006,
#                     "VCup": 71,
#                     "VDisc": 300
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "ndrishti"
#         },{
#             "imageId": 8,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.3889276248141693,
#                     "HCup": 54,
#                     "HDisc": 329,
#                     "OC": 2216,
#                     "OD": 85340,
#                     "VCup": 55,
#                     "VDisc": 332
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "ndrishti"
#         },{
#             "imageId": 9,
#             "object_detect": {
#                 "space": {
#                     "DDLS": 0.25138738626068874,
#                     "HCup": 101,
#                     "HDisc": 262,
#                     "OC": 8374,
#                     "OD": 53258,
#                     "VCup": 107,
#                     "VDisc": 259
#                 }
#             },
#             "panoptic_segmentation": {},
#             "type": "ndrishti"
#         }
#     deleted={
#         "gdrishti": [],
#         "ndrishti": []
#     }
#     locked={
#         "gdrishti": [
#             [
#                 "ACDR(X,0)",
#                 "area(0,N)",
#                 "threshold(N,0.35,10000)"
#             ]
#         ],
#         "ndrishti": []
#     }
#     dict_math,dict_nl,object_list,[],[]=neg_FOIL(input_list,deleted,locked)
#     print(dict_math)

# main()