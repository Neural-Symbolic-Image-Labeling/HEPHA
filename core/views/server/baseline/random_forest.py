## import xgboost
# from xgboost import XGBClassifier
import pandas as pd
from numpy import loadtxt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import json


def data_process(train_df, predict_df, task):
    le = LabelEncoder()
    x_train = train_df.drop(['type'], axis=1)
    y_train = train_df['type']
    y_train = le.fit_transform(y_train)
    if task == 'bird':
        x_train = x_train.astype("category")
        x_predict = predict_df.astype("category")
        # One hot encoding
        x_train = pd.get_dummies(x_train)
        x_predict = pd.get_dummies(x_predict)
        x_train, x_predict = x_train.align(x_predict, join='inner', axis=1)
        return x_train, y_train, le, x_predict
    else:
        x_train = pd.get_dummies(x_train)
        x_predict = pd.get_dummies(predict_df)
        x_train, x_predict = x_train.align(x_predict, join='inner', axis=1)
        return x_train.astype("float64"), y_train, le, x_predict.astype("float64")

def rf(x_train, y_train, x_predict):

    # Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=0)
    rf_model.fit(x_train, y_train)

    # Predict
    y_predict = rf_model.predict(x_predict)
    return y_predict


def get_labels(y_predicts, le):
    y_predicts = le.inverse_transform(y_predicts)
    label_lst = []
    for label in y_predicts:
        label_lst.append([label])
    return label_lst