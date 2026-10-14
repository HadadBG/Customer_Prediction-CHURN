from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

columns_names={
"CreditScore",
"Geography",
"Gender",
"Age",
"Tenure",
"Balance",
"NumOfProducts",
"HasCrCard",
"IsActiveMember",
"EstimatedSalary",
"Satisfaction Score",
"Card Type",
"Point Earned"}
target_name="Exited"

def validate_test_data(df):
    if df.empty:
        raise ValueError("The dataset is empty.")
    missing_columns = columns_names - set(df.columns)
    if missing_columns:
        raise KeyError(f"Columns Missing:{str(missing_columns)}")
    

def validate_training_data(df):
    validate_test_data(df)

    if target_name not in df.columns:
        raise ValueError(
            f"Target column '{target_name}' was not found."
        )

    if df[target_name].isna().any():
        raise ValueError(
            f"Target column '{target_name}' contains missing values."
        )

    if df[target_name].nunique() < 2:
        raise ValueError(
            "The target must contain at least two classes."
        )

def __change_card_type__(cardType):
    catalog={
        "DIAMOND":3,
        "PLATINUM":2,
        "GOLD":1,
        "SILVER":0
    }
    return catalog[cardType]

def clean_data(df):
    
    df=df.drop(columns=["RowNumber","CustomerId","Surname","Complain"],errors="ignore")
    df["Card Type"] = df["Card Type"].apply(__change_card_type__)
    return df
   
def build_column_transformer():
    return ColumnTransformer(
    transformers=[
        ('pass', 'passthrough', [ "HasCrCard", "IsActiveMember"]),
        ('encode', OneHotEncoder(drop="first",handle_unknown="ignore"), ['Geography',"Gender"])
    ],
    remainder=RobustScaler() # Keeps any columns not specified
)





  