print("Importing libraries...")

import joblib

import pandas as pd

ARTIFACTS_PATH="artifacts/churn_model.joblib"
THRESHOLD = 0.38
from .preprocessing import validate_test_data,clean_data
order_dict = {

    "CreditScore": 0,
    "Geography": 1,
    "Gender": 2,
    "Age": 3,
    "Tenure": 4,
    "Balance": 5,
    "NumOfProducts": 6,
    "HasCrCard": 7,
    "IsActiveMember": 8,
    "EstimatedSalary": 9,

    "Satisfaction Score": 10,
    "Card Type": 11,
    "Point Earned": 12
}
def __get_if_correct__(data):
    if data[0] == data[1]:
        return "TRUE"
    return "FALSE"


def predict_from_data_frame(df_ori, output_path=None):
    artifacts = joblib.load(ARTIFACTS_PATH)
    model = artifacts["model"]
    ct = artifacts["columnTransformer"]
    validate_test_data(df_ori)
    df=clean_data(df_ori)
    y= None

    if "Exited" in df.columns:
        y = df["Exited"]
        X=df.drop("Exited", axis=1)
    else:
        X=df
    X=ct.transform(X)
    
    prediction=model.predict(X)
    prediction_binary = (prediction >= THRESHOLD).astype(int)
    df_ori=df_ori.assign(score=prediction,prediction=prediction_binary)

    
    if y is not None:
        results= map(__get_if_correct__,zip(prediction_binary,y))
        df_ori =df_ori.assign(correct_prediction=list(results))
    if output_path is None:
        return df_ori["score"][0]
    else:
        df_ori.to_csv(output_path, index=False,float_format='%.2f')

def predict_from_file(file_path,output_path):
    
    df_ori=pd.read_csv(file_path,sep=",")
   
    predict_from_data_frame(df_ori,output_path)


def predict_from_python_obj(data):
       
    data_frame = pd.DataFrame(
    [data],
    columns=[
    col for col in order_dict.keys()
    if col in data.keys()
    ]
    )
    resultado=float(predict_from_data_frame(data_frame))
    
    return {"score":resultado,"prediction":resultado>=THRESHOLD}
    
if __name__=="__main__":
    print("Predicting...")
    predict_from_file("data/Customer-Churn-Example.csv","results/output.csv")
    #12    
    object_aux= {

    "CreditScore": 688,
    "Geography": "Germany",
    "Gender": "Male",
    "Age": 35,
    "Tenure": 5,
    "Balance": 111578.18,
    "NumOfProducts": 1,
    "HasCrCard": 0,
    "IsActiveMember": 0,
    "EstimatedSalary": 166165.93,
    "Satisfaction Score": 1,
    "Card Type": "PLATINUM",
    "Point Earned": 384
    }
    print(object_aux.keys())
    print(predict_from_python_obj(object_aux))
    
    

