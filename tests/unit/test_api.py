
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock

import api.api as api_module


@pytest.fixture
def client():
    return TestClient(api_module.app)


# --------------------------------------------------
# GET /
# --------------------------------------------------

def test_health_returns_ok(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# --------------------------------------------------
# POST /predict
# --------------------------------------------------

def test_predict_returns_prediction(client, monkeypatch):
    customer = {
        "CreditScore": 650,
        "Geography": "France",
        "Gender": "Male",
        "Age": 35,
        "Tenure": 5,
        "Balance": 120000,
        "NumOfProducts": 2
    }

    expected_result = {
        "prediction": True,
        "score": 0.85
    }

    received_customer = {}

    def fake_predict(customer_data):
        received_customer.update(customer_data)
        return expected_result

    monkeypatch.setattr(
        api_module,
        "predict_from_python_obj",
        fake_predict
    )

    response = client.post("/predict", json=customer)

    assert response.status_code == 200
    assert response.json() == expected_result
    assert received_customer == customer


@pytest.mark.parametrize(
    "exception",
    [
        ValueError("Invalid customer data"),
        KeyError("Age")
    ]
)
def test_predict_returns_422_on_validation_error(
    client,
    monkeypatch,
    exception
):
    def fake_predict(customer):
        raise exception

    monkeypatch.setattr(
        api_module,
        "predict_from_python_obj",
        fake_predict
    )

    response = client.post(
        "/predict",
        json={"CreditScore": 650}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == str(exception)


def test_predict_returns_500_on_unexpected_error(monkeypatch):
    def fake_predict(customer):
        raise RuntimeError("Unexpected error")

    monkeypatch.setattr(
        api_module,
        "predict_from_python_obj",
        fake_predict
    )

    test_client = TestClient(
        api_module.app,
        raise_server_exceptions=False
    )

    response = test_client.post(
        "/predict",
        json={"CreditScore": 650}
    )

    assert response.status_code == 500


# --------------------------------------------------
# POST /predict_file
# --------------------------------------------------

def test_predict_file_returns_csv(client, monkeypatch):
    csv_content = b"CustomerId,CreditScore\n1,650\n"

    received_content = {}

    def fake_predict_from_file(input_file, output_buffer):
        received_content["data"] = input_file.read()

        output_buffer.write(
            "CustomerId,Prediction,Score\n"
            "1,False,0.25\n"
        )

    monkeypatch.setattr(
        api_module,
        "predict_from_file",
        fake_predict_from_file
    )

    response = client.post(
        "/predict_file",
        files={
            "file": (
                "customers.CSV",
                csv_content,
                "text/csv"
            )
        }
    )

    assert response.status_code == 200

    assert response.text == (
        "CustomerId,Prediction,Score\n"
        "1,False,0.25\n"
    )

    assert response.headers["content-type"].startswith("text/csv")

    assert response.headers["content-disposition"] == (
        'attachment; filename="predictions.csv"'
    )

    assert received_content["data"] == csv_content


def test_predict_file_rejects_non_csv(client, monkeypatch):
    predict_mock = Mock()

    monkeypatch.setattr(
        api_module,
        "predict_from_file",
        predict_mock
    )

    response = client.post(
        "/predict_file",
        files={
            "file": (
                "customers.txt",
                b"Invalid file",
                "text/plain"
            )
        }
    )

    assert response.status_code == 415

    assert response.json() == {
        "detail": "Only CSV files are supported"
    }

    predict_mock.assert_not_called()


def test_predict_file_returns_400_on_processing_error(
    client,
    monkeypatch
):
    def fake_predict_from_file(input_file, output_buffer):
        raise ValueError("Invalid CSV structure")

    monkeypatch.setattr(
        api_module,
        "predict_from_file",
        fake_predict_from_file
    )

    response = client.post(
        "/predict_file",
        files={
            "file": (
                "customers.csv",
                b"Invalid CSV content",
                "text/csv"
            )
        }
    )

    assert response.status_code == 400

    assert response.json() == {
        "detail": "Invalid CSV file"
    }


# --------------------------------------------------
# CORS
# --------------------------------------------------

def test_cors_allows_frontend_origin(client):
    response = client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )

    assert response.status_code == 200

    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:5173"
    )

    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_rejects_unauthorized_origin(client):
    response = client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"
        }
    )

    assert response.status_code == 400

    assert "access-control-allow-origin" not in response.headers


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def test_main_starts_uvicorn(monkeypatch):
    mock_run = Mock()

    monkeypatch.setattr(
        api_module.uvicorn,
        "run",
        mock_run
    )

    api_module.main()

    mock_run.assert_called_once_with(
        "api.api:app",
        host="0.0.0.0",
        port=8000
    )
