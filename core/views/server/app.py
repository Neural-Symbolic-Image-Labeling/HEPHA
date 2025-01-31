import base64
import json
import os
import random
import traceback

import certifi
import pymongo
from bson import ObjectId
from flask import *
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo.server_api import ServerApi
# Previous method with classification
# from views.pretrain import pretrain_label
# from views.foil import FOIL
# from views.label import label
# from views.FOIL.obj_detection_foil import obj_FOIL
from views.FOIL.model_label.obj_detection_label import obj_label
from views.FOIL.special import final as extract_pred_settings
from views.server.baseline.baseline_resnet import *
from views.server.baseline.random_forest import *
from views.server.baseline.vectorizer import *
from views.server.flask_server import *

# from views.FOIL.foil_neg_nocolor import neg_FOIL


app = Flask(__name__)
# CORS
cors = CORS(app)
# configuration
# app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'nsil pog')

# app.config.update(
#     MONGO_HOST='localhost',
#     MONGO_PORT=27017,
#     MONGO_URI = 'mongodb://localhost:27017/NSIL'
# )

# mongo = PyMongo(app)
app.config['MONGO_URI'] = os.environ.get("MONGODB_URL")

mongo = pymongo.MongoClient(os.environ.get("MONGODB_URL"))
print(mongo.server_info())

# mongo = pymongo.MongoClient('mongodb://nsildb:nsil@localhost:27018/',  tlsCAFile=certifi.where(), server_api=ServerApi('1'))


# @app.route('/flaskadmin/pretrain', methods=['GET'])
@app.route('/api/img/pre/<imgid>', methods=['POST'])
def pretrain(imgid):
    # image_id = request.args.get('_id')
    # base64_img_bytes = image_id.encode('utf-8')
    ########################################
    with open('readme.txt', 'w') as f:
        f.write("MONGODB_URL")
        f.write(os.environ.get("MONGODB_URL"))
    ########################################
    target = mongo.db.images.find_one({'_id': ObjectId(imgid)})
    if target is None:
        return {'msg': 'No such image, id is invalid!',
                'errorLog': None
                }, 404
    base64_img_bytes = target['data']
    base64_img = base64_img_bytes[base64_img_bytes.rfind(','):]

    decoded_image_data = base64.b64decode(base64_img)
    # bin_im = "".join(["{:08b}".format(x) for x in decoded_image_data])

    # Run pretrained model
    # json_res = pretrain_label(decoded_image_data)

    # Saving the output json to specific image
    # data = json.load(json_res)

    # For testing
    try:
        # print(decoded_image_data)
        # print("imageid")
        # print(imgid)
        with open('testimage.txt', 'w') as f:
            f.write(target['data'])
        data = None
        # data = pretrain_label(decoded_image_data, imgid)
    except Exception as err:
        return {'msg': 'ERROR in pre-train',
                'errorLog': str(err)
                }, 500
    # print(data)
    # data = json.load(data)
    # interpretation = {k: data[0][k] for k in ['object_detect', 'panoptic_segmentation'] if k in data[0]}
    interpretation = {k: data[k] for k in ['object_detect', 'panoptic_segmentation'] if k in data}

    # interpretation = {k: data[0][k] for k in ['object', 'overlap'] if k in data[0]}

    # print(interpretation)
    new_int = {'$set': {'interpretation': interpretation}}
    # new_int = {'$set': {'interpretation': {'object_detect': interpretation, 'panoptic_segmentation': {}}}}
    try:
        mongo.db.images.update_one(target, new_int)
    except Exception as err:
        return {'msg': 'Fail to Update!',
                'errorLog': str(err)
                }, 400

    return {'code': 0, 'msg': "success", 'errorLog': None}, 200


# Classification
@app.route('/api/autolabel', methods=['POST'])
def train_rule():
    # Find Update Target
    body = request.get_json()
    with open('views/server/test_result/autolabel_body.json', 'w') as f:
        json.dump(body, f)
        f.close()
    manager = Flask_Manager(mongo, body['workspaceID'], body['collectionID'], body['task'], body['mode'])
    manager.get_workspace()
    if manager.workspace is None:
        return {'msg': 'No such workspace!',
                'errorLog': None
                }, 404

    manager.get_collection()
    if manager.collection is None:
        return {'msg': 'No such image collection!',
                'errorLog': None
                }, 404
    manager.get_img_metas()
    if not manager.image_metas:
        return {'msg': 'No images in the collection!',
                'errorLog': None
                }, 404

    # Get image input for both FOIL and label method in detection and segmentation
    # If all is True, return all images in the collection to generate all predicates
    lst = manager.get_img_inputs(if_all=False)
    all_lst = manager.get_img_inputs(if_all=True)
    if lst == 'No such image!':
        return {'msg': 'No such image!',
                'errorLog': None
                }, 404

    if not lst and body['task'] == 'auto':
        return {'msg': 'No Images!',
                'errorLog': None
                }, 404

    debug = ''

    # Set up FOIL and label method for different image set
    image_set_name = body['image_set_name']
    if image_set_name == "Medical":
        from views.FOIL.model_label.medical_foil_for_vscode import neg_FOIL
        from views.FOIL.model_label.medical_label_for_vscode import neg_label
    elif image_set_name == "Bird":
        from views.FOIL.model_label.bird_foil_for_vscode import neg_FOIL
        from views.FOIL.model_label.bird_label_for_vscode import neg_label
    else:
        from views.FOIL.model_label.foil_neg_nocolor_newD import neg_FOIL
        from views.FOIL.model_label.label_neg_nocolor import neg_label

    if body['task'] == 'auto':
        manager.update_restriction(body['rule'])
        try:
            deleted = manager.collection['restrictions']['deleted']
            locked = manager.collection['restrictions']['locked']
            foilinput = {
                'lst': lst,
                'deleted': deleted,
                'locked': locked
            }
            with open('views/server/test_result/foilinput.json', 'w') as f:
                json.dump(foilinput, f)
                f.close()
            # raise Exception("Line 159")
            result = neg_FOIL(lst, deleted, locked)
            debug = result
            rule = result[0]
            natural_rule = result[1]
            object_list = result[2]
            foiloutput = {
                "result": result,
            }
            with open('views/server/test_result/foiloutput.json', 'w') as f:
                json.dump(foiloutput, f)
                f.close()
            # object_list = ["@", "[NEG]", "^", "#"]
            manager.collection['object_list'] = object_list

            num_obj_list = result[3]
            area_obj_list = result[4]
            manager.collection['num_object_list'] = num_obj_list
            manager.collection['area_object_list'] = area_obj_list
            if manager.collection['type'] == 'Bird':
                manager.collection['birdPredicates'] = extract_pred_settings(all_lst, 'Bird')
                # manager.collection['birdPredicates'] = extract_pred_settings(lst, 'Bird')

            # manager.collection['bird'] = rule
            debug = rule
            # print(rule)
            # print(natural_rule)
            print("FOIL success")
        #     raise Exception("Line 180")
        except Exception as err:
            return {'msg': 'ERROR in FOIL',
                    'errorLog': str(traceback.format_exc()),
                    'debug': str(debug)
                    }, 500

        # Updating rules, loop over add into clauses and overwrite rules
        manager.update_rule(rule, natural_rule, image_set_name)

    # Labeling Task
    # Image input
    lb_lst, img_id_lst = manager.get_unchecked_img_lst()
    # Test image input
    test_lb_lst = manager.get_test_img_lst(body['test_img_ids'])
    # Save test_lb_lst to json
    # with open('test_lb_lst.json', 'w') as f:
    #     json.dump(test_lb_lst, f)
    #     f.close()

    # Rule input
    rule_dict = manager.format_rule() if body['task'] == 'auto' else body['rule']
    if rule_dict == 'No rules in the collection!':
        return {'msg': 'No rules in the collection!',
                'errorLog': None
                }, 404

    try:
        labelinput = {
            'image_lst': lb_lst,
            'rule_dict': rule_dict,
            'object_list': manager.collection['object_list'],
            'birdPredicates': manager.collection['birdPredicates'] if 'birdPredicates' in manager.collection else ({})
        }
        with open('views/server/test_result/labelinput.json', 'w') as f:
            json.dump(labelinput, f)
            f.close()
        # Label on image set
        labeling_result = neg_label(lb_lst, rule_dict)
        labels = labeling_result[0]
        # Label on test set
        test_labeling_result = neg_label(test_lb_lst, rule_dict)
        test_labels = test_labeling_result[0]
        test_labels = [test_labels[i][0] for i in range(len(test_labels))]
        labeloutput = {
            'labels': labels,
            'test_labels': test_labels
        }
        with open('views/server/test_result/labeloutput.json', 'w') as f:
            json.dump(labeloutput, f)
            f.close()

    except Exception as err:
        return {'msg': 'ERROR in Apply Rules (labeling)',
                'errorLog': str(err)
                }, 500

    if len(img_id_lst) != len(labels):
        return {'msg': 'Label method return insufficient labels based on input images',
                'errorLog': None
                }, 500

    # Apply labels
    manager.apply_labels(labels, img_id_lst)
    print("Lable Success!")

    # manager.collection['statistics']['accuracy'] = random.uniform(0.0, 0.9) * 100
    acc, label_acc = manager.get_test_accuracy(test_labels, body['test_img_ids'])
    manager.collection['statistics']['accuracy'] = acc
    manager.collection['statistics']['label_coverage'] = label_acc
    # manager.collection['statistics']['accuracy'] = manager.get_test_accuracy(test_labels)

    # Update statistics
    manager.update_sta()

    # Update Image Order (Active Learning)
    if body['active_learning']:
        images_collection = mongo.db.images
        image_meta_datas = manager.image_metas
        # If the number of label is less than 5
        unconfirmed = manager.collection['statistics']['autoLabeled'] + manager.collection['statistics']['unlabeled']
        num_query = unconfirmed if unconfirmed < 5 else 5
        # try:
        manager.active_learning(num_query, images_collection, image_meta_datas, image_set_name, body['task'])
        # except Exception as err:
        #     return {'msg': 'ERROR in Active Learning',
        #             'errorLog': str(err)
        #             }, 500

    ############## TEST################
    # Save predicates to json
    if manager.collection['type'] == 'Bird' and 'birdPredicates' in manager.collection:
        b_p = {"birdPredicates": manager.collection['birdPredicates']}
        with open('birdPredicates.json', 'w') as f:
            json.dump(b_p, f)
            f.close()
    ##################################

    # Updating workspace
    target_collect_lst = manager.workspace['collections']
    i = 0
    flag = 0
    while i < len(target_collect_lst):
        if target_collect_lst[i]['_id'] == manager.collection['_id']:
            target_collect_lst[i] = manager.collection
            flag = 1
        i += 1

    if flag == 0:
        return {'msg': 'No such collection!',
                'errorLog': None
                }, 404

    # Updating database
    flt = {'_id': ObjectId(body['workspaceID'])}
    new_wrksp = {'$set': {'collections': target_collect_lst}}

    try:
        mongo.db.workspaces.update_one(flt, new_wrksp)
    except Exception as err:
        return {'msg': 'Fail to Update!',
                'errorLog': str(err)
                }, 404

    return {'msg': "success", 'errorLog': None}, 200


@app.route('/api/update_images', methods=['POST'])
def update_images():
    body = request.get_json()
    wrksp_id = body['workspaceID']
    # find workspance
    try:
        workspace = mongo.db.workspaces.find_one({'_id': ObjectId(wrksp_id)})
    except Exception as err:
        return {'msg': 'No such workspace!',
                'errorLog': str(err)
                }, 404

    images = workspace['collections'][0]['images']
    index = 0
    for img in images:
        target = mongo.db.images.find_one({'_id': ObjectId(img['imageId'])})
        if 0 <= index <= 139:
            # add new label
            new_img = {'$set': {'label': "downtown"}}
            # Update
            mongo.db.images.update_one(target, new_img)
        elif 140 <= index <= 279:
            # add new label
            new_img = {'$set': {'label': "highway"}}
            # Update
            mongo.db.images.update_one(target, new_img)
        else:
            # add new label
            new_img = {'$set': {'label': "mountain road"}}
            # Update
            mongo.db.images.update_one(target, new_img)
        index += 1
    return {'msg': "success", 'errorLog': None}, 200


@app.route('/api/run_resnet', methods=['POST'])
def run_resnet():
    # Find Update Target
    body = request.get_json()
    manager = Flask_Manager(mongo, body['workspaceID'], body['collectionID'], body['task'], body['mode'])
    manager.get_workspace()
    if manager.workspace is None:
        return {'msg': 'No such workspace!',
                'errorLog': None
                }, 404

    manager.get_collection()
    if manager.collection is None:
        return {'msg': 'No such image collection!',
                'errorLog': None
                }, 404
    manager.get_img_metas()
    if manager.image_metas is []:
        return {'msg': 'No images in the collection!',
                'errorLog': None
                }, 404
    np.random.seed(1)
    train_dataset, val_dataset, predict_dataset, test_dataset, num_classes, img_id_lst, label_dict = manager.get_raw_image_dataset(
        body['test_img_ids'])
    if val_dataset == 404:
        return {'msg': 'No such image!',
                'errorLog': None
                }, 404, None

    # Get training parameters
    epochs = 5
    model_name = body['resnet_model']

    try:
        y_predict, y_predict_test = resnet(train_dataset, val_dataset, predict_dataset, test_dataset, num_classes, epochs, model_name)

        print("Resnet success")
    #     raise Exception("Line 180")
    except Exception as err:
        return {'msg': 'ERROR in Resnet:',
                'errorLog': str(traceback.format_exc())
                }, 500

    # Get all true label according to y_predict and label_dict, where label_dict is a inverse map from label to index
    inverse_label_dict = {v: k for k, v in label_dict.items()}
    labels = []
    for i in range(len(y_predict)):
        labels.append([inverse_label_dict[y_predict[i]]])

    test_labels = []
    for i in range(len(y_predict_test)):
        test_labels.append([inverse_label_dict[y_predict_test[i]]][0])

    resnet_output = {
        "prediction": labels,
    }
    with open('views/server/test_result/resnet_output.json', 'w') as f:
        json.dump(resnet_output, f)
        f.close()

    if len(img_id_lst) != len(labels):
        return {'msg': 'Label method return insufficient labels based on input images',
                'errorLog': None
                }, 500

    # Apply labels
    manager.apply_labels(labels, img_id_lst)
    print("Lable Success!")

    # Update statistics
    acc, label_acc = manager.get_test_accuracy(test_labels, body['test_img_ids'])
    manager.collection['statistics']['accuracy'] = acc
    manager.collection['statistics']['label_coverage'] = label_acc
    manager.update_sta()

    # Updating workspace
    target_collect_lst = manager.workspace['collections']
    i = 0
    flag = 0
    while i < len(target_collect_lst):
        if target_collect_lst[i]['_id'] == manager.collection['_id']:
            target_collect_lst[i] = manager.collection
            flag = 1
        i += 1

    if flag == 0:
        return {'msg': 'No such collection!',
                'errorLog': None
                }, 404

    # Updating database
    flt = {'_id': ObjectId(body['workspaceID'])}
    new_wrksp = {'$set': {'collections': target_collect_lst}}

    try:
        mongo.db.workspaces.update_one(flt, new_wrksp)
    except Exception as err:
        return {'msg': 'Fail to Update!',
                'errorLog': str(err)
                }, 404

    return {'msg': "success", 'errorLog': None}, 200
