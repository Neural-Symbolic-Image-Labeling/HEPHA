from views.ActiveLearning.al_querier import *
from views.ActiveLearning.data import *

def run_al(n_instances, images_collection, image_meta_datas, image_set_name, task):

    data_parser = ClassificationDataManager()
    print("Model Load")
    X, X_unlabeled, y = data_parser.get_data_from_db(images_collection, image_meta_datas)
    print("Data Parsed")
    print("len Labled:", len(X))
    print("len UNLabled:", len(X_unlabeled))
    print("len y", len(y))
    query_idx, query_item = query(image_set_name, X, y, X_unlabeled, n_instances=n_instances)
    # print("query_idx:", query_idx)
    # print("query_item:", query_item)
    id_lst = []
    for img in query_item:
        id_lst.append(img['imageId'])
    # print(id_lst)
    return id_lst



