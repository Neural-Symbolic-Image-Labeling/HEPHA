import numpy as np
import csv
import json
import itertools
import pandas as pd

def vectorize_medical(data_df, image_metas, is_prediction=False):

    if not data_df:
        # Create new data frame
        # data_df = pd.DataFrame(columns=['name']+list(image_metas[0]['interpretation']['object_detect']['space'].keys())+['label'])
        if is_prediction:
            data_df = pd.DataFrame(columns=list(image_metas[0]['object_detect']['space'].keys()))
        else:
            data_df = pd.DataFrame(columns=list(image_metas[0]['object_detect']['space'].keys())+['type'])

    # Add data to dataframe
    for meta in image_metas:
        # Write row to dataframe
        # new_row = [meta['name']]+list(meta['interpretation']['object_detect']['space'].values())+[meta['label']]
        if is_prediction:
            new_row = list(meta['object_detect']['space'].values())
        else:
            new_row = list(meta['object_detect']['space'].values())+[meta['type']]

        # Concat
        data_df = pd.concat([data_df, pd.DataFrame([new_row], columns=data_df.columns)])

    return data_df


def vectorize_bird(data_df, image_metas, is_prediction=False):
    if not data_df:
        # data_df = pd.DataFrame(columns=['name']+list(image_metas[0]['interpretation']['object_detect'].keys())+['label'])
        if is_prediction:
            data_df = pd.DataFrame(columns=list(image_metas[0]['object_detect'].keys()))

        else:
            data_df = pd.DataFrame(columns=list(image_metas[0]['object_detect'].keys())+['type'])

    for meta in image_metas:
        # new_row = [meta['name']] + list(meta['interpretation']['object_detect'].values()) + [meta['label']]
        if is_prediction:
            new_row = list(meta['object_detect'].values())
        else:
            new_row = list(meta['object_detect'].values()) + [meta['type']]

        data_df = pd.concat([data_df, pd.DataFrame([new_row], columns=data_df.columns)])

    return data_df


def vectorize_adorprof(data_df, image_metas, is_prediction=False):
    obj_set = set()
    for img_meta in image_metas:
        for obj in img_meta['object_detect']['object'].values():
            obj_set.add(obj['name'])
    obj_set_lst = list(obj_set)
    obj_overlaps_full = list(set(frozenset(comb) for comb in itertools.combinations_with_replacement(obj_set_lst, 2)))

    if not data_df:
        if is_prediction:
            data_df = pd.DataFrame(columns=list(obj_set_lst) + [f"({'-'.join(list(e))})" for e in obj_overlaps_full])
        else:
            data_df = pd.DataFrame(columns=list(obj_set_lst) + [f"({'-'.join(list(e))})" for e in obj_overlaps_full] + ['type'])

    for meta in image_metas:
        # name = meta['name']
        if not is_prediction:
            label = meta['type']

        obj_vec = [0] * len(obj_set_lst)
        # object vector
        for obj in meta['object_detect']['object'].values():
            obj_vec[obj_set_lst.index(obj['name'])] += 1

        overlap_vec = [0] * len(obj_overlaps_full)
        # object overlap vector
        for ov_item in meta['object_detect']['overlap'].values():
            itemA = meta['object_detect']['object'][str(ov_item['idA'])]['name']
            itemB = meta['object_detect']['object'][str(ov_item['idB'])]['name']
            overlap_vec[obj_overlaps_full.index(frozenset([itemA, itemB]))] += 1

        # result = [name] + obj_vec + overlap_vec +
        if is_prediction:
            result = obj_vec + overlap_vec
        else:
            result = obj_vec + overlap_vec + [label]

        data_df = pd.concat([data_df, pd.DataFrame([result], columns=data_df.columns)])

    return data_df