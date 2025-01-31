import base64
import io
import re
from copy import deepcopy

import numpy as np
import torch
from bson import ObjectId
from flask import *
from PIL import Image
from torch.utils.data import Dataset
from views.ActiveLearning.run_AL import *
from views.server.tools import *

# Previous method with classification
# from views.pretrain import pretrain_label


class RawImageDataset(Dataset):
    def __init__(self, data, targets):
        self.data = data
        self.targets = torch.LongTensor(targets)

    def __getitem__(self, index):
        x = self.data[index]
        y = self.targets[index]

        return x, y

    def __len__(self):
        return len(self.data)


class Flask_Manager:
    def __init__(self, mongo, workspace_id, collection_id, task, mode) -> None:
        self.mongo = mongo
        self.workspace_id = workspace_id
        self.collection_id = collection_id
        self.workspace = None
        self.collection = None
        self.image_metas = None
        self.test_image_labels = None
        self.task = task
        self.mode = mode

    def get_workspace(self):
        self.workspace = self.mongo.db.workspaces.find_one({'_id': ObjectId(self.workspace_id)})
        # If self.workspace is None, exception

    def get_collection(self):
        for collect in self.workspace['collections']:
            if collect['_id'] == ObjectId(self.collection_id):
                self.collection = collect
        # If self.collection is None, exception

    def get_img_metas(self):
        # Save self.collection to json
        # collection = {"image": self.collection['images']}
        # with open('collection.json', 'w') as f:
        #     json.dump(collection, f)
        self.image_metas = self.collection['images']
        # If self.image_metas is None, exception

    def get_test_accuracy(self, pred_labels, test_img_ids):
        # Only for testing ################
        # Compare prediction labels with test image labels, get all incorrect indexes
        incorrect_lst = []
        for i in range(len(pred_labels)):
            if pred_labels[i] != self.test_image_labels[i]:
                incorrect_lst.append(i)

        # # Save to json
        acc_dict = {}
        acc_dict['incorrect_img_ids'] = [test_img_ids[i] for i in incorrect_lst]
        acc_dict['correct_labels'] = [self.test_image_labels[i] for i in incorrect_lst]
        acc_dict['incorrect_labels'] = [pred_labels[i] for i in incorrect_lst]
        acc_dict['test_image_labels'] = self.test_image_labels
        acc_dict['pred_labels'] = pred_labels

        with open('views/server/test_result/incorrect.json', 'w') as f:
            json.dump(acc_dict, f)
        #####################################
        # Count the number of each labels in self.test_image_labels
        label_count = {}
        for label in self.test_image_labels:
            if label not in label_count:
                label_count[label] = 1
            else:
                label_count[label] += 1

        # Cound the accuracy of each label
        label_acc = {}
        for label in label_count:
            label_acc[label] = 0
        for i in range(len(pred_labels)):
            if pred_labels[i] == self.test_image_labels[i]:
                label_acc[self.test_image_labels[i]] += 1

        for label in label_acc:
            label_acc[label] = label_acc[label] / label_count[label]

        acc = float((np.array(pred_labels) == np.array(self.test_image_labels)).sum() / len(self.test_image_labels))
        return acc, label_acc

    def get_test_img_lst(self, test_id_lst):
        # Images that need to be labeled
        test_lb_lst = []
        test_lb_lst_labels = []

        # Test Image input
        for img_id in test_id_lst:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img_id)})
            if img_init is None:
                return {'msg': 'No such image!',
                        'errorLog': None
                        }, 404
            if 'interpretation' not in img_init:
                return {'msg': 'No interpretation for image!' + img_id,
                        'errorLog': None
                        }, 500
            if self.mode == 'Classification':
                # img_dict = {'imageId': img_id, 'object_detect': img_init['interpretation']['object_detect'],
                #             'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
                #                 }}
                img_dict = {'imageId': img_id,
                            'object_detect': {
                                'object': img_init['interpretation']['object_detect']['object'],
                                'overlap': img_init['interpretation']['object_detect']['overlap'] if 'overlap' in img_init['interpretation']['object_detect'] else {}
                            } if 'object' in img_init['interpretation']['object_detect'] else img_init['interpretation']['object_detect'],
                            'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
                            }}
                test_lb_lst_labels.append(img_init['label'])
                test_lb_lst.append(img_dict)

        self.test_image_labels = test_lb_lst_labels

        return test_lb_lst

    def get_img_inputs(self, if_all):
        # Get image input for both FOIL and label method in detection and segmentation
        lst = []
        index = 1
        for img in self.image_metas:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img['imageId'])})
            if img_init is None:
                return 'No such image!'
            img_dict = {'imageId': index,
                        'type': img['labels'][0]['name'][0] if img['labels'] and img['labels'][0]['name'] else "Not Labeled",
                        'object_detect': {
                            'object': img_init['interpretation']['object_detect']['object'],
                            'overlap': img_init['interpretation']['object_detect']['overlap'] if 'overlap' in img_init['interpretation']['object_detect'] else {}
                        } if 'object' in img_init['interpretation']['object_detect'] else img_init['interpretation']['object_detect'],
                        'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
                        }}

            if if_all:
                lst.append(img_dict)
                index += 1
            else:

                if ((self.task == 'auto' or self.task == 'baseline') and self.mode == 'Classification') and img['manual'] and img['labels'] and img['labels'][0][
                        'name']:
                    lst.append(img_dict)
                    index += 1

            # if ((self.task == 'auto' or self.task == 'baseline') and self.mode == 'Classification') and img['labels'] and img['labels'][0][
            #     'name'] and img['manual']:
            #     img_dict = {'imageId': index,
            #                 'type': img['labels'][0]['name'][0],
            #                 'object_detect': {
            #                     'object': img_init['interpretation']['object_detect']['object'],
            #                     'overlap': img_init['interpretation']['object_detect']['overlap'] if 'overlap' in img_init['interpretation']['object_detect'] else {}
            #                 } if 'object' in img_init['interpretation']['object_detect'] else img_init['interpretation']['object_detect'],
            #                 'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
            #                     }}

            #     lst.append(img_dict)
            #     index += 1

        return lst

    def get_unchecked_img_lst(self):
        # Images that need to be labeled
        lb_lst = []
        img_id_lst = []
        # Image input
        for img in self.image_metas:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img['imageId'])})
            if img_init is None:
                return {'msg': 'No such image!',
                        'errorLog': None
                        }, 404
            if 'interpretation' not in img_init:
                return {'msg': 'No interpretation for image!' + img['imageId'],
                        'errorLog': None
                        }, 500

            if self.mode == 'Classification' and ((not img["labeled"]) or (img["labeled"] and not img["manual"])):
                img_dict = {'imageId': img['imageId'],
                            'object_detect': {
                                'object': img_init['interpretation']['object_detect']['object'],
                                'overlap': img_init['interpretation']['object_detect']['overlap'] if 'overlap' in img_init['interpretation']['object_detect'] else {}
                } if 'object' in img_init['interpretation']['object_detect'] else img_init['interpretation']['object_detect'],
                    'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
                }}
                # img_dict = {'imageId': img['imageId'], 'object_detect': img_init['interpretation']['object_detect'],
                #             'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
                #                 }}
                lb_lst.append(img_dict)
                img_id_lst.append(img['imageId'])
            # elif self.mode == 'Detection' and ((not img["labeled"]) or (img["labeled"] and not img["manual"])):
            #     img_dict = {'imageId': img['imageId'], 'attributes': img['attributes'],
            #                 'object_detect': img_init['interpretation']['object_detect'],
            #                 'panoptic_segmentation': img_init['interpretation']['panoptic_segmentation'] if 'panoptic_segmentation' in img_init['interpretation'] else {
            #                     }}
            #     lb_lst.append(img_dict)
            #     img_id_lst.append(img['imageId'])
        return lb_lst, img_id_lst

    def update_restriction(self, rules):
        if not self.collection['restrictions']['deleted']:
            self.collection['restrictions']['deleted'] = {}
        # if not self.collection['restrictions']['locked']:
        # Clear and update lock each round
        self.collection['restrictions']['locked'] = {}

        # Updating restrictions according to user's modification
        if rules:
            for rule in rules:
                rule_nm = rule['name']
                if rule_nm not in self.collection['restrictions']['deleted']:
                    self.collection['restrictions']['deleted'][rule_nm] = []
                if rule_nm not in self.collection['restrictions']['locked']:
                    self.collection['restrictions']['locked'][rule_nm] = []
                for clause in rule['clauses']:

                    if len(clause['literals']) > 0 and clause['literals'][0]['literal'] != 'none':
                        lit_lst = form_clause(clause)
                        is_deleted = clause['deleted']
                        is_locked = clause['locked']
                        if is_deleted and lit_lst not in self.collection['restrictions']['deleted'][rule_nm]:
                            self.collection['restrictions']['deleted'][rule_nm].append(lit_lst)
                        if is_locked and lit_lst not in self.collection['restrictions']['locked'][rule_nm]:
                            self.collection['restrictions']['locked'][rule_nm].append(lit_lst)
                        # Removed unlocked from locked list
                        # if not is_locked and lit_lst in self.collection['restrictions']['locked'][rule_nm]:
                        #     self.collection['restrictions']['locked'][rule_nm].remove(lit_lst)
                        # Removed undeleted from deleted list
                        if not is_deleted and lit_lst in self.collection['restrictions']['deleted'][rule_nm]:
                            self.collection['restrictions']['deleted'][rule_nm].remove(lit_lst)

    def update_rule(self, rule, natural_rule, image_set_name):
        self.collection['rules'].clear()
        deleted = self.collection['restrictions']['deleted']
        locked = self.collection['restrictions']['locked']
        for key in rule:
            new_rule = {'name': key[:key.index('(')],
                        'clauses': [],
                        # 'deleted': 0,
                        # 'locked': 0
                        }
            # Modified version for more predicate in single clauses
            i = 0
            while i < len(rule[key]):
                new_cl = {'literals': [],
                          'deleted': 0,
                          'locked': 0
                          }
                # cl_lst = []
                lit_lst = []
                j = 0
                while j < len(rule[key][i]):
                    new_lit = {'literal': rule[key][i][j],
                               }
                    lit_lst.append(rule[key][i][j])
                    new_cl['literals'].append(new_lit)
                    # cl_lst.append(rule[key][i][j])
                    j += 1
                # Check the key first in deleted and locked
                if deleted or locked:
                    if image_set_name == "Medical":

                        if deleted[key[:key.index('(')]]:
                            del_flag = True
                            if lit_lst[0][:3] != deleted[key[:key.index('(')]][0][0][:3]:
                                del_flag = False
                            if lit_lst[2] != deleted[key[:key.index('(')]][0][2]:
                                del_flag = False
                            if del_flag:
                                new_cl['deleted'] = 1
                        if locked[key[:key.index('(')]]:
                            lock_flag = True
                            if lit_lst[0][:3] != locked[key[:key.index('(')]][0][0][:3]:
                                lock_flag = False
                            if lit_lst[2] != locked[key[:key.index('(')]][0][2]:
                                lock_flag = False
                            if lock_flag:
                                new_cl['locked'] = 1

                    else:
                        if key[:key.index('(')] in deleted and lit_lst in deleted[key[:key.index('(')]]:
                            new_cl['deleted'] = 1
                        if key[:key.index('(')] in locked and lit_lst in locked[key[:key.index('(')]]:
                            new_cl['locked'] = 1

                if new_cl not in new_rule['clauses']:
                    new_rule['clauses'].append(new_cl)
                i += 1
            self.collection['rules'].append(new_rule)

    def format_rule(self, rules=None):
        # Format rule for labeling task
        # if rules is None:
        rules = self.collection['rules']
        # if rules is []:
        #     return 'No rules in the collection!'
        rule_dict = {}
        for rule in rules:
            rule_dict[rule['name']] = []
            for clause in rule['clauses']:
                if not clause['deleted']:
                    cla_lst = []
                    for lit in clause['literals']:
                        # if not (lit['deleted'] and self.task == 'trail'):
                        cla_lst.append(lit['literal'])
                    if cla_lst:
                        rule_dict[rule['name']].append(cla_lst)
            if not rule_dict[rule['name']]:
                rule_dict[rule['name']] = [['none']]
        return rule_dict

    def apply_labels(self, labels, img_id_lst):
        conflict_lst = []
        i = 0
        while i < len(labels):
            if len(labels[i]) > 0:
                for img in self.collection['images']:
                    if img['imageId'] == img_id_lst[i]:
                        if self.mode == 'Classification':
                            if labels[i][0] != 'None':
                                if not img['labels']:
                                    label_dict = {'name': labels[i], 'confirmed': False}
                                    img['labels'].append(label_dict)
                                else:
                                    img['labels'][0]['name'] = labels[i]
                                if len(labels[i]) > 1:
                                    conflict_lst.append(img_id_lst[i])
                                img['labeled'] = True
                            else:
                                if img['labels']:
                                    img['labels'][0]['name'] = []
                                img['labeled'] = False
                        elif self.mode == 'Detection':
                            if labels[i][0][0][0] != 'None':  # Need to be modified for none situation
                                new_label = []
                                for detect_obj in labels[i]:
                                    mark = {
                                        'x': detect_obj[1][0],
                                        'y': detect_obj[1][1],
                                        'width': detect_obj[1][2],
                                        'height': detect_obj[1][3]
                                    }
                                    new_obj = {
                                        'name': detect_obj[0],
                                        # 'attributes': None,
                                        # 'fromInterpretation': detect_obj[2],
                                        'confirmed': False,
                                        'canvasId': None,
                                        'mark': mark
                                    }
                                    new_label.append(new_obj)
                                img['labels'] = new_label
                                img['labeled'] = True
                            else:
                                if img['labels']:
                                    img['labels'] = []
                                img['labeled'] = False
            i += 1

    def update_sta(self):
        self.collection['statistics']['unlabeled'] = 0
        self.collection['statistics']['manual'] = 0
        self.collection['statistics']['autoLabeled'] = 0
        for img in self.image_metas:
            if img['labeled']:
                if img['manual']:
                    self.collection['statistics']['manual'] += 1
                else:
                    self.collection['statistics']['autoLabeled'] += 1
            else:
                self.collection['statistics']['unlabeled'] += 1

    def update_priority(self, priority_lst):
        self.collection['al_imageOrder'] = deepcopy(priority_lst)
        for img_id in self.collection['images']:
            if img_id['imageId'] not in priority_lst:
                priority_lst.append(img_id['imageId'])

        self.collection['imageOrder'] = priority_lst

    def active_learning(self, num_query, images_collection, image_meta_datas, image_set_name, task):
        # Run active Learning and get priority lst
        # priority_lst = run_al(5)
        priority_lst = run_al(num_query, images_collection, image_meta_datas, image_set_name, task)
        # Update priority lst
        self.update_priority(priority_lst)

    def get_labeled_raw_images(self):
        # Get image input for pixel baseline models
        lst = []
        label_lst = []
        for img in self.image_metas:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img['imageId'])})
            if img_init is None:
                return 'No such image!'
            if (self.task == 'auto' or self.task == 'baseline') and self.mode == 'Classification' and img['labels'] and img['labels'][0][
                    'name'] and img['manual']:
                base64_img = img_init['data']
                base64_img = base64_img.split(',')[1]
                lst.append(base64_img)
                label_lst.append(img['labels'][0]['name'][0])
        num_classes = len(set(label_lst))
        # Create a label map
        label_dict = {}
        for label in label_lst:
            if label not in label_dict:
                label_dict[label] = len(label_dict.keys())
        label_lst = [label_dict[label] for label in label_lst]
        return lst, label_lst, num_classes, label_dict

    def get_unchecked_raw_images(self):
        lb_lst = []
        img_id_lst = []
        # Image input
        for img in self.image_metas:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img['imageId'])})
            if img_init is None:
                return {'msg': 'No such image!',
                        'errorLog': None
                        }, 404
            if self.mode == 'Classification' and ((not img["labeled"]) or (img["labeled"] and not img["manual"])):
                base64_img = img_init['data']
                base64_img = base64_img.split(',')[1]
                lb_lst.append(base64_img)
                img_id_lst.append(img['imageId'])
        return lb_lst, img_id_lst

    def get_test_raw_images(self, img_id_lst):
        test_raw_img_lst = []
        test_labels = []
        # Image input
        for img_id in img_id_lst:
            img_init = self.mongo.db.images.find_one({'_id': ObjectId(img_id)})
            if img_init is None:
                return {'msg': 'No such image!',
                        'errorLog': None
                        }, 404
            base64_img = img_init['data']
            base64_img = base64_img.split(',')[1]
            test_labels.append(img_init['label'])
            test_raw_img_lst.append(base64_img)

        self.test_image_labels = test_labels

        return test_raw_img_lst

    def image_convert(self, image_lst):
        max_height = 0
        max_width = 0
        # Labeled
        image_array_lst = []
        for image_base64 in image_lst:
            base64_decoded = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(base64_decoded))
            # Resize the image to [256, 256]
            image = image.convert('RGB')
            image = image.resize((256, 256))
            image_array = np.array(image)
            # Change the dimension of the image to [3, height, width], the shape of the image is [height, width, 3]
            image_array = np.transpose(image_array, (2, 0, 1))
            image_array_lst.append(image_array)
            max_height = max(max_height, image.height)
            max_width = max(max_width, image.width)

        return image_array_lst, max_height, max_width

    def get_raw_image_dataset(self, test_id_lst):
        # Train Set
        lst, label_lst, num_classes, label_dict = self.get_labeled_raw_images()

        if lst == 'No such image!':
            return None, 404, None

        # Prediction Set
        lb_lst, lb_img_id_lst = self.get_unchecked_raw_images()

        # Test Set
        test_lb_lst = self.get_test_raw_images(test_id_lst)

        # lst is a list of base64 images, convert to list of torch tensor
        max_height = 0
        max_width = 0
        # Labeled
        lst_array, max_height, max_width = self.image_convert(lst)
        # Unlabeled
        lb_lst_array, max_height, max_width = self.image_convert(lb_lst)
        # Test
        test_lb_lst_array, max_height, max_width = self.image_convert(test_lb_lst)

        dummy_label_lst = [0] * len(lb_lst)
        dummy_test_label_lst = [0] * len(test_lb_lst)

        # Add padding based on the max height and width
        for i in range(len(lst_array)):
            lst_array[i] = np.pad(lst_array[i], ((0, 0), (0, max_height - lst_array[i].shape[1]),
                                                 (0, max_width - lst_array[i].shape[2])), 'constant')
        for i in range(len(lb_lst_array)):
            lb_lst_array[i] = np.pad(lb_lst_array[i], ((0, 0), (0, max_height - lb_lst_array[i].shape[1]),
                                                       (0, max_width - lb_lst_array[i].shape[2])), 'constant')
        for i in range(len(test_lb_lst_array)):
            test_lb_lst_array[i] = np.pad(test_lb_lst_array[i], ((0, 0), (0, max_height - test_lb_lst_array[i].shape[1]),
                                                                 (0, max_width - test_lb_lst_array[i].shape[2])), 'constant')

        # Split labeled into train and val
        train_lst_array = lst_array[:int(len(lst_array) * 0.8)]
        val_lst_array = lst_array[int(len(lst_array) * 0.8):]

        train_label_lst = label_lst[:int(len(label_lst) * 0.8)]
        val_label_lst = label_lst[int(len(label_lst) * 0.8):]

        train_dataset = RawImageDataset(train_lst_array, train_label_lst)
        # print("Finish train dataset")
        val_dataset = RawImageDataset(val_lst_array, val_label_lst)
        # print("Finish val dataset")
        predict_dataset = RawImageDataset(lb_lst_array, dummy_label_lst)
        # print("Finish predict dataset")
        test_dataset = RawImageDataset(test_lb_lst_array, dummy_test_label_lst)
        # print("Finish test dataset")

        return train_dataset, val_dataset, predict_dataset, test_dataset, num_classes, lb_img_id_lst, label_dict
