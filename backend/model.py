import pandas as pd
import numpy as np
from scipy import stats
from sklearn import svm
import joblib

# Simple feature extraction
def extract_features(df):
    dt = df[['X', 'Y', 'Z']]
    segment_size = 10
    number_of_feat = 18
    features = []

    for i in range(0, len(dt), segment_size):
        segment = dt.iloc[i:i+segment_size]
        if len(segment) < segment_size:
            break
        tmp = stats.describe(segment)
        feat = np.concatenate((tmp[1][0], tmp[1][1], tmp[2], tmp[3], tmp[4], tmp[5]))
        features.append(feat)
    return np.array(features)

# Train or load SVM
def train_svm():
    dt1 = pd.read_csv('Moving.csv')[['X','Y','Z']]
    dt2 = pd.read_csv('Stationary.csv')[['X','Y','Z']]
    X = np.vstack([extract_features(dt1), extract_features(dt2)])
    y = np.array([0]*len(extract_features(dt1)) + [1]*len(extract_features(dt2)))
    clf = svm.LinearSVC()
    clf.fit(X, y)
    joblib.dump(clf, 'svm_model.pkl')
    return clf

def predict(file_path):
    clf = joblib.load('svm_model.pkl')
    df = pd.read_csv(file_path)
    features = extract_features(df)
    preds = clf.predict(features)
    return preds.tolist()
