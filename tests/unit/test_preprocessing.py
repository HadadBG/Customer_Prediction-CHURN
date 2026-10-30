import pandas as pd
import pytest
from scipy.sparse import issparse

from churn_prediction.preprocessing import (
    build_column_transformer,
    clean_data,
    validate_test_data,
    validate_training_data,
)


def make_data(include_target=True):
    """Create a small dataset with all required feature columns."""
    data = {
        "CreditScore": [650, 720, 680, 750],
        "Geography": ["France", "Germany", "Spain", "France"],
        "Gender": ["Female", "Male", "Female", "Male"],
        "Age": [35, 42, 29, 51],
        "Tenure": [5, 2, 7, 4],
        "Balance": [1000.0, 2000.0, 0.0, 5000.0],
        "NumOfProducts": [1, 2, 1, 3],
        "HasCrCard": [1, 1, 0, 1],
        "IsActiveMember": [1, 0, 1, 0],
        "EstimatedSalary": [50000, 75000, 65000, 90000],
        "Satisfaction Score": [3, 4, 2, 5],
        "Card Type": ["GOLD", "PLATINUM", "SILVER", "DIAMOND"],
        "Point Earned": [100, 200, 150, 250],
    }

    if include_target:
        data["Exited"] = [0, 1, 0, 1]

    return pd.DataFrame(data)


# -------------------------
# validate_test_data()
# -------------------------

def test_validate_test_data_accepts_valid_data():
    df = make_data(include_target=False)

    # Should not raise an exception.
    validate_test_data(df)


def test_validate_test_data_rejects_empty_dataset():
    df = pd.DataFrame()

    with pytest.raises(ValueError, match="dataset is empty"):
        validate_test_data(df)


def test_validate_test_data_rejects_missing_columns():
    df = make_data().drop(columns=["Age"])

    with pytest.raises(KeyError, match="Columns Missing"):
        validate_test_data(df)


# -------------------------
# validate_training_data()
# -------------------------

def test_validate_training_data_requires_target():
    df = make_data(include_target=False)

    with pytest.raises(ValueError, match="Target column"):
        validate_training_data(df)


def test_validate_training_data_rejects_missing_target_values():
    df = make_data()
    df.loc[0, "Exited"] = None

    with pytest.raises(ValueError, match="missing values"):
        validate_training_data(df)


def test_validate_training_data_requires_two_classes():
    df = make_data()
    df["Exited"] = 0

    with pytest.raises(ValueError, match="at least two classes"):
        validate_training_data(df)


def test_validate_training_data_accepts_valid_data():
    df = make_data()

    validate_training_data(df)


# -------------------------
# clean_data()
# -------------------------

def test_clean_data_removes_unnecessary_columns():
    df = make_data()
    df["RowNumber"] = [1, 2, 3, 4]
    df["CustomerId"] = [100, 101, 102, 103]
    df["Surname"] = ["A", "B", "C", "D"]
    df["Complain"] = [0, 1, 0, 0]

    result = clean_data(df)

    removed_columns = {
        "RowNumber",
        "CustomerId",
        "Surname",
        "Complain",
    }

    assert removed_columns.isdisjoint(result.columns)


def test_clean_data_maps_card_types():
    df = make_data()

    result = clean_data(df)

    assert result["Card Type"].tolist() == [1, 2, 0, 3]


def test_clean_data_does_not_modify_original_dataframe():
    df = make_data()
    original_cards = df["Card Type"].copy()

    clean_data(df)

    pd.testing.assert_series_equal(df["Card Type"], original_cards)


def test_clean_data_rejects_unknown_card_type():
    df = make_data()
    df.loc[0, "Card Type"] = "BRONZE"

    # Current behavior of your dictionary lookup.
    with pytest.raises(KeyError):
        clean_data(df)


# -------------------------
# build_column_transformer()
# -------------------------

def test_column_transformer_output_shape():
    df = clean_data(make_data(include_target=False))

    transformer = build_column_transformer()
    result = transformer.fit_transform(df)

    # 13 input features become 14 transformed features:
    # 2 passthrough + 3 encoded + 9 scaled.
    assert result.shape == (len(df), 14)


def test_column_transformer_preserves_binary_columns():
    df = clean_data(make_data(include_target=False))

    transformer = build_column_transformer()
    result = transformer.fit_transform(df)

    if issparse(result):
        result = result.toarray()

    # The passthrough transformer is declared first.
    assert result[:, 0].tolist() == df["HasCrCard"].tolist()
    assert result[:, 1].tolist() == df["IsActiveMember"].tolist()


def test_column_transformer_ignores_unknown_geography():
    df = clean_data(make_data(include_target=False))

    transformer = build_column_transformer()
    transformer.fit(df)

    new_customer = df.iloc[[0]].copy()
    new_customer["Geography"] = "France"

    # handle_unknown="ignore" should allow transformation.
    result = transformer.transform(new_customer)

    assert result.shape == (1, 14)