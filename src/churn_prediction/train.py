#uv run python .\src\churn_prediction\train.py --data "./data/Customer-Churn-Records.csv"

print("Importing pandas and sk...")
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

print("Importing preprocessing...")
from preprocessing import validate_training_data,build_column_transformer,clean_data
from model import XGBoostModel
import argparse
from pathlib import Path
import joblib
parser = argparse.ArgumentParser(
        description="Train the churn prediction model"
    )

parser.add_argument(
    "--data",
    required=True,
    help="Path to the training dataset",
)
args = parser.parse_args()


print("Reading csv...")
df = pd.read_csv(args.data,sep=",")
validate_training_data(df)
df = clean_data(df)

X = df.drop("Exited", axis=1)
y = df["Exited"]
X_train, X_test, y_train, y_test = train_test_split(
X, y, test_size=0.2, random_state=67
)
ct =build_column_transformer()
X_train=ct.fit_transform(X_train)
X_test=ct.transform(X_test)
y_train=y_train.reset_index(drop=True).to_numpy()

model = XGBoostModel(
    depth_trees=7,
    n_trees=43,
    learning_rate=0.08,
    lambda_param=0.1,
    gamma_param=0.1,
    min_child_weight=3,

    #threshold=0.5
    threshold=0.38
    ) 


model.fit(X_train,y_train)

print("Model Trained Succesfull")
prediction= model.predict(X_test)

print(f"f1_score:{f1_score(y_test,prediction)}")


artifact = {
    "model": model,
    "columnTransformer":ct 

}

output_path=Path("artifacts/churn_model.joblib")
output_path.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(artifact, output_path)

print(f"Model saved at: {output_path}")
