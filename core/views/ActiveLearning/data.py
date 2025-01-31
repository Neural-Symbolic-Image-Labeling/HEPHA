from pprint import pprint
# from FoilModel import *
from views.FOIL.foil_model import *
from views.FOIL.foil_types import *
import os
import pymongo
import certifi
from bson import ObjectId

class ClassificationDataManager:
    """Provide utility methods for data preprocessing in classification mode."""

    def get_data_from_db(self, images_collection, image_meta_datas):
        """
        Retrive data from MongoDB and parse data into X, X_unlabeled and y.

        @param url: url to db
        @return: X, X_unlabeled, y
        """
        # mongo = pymongo.MongoClient(os.environ.get("MONGODB_URL"), tlsCAFile=certifi.where())

        # from pymongo import MongoClient
        # client = MongoClient(url)
        # db = client['NSIL']
        # images_collection = mongo.db.images
        # workspaces_collection = mongo.db.workspaces

        # Get all images
        # images: list[object] = images_collection.find({})
        # Get all imageMetaDatas
        # ws = workspaces_collection.find_one({})
        # image_meta_datas = ws['collections'][0]['images']

        # Get X, y
        X = []
        X_unlabeled = []
        y = []
        for img_md in image_meta_datas:
            img_id = img_md['imageId']
            target_img = None
            # print([x for x in images if str(x['_id']) == str(img_id)])
            try:
                target_img = images_collection.find_one({'_id': ObjectId(img_id)})
            except Exception as err:
                print('=====================')
                print(err)
                print(img_id)
                print('=====================')
                continue
            # process labeled images
            if img_md['labels'] and len(img_md['labels']) == 1 and img_md['labels'][0]['name'] and len(
                    img_md['labels'][0]['name']) == 1 and img_md['labels'][0]['confirmed']:
                x_single, y_single = FoilImageClassifier.parse_data(img_md, target_img['interpretation'])
                X.append(x_single)
                y.append(y_single)
            else:
                # process unlabeled images
                x_single, _ = FoilImageClassifier.parse_data(img_md, target_img['interpretation'], isManual=False)
                X_unlabeled.append(x_single)

        # mongo.close()
        # Save X, X_unlabeled, y to local json file
        import json
        with open('al_input.json', 'w') as f:
            json.dump({'X': X, 'X_unlabeled': X_unlabeled, 'y': y}, f)
        f.close()
        return X, X_unlabeled, y

    def save_data_to_file(self, X=[], X_unlabeled=[], y=[], filename='data', from_db=False):
        """ 
        Save X, X_unlabeled and y to local file.

        @param X: data X
        @param X_unlabeled: data X_unlabeled
        @param y: data y
        @param filename: filename to save
        @param from_db: if True, data is retrived from db and no need to provide X, X_unlabeled and y
        """
        import os
        if(os.path.isfile(filename)):
            print("File already exists. Stop saving.")
            return
        import pickle
        if from_db:
            X, X_unlabeled, y = self.get_data_from_db()
        # save X, X_unlabeled, y as a list
        with open(filename, 'wb') as f:
            pickle.dump([X, X_unlabeled, y], f)

    def get_data_from_file(self, filename='data'):
        """
        Load X, X_unlabeled and y from local file.

        @param filename: filename to load
        @return: X, X_unlabeled, y
        """
        import pickle
        with open(filename, 'rb') as f:
            return pickle.load(f)

# if __name__ == '__main__':
#     data_parser = ClassificationDataManager()
#     # data_parser.save_data_to_file(from_db=True)
#     X, X_unlabeled, y = data_parser.get_data_from_file()
#     print('X[0]: ', X[0]['object_detect']['object'])
#     # for key in X[0]['object_detect']['object']:
#         # print(key)
#     # print('y[0]: ', y[0])
#     # for idx, v in enumerate(y):
#         # print(f"{idx}: {v}")
#     # print(X_unlabeled[0])
#     pass