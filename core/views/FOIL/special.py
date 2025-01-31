import re,copy
import json
def get_total_list_traffic(input_list):
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
    return object_detection+segmentation,object_detection,segmentation

def get_total_list1_medical(input_list):
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
            area="area"+"("+str(objects)+","+str(area1/area2)+")"
            image_list.append(has)
            image_list.append(area)
        total_list.append(image_list)
    return total_list

def get_total_list_medical(total_list1):
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

def get_object_list_medical(total_list):
    object_list=[]
    for image in total_list:
        for clauses in image:
            a=re.split(r'[(|,|)]',clauses)
            if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4 and (a[0] not in object_list):
                object_list.append(a[0])
    return object_list

def get_total_list1_bird(input_list):
    #list=[load_dict1]
    total_list=[]
    for image_num in range(len(input_list)):
        image_list=[]
        string=input_list[image_num]['type']+"(image"+str(input_list[image_num]['imageId'])+")"
        image_list.append(string)
        for name in input_list[image_num]['object_detect']:
            a=copy.deepcopy(name)
            new_name=re.split(r'[_]',a)
            #if name!='has_wing_color':
            # if new_name[len(new_name)-1]!='pattern':
            if input_list[image_num]['object_detect'][name]!="0":
                has=name+"(image"+str(input_list[image_num]['imageId'])+","+input_list[image_num]['object_detect'][name]+")"
                image_list.append(has)
            else:
                for new_image_num in range(len(input_list)):
                    if input_list[new_image_num]['object_detect'][name]!="0":
                        not_has="¬"+name+"(image"+str(input_list[image_num]['imageId'])+","+input_list[new_image_num]['object_detect'][name]+")"
                        image_list.append(not_has)
        total_list.append(image_list)
    return total_list

def get_total_list_bird(total_list1):
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

def get_object_list_bird(total_list):
    object_list=[]
    for image in total_list:
        for clauses in image:
            a=re.split(r'[¬(|,|)]',clauses)
            if a[0]!='overlap' and a[0]!='num' and a[0]!='area' and len(a)==4 and (a[0] not in object_list):
                object_list.append(a[0])
    final_attribute=[]
    for object in object_list:
        attribute_list=[]
        for image in total_list:
            for clauses in image:
                a=re.split(r'[¬(|,|)]',clauses)
                if len(a)==4 and a[0]==object:
                    attribute_list.append(a[2])
                elif len(a)==5 and a[1]==object:
                    attribute_list.append(a[3])
        final_attribute.append(sorted(list(set(attribute_list))))
    return object_list,final_attribute

def final(input_list,type):
    if type=="Default":
        object_list,object_detection,segmentation=get_total_list_traffic(input_list)
        return {'object_list': object_list, 'num_object_list': object_detection, 'area_object_list': segmentation}
    elif type=="Medical":
        total_list1=get_total_list1_medical(input_list)
        total_list=get_total_list_medical(total_list1)
        object_list=get_object_list_medical(total_list)
        return object_list
    elif type=="Bird":
        total_list1=get_total_list1_bird(input_list)
        total_list=get_total_list_bird(total_list1)
        object_list,final_attribute=get_object_list_bird(total_list)
    for num,i in enumerate(object_list):
        if i=='has_forehead_color':
            print(final_attribute[num])
    final_attribute_dict = {"final_attribute":final_attribute}
    with open('final_attributes.json', 'w') as f:
        json.dump(final_attribute_dict, f)
        f.close()
    return dict(zip(object_list, final_attribute))
