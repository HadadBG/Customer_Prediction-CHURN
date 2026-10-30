
import sys
from pathlib import Path
from unittest.mock import Mock

import numpy as np
import pandas as pd
import pytest

import churn_prediction.train as train_module


# --------------------------------------------------
# Test principal: entrenamiento y guardado del modelo
# --------------------------------------------------

@pytest.mark.parametrize(
    ("cli_args", "expected_csv"),
    [
        pytest.param(
            [],
            "./data/Customer-Churn-Records.csv",
            id="default-data-path",
        ),
        pytest.param(
            ["--data", "dataset.csv"],
            "dataset.csv",
            id="custom-data-path",
        ),
    ],
)
def test_main_trains_model_and_saves_artifact(
    monkeypatch,
    tmp_path,
    capsys,
    cli_args,
    expected_csv,
):
    # --------------------------------------------------
    # Arrange: preparar argumentos y datos
    # --------------------------------------------------

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(sys, "argv", ["train.py", *cli_args])

    df = pd.DataFrame({
        "CreditScore": [600, 700, 650, 750],
        "Geography": ["France", "Spain", "France", "Germany"],
        "Gender": ["Male", "Female", "Male", "Female"],
        "Age": [30, 40, 35, 45],
        "Exited": [0, 1, 0, 1],
    })

    X_train = df.drop("Exited", axis=1).iloc[:2]
    X_test = df.drop("Exited", axis=1).iloc[2:]

    # Utilizar índices diferentes para comprobar reset_index()
    y_train = pd.Series([0, 1], index=[10, 20])
    y_test = pd.Series([0, 1], index=[30, 40])

    # --------------------------------------------------
    # Mock: lectura, validación y limpieza
    # --------------------------------------------------

    read_csv_mock = Mock(return_value=df)
    validate_mock = Mock()
    clean_mock = Mock(return_value=df)

    monkeypatch.setattr(
        train_module.pd,
        "read_csv",
        read_csv_mock,
    )

    monkeypatch.setattr(
        train_module,
        "validate_training_data",
        validate_mock,
    )

    monkeypatch.setattr(
        train_module,
        "clean_data",
        clean_mock,
    )

    # --------------------------------------------------
    # Mock: train_test_split
    # --------------------------------------------------

    split_mock = Mock(
        return_value=(X_train, X_test, y_train, y_test)
    )

    monkeypatch.setattr(
        train_module,
        "train_test_split",
        split_mock,
    )

    # --------------------------------------------------
    # Fake: ColumnTransformer
    # --------------------------------------------------

    class FakeColumnTransformer:

        def __init__(self):
            self.fit_data = None
            self.transform_data = None

        def fit_transform(self, X):
            self.fit_data = X.copy()
            return "transformed_train"

        def transform(self, X):
            self.transform_data = X.copy()
            return "transformed_test"

    ct = FakeColumnTransformer()

    monkeypatch.setattr(
        train_module,
        "build_column_transformer",
        lambda: ct,
    )

    # --------------------------------------------------
    # Fake: XGBoostModel
    # --------------------------------------------------

    created_models = []

    class FakeXGBoostModel:

        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.fit_args = None
            self.predictions = np.array([0.40, 0.41])

            created_models.append(self)

        def fit(self, X, y):
            self.fit_args = (X, y)

        def predict(self, X):
            assert X == "transformed_test"
            return self.predictions

    monkeypatch.setattr(
        train_module,
        "XGBoostModel",
        FakeXGBoostModel,
    )

    # --------------------------------------------------
    # Mock: métricas y guardado
    # --------------------------------------------------

    f1_mock = Mock(return_value=0.75)

    monkeypatch.setattr(
        train_module,
        "f1_score",
        f1_mock,
    )

    dump_mock = Mock()

    monkeypatch.setattr(
        train_module.joblib,
        "dump",
        dump_mock,
    )

    # --------------------------------------------------
    # Act: ejecutar main()
    # --------------------------------------------------

    train_module.main()

    # --------------------------------------------------
    # Assert: lectura, validación y limpieza
    # --------------------------------------------------

    read_csv_mock.assert_called_once_with(
        expected_csv,
        sep=",",
    )

    validate_mock.assert_called_once_with(df)
    clean_mock.assert_called_once_with(df)

    # --------------------------------------------------
    # Assert: división de los datos
    # --------------------------------------------------

    split_args, split_kwargs = split_mock.call_args

    pd.testing.assert_frame_equal(
        split_args[0],
        df.drop("Exited", axis=1),
    )

    pd.testing.assert_series_equal(
        split_args[1],
        df["Exited"],
    )

    assert split_kwargs == {
        "test_size": 0.2,
        "random_state": 67,
    }

    # --------------------------------------------------
    # Assert: transformación de datos
    # --------------------------------------------------

    pd.testing.assert_frame_equal(
        ct.fit_data,
        X_train,
    )

    pd.testing.assert_frame_equal(
        ct.transform_data,
        X_test,
    )

    # --------------------------------------------------
    # Assert: configuración y entrenamiento del modelo
    # --------------------------------------------------

    assert len(created_models) == 1

    model = created_models[0]

    assert model.kwargs == {
        "depth_trees": 5,
        "n_trees": 70,
        "learning_rate": 0.16,
        "lambda_param": 10,
        "gamma_param": 0,
        "min_child_weight": 1,
    }

    assert model.fit_args[0] == "transformed_train"

    np.testing.assert_array_equal(
        model.fit_args[1],
        np.array([0, 1]),
    )

    # --------------------------------------------------
    # Assert: predicción y threshold
    # --------------------------------------------------

    f1_mock.assert_called_once()

    metric_args = f1_mock.call_args.args

    pd.testing.assert_series_equal(
        metric_args[0],
        y_test,
    )

    np.testing.assert_array_equal(
        metric_args[1],
        np.array([0, 1]),
    )

    # --------------------------------------------------
    # Assert: artefacto del modelo
    # --------------------------------------------------

    dump_mock.assert_called_once()

    artifact, output_path = dump_mock.call_args.args

    assert artifact["model"] is model
    assert artifact["columnTransformer"] is ct

    assert output_path == Path(
        "artifacts/churn_model.joblib"
    )

    assert output_path.parent.exists()

    # --------------------------------------------------
    # Assert: mensajes impresos
    # --------------------------------------------------

    captured = capsys.readouterr()

    assert "Model Trained Succesfull" in captured.out
    assert "f1_score:0.75" in captured.out
    assert "Model saved at:" in captured.out


# --------------------------------------------------
# Test: detener el entrenamiento si los datos son inválidos
# --------------------------------------------------

def test_main_stops_when_training_data_is_invalid(
    monkeypatch,
):
    monkeypatch.setattr(
        sys,
        "argv",
        ["train.py"],
    )

    df = pd.DataFrame({
        "CreditScore": [600],
        "Exited": [0],
    })

    monkeypatch.setattr(
        train_module.pd,
        "read_csv",
        Mock(return_value=df),
    )

    validate_mock = Mock(
        side_effect=ValueError("Invalid training data")
    )

    clean_mock = Mock()
    split_mock = Mock()

    monkeypatch.setattr(
        train_module,
        "validate_training_data",
        validate_mock,
    )

    monkeypatch.setattr(
        train_module,
        "clean_data",
        clean_mock,
    )

    monkeypatch.setattr(
        train_module,
        "train_test_split",
        split_mock,
    )

    # --------------------------------------------------
    # Act & Assert
    # --------------------------------------------------

    with pytest.raises(
        ValueError,
        match="Invalid training data",
    ):
        train_module.main()

    validate_mock.assert_called_once_with(df)

    # No debe continuar si la validación falla
    clean_mock.assert_not_called()
    split_mock.assert_not_called()
