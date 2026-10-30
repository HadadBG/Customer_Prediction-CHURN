
import numpy as np
import pandas as pd
import pytest

import churn_prediction.predict as prediction_module


# --------------------------------------------------
# Clases auxiliares para simular el modelo
# --------------------------------------------------

class FakeColumnTransformer:

    def __init__(self):
        self.received_data = None

    def transform(self, X):
        self.received_data = X.copy()
        return X.copy()


class FakeModel:

    def __init__(self, predictions):
        self.predictions = np.array(predictions)
        self.received_data = None

    def predict(self, X):
        self.received_data = X
        return self.predictions.copy()


# --------------------------------------------------
# Configuración común para las pruebas
# --------------------------------------------------

def configure_pipeline(monkeypatch, predictions):

    model = FakeModel(predictions)
    transformer = FakeColumnTransformer()

    artifacts = {
        "model": model,
        "columnTransformer": transformer
    }

    monkeypatch.setattr(
        prediction_module.joblib,
        "load",
        lambda _: artifacts
    )

    monkeypatch.setattr(
        prediction_module,
        "validate_test_data",
        lambda df: None
    )

    monkeypatch.setattr(
        prediction_module,
        "clean_data",
        lambda df: df.copy()
    )

    return model, transformer


def make_dataframe(include_target=False):

    data = {
        "CreditScore": [650, 700],
        "Geography": ["Germany", "France"],
        "Gender": ["Male", "Female"],
        "Age": [35, 45],
    }

    if include_target:
        data["Exited"] = [0, 0]

    return pd.DataFrame(data)


# --------------------------------------------------
# Tests de __get_if_correct__
# --------------------------------------------------


def test_get_if_correct():
    prediction_binary=[1,0,1,0]
    y=[1,0,0,1]
    expected=["TRUE","TRUE","FALSE","FALSE"]
    results= list(map(prediction_module.__get_if_correct__,zip(prediction_binary,y)))

    assert results == expected


# --------------------------------------------------
# Tests de predict_from_data_frame
# --------------------------------------------------

def test_predict_from_data_frame_returns_first_score(monkeypatch):

    configure_pipeline(
        monkeypatch,
        predictions=[0.72, 0.15]
    )

    df = make_dataframe()

    result = prediction_module.predict_from_data_frame(df)

    assert result == pytest.approx(0.72)


def test_predict_from_data_frame_creates_output_csv(
    monkeypatch,
    tmp_path
):

    configure_pipeline(
        monkeypatch,
        predictions=[0.20, 0.80]
    )

    df = make_dataframe(include_target=True)

    output_path = tmp_path / "predictions.csv"

    result = prediction_module.predict_from_data_frame(
        df,
        output_path
    )

    assert result is None
    assert output_path.exists()

    result_df = pd.read_csv(output_path,dtype={"correct_prediction": str})

    assert result_df["score"].tolist() == pytest.approx(
        [0.20, 0.80]
    )

    assert result_df["prediction"].tolist() == [0, 1]

    assert result_df["correct_prediction"].tolist() == [
        "TRUE",
        "FALSE"
    ]


def test_predict_from_data_frame_without_target(
    monkeypatch,
    tmp_path
):

    configure_pipeline(
        monkeypatch,
        predictions=[0.80, 0.20]
    )

    df = make_dataframe()

    output_path = tmp_path / "predictions.csv"

    prediction_module.predict_from_data_frame(
        df,
        output_path
    )

    result_df = pd.read_csv(output_path)

    assert "correct_prediction" not in result_df.columns
    assert "Exited" not in result_df.columns
    assert "score" in result_df.columns
    assert "prediction" in result_df.columns


def test_predict_from_data_frame_validation_error(monkeypatch):

    configure_pipeline(
        monkeypatch,
        predictions=[0.80]
    )

    def raise_validation_error(df):
        raise ValueError("Invalid dataframe")

    monkeypatch.setattr(
        prediction_module,
        "validate_test_data",
        raise_validation_error
    )

    df = make_dataframe()

    with pytest.raises(ValueError, match="Invalid dataframe"):
        prediction_module.predict_from_data_frame(df)


# --------------------------------------------------
# Tests de predict_from_file
# --------------------------------------------------

def test_predict_from_file_reads_csv_and_calls_prediction(
    monkeypatch
):

    df = make_dataframe()

    calls = {}

    def fake_read_csv(file_path, sep=","):
        calls["file_path"] = file_path
        calls["sep"] = sep
        return df

    def fake_predict_from_data_frame(dataframe, output_path=None):
        calls["dataframe"] = dataframe
        calls["output_path"] = output_path

    monkeypatch.setattr(
        prediction_module.pd,
        "read_csv",
        fake_read_csv
    )

    monkeypatch.setattr(
        prediction_module,
        "predict_from_data_frame",
        fake_predict_from_data_frame
    )

    prediction_module.predict_from_file(
        "input.csv",
        "output.csv"
    )

    assert calls["file_path"] == "input.csv"
    assert calls["sep"] == ","
    assert calls["dataframe"].equals(df)
    assert calls["output_path"] == "output.csv"


# --------------------------------------------------
# Tests de predict_from_python_obj
# --------------------------------------------------

def test_predict_from_python_obj_returns_expected_result(
    monkeypatch
):

    model, transformer = configure_pipeline(
        monkeypatch,
        predictions=[0.60]
    )

    data = {
        "Age": 35,
        "CreditScore": 688,
        "Gender": "Male",
        "Geography": "Germany",
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

    result = prediction_module.predict_from_python_obj(data)

    assert result == {
        "score": pytest.approx(0.60),
        "prediction": True
    }

    # Comprobar que las columnas llegan en el orden esperado.
    assert transformer.received_data.columns.tolist() == list(
        prediction_module.order_dict.keys()
    )


def test_predict_from_python_obj_below_threshold(monkeypatch):

    configure_pipeline(
        monkeypatch,
        predictions=[0.20]
    )

    data = {
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

    result = prediction_module.predict_from_python_obj(data)

    assert result["score"] == pytest.approx(0.20)
    assert result["prediction"] is False
