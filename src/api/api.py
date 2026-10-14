
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from churn_prediction import predict_from_python_obj,predict_from_file
from io import StringIO
from fastapi.responses import StreamingResponse
import uvicorn

app = FastAPI(
    title="Customer Churn Prediction API",
    description="API for predicting customer churn",
    version="0.1.0",
)


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(customer: dict[str, Any]) -> dict[str, Any]:
    try:
        result = predict_from_python_obj(customer)
    except (ValueError, KeyError) as exc:
        
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return jsonable_encoder(result)

@app.post("/predict_file")
async def predict_file(file: UploadFile = File(...)):
    buffer = StringIO()
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=415,
            detail="Only CSV files are supported"
        )

    try:
        predict_from_file(file.file,buffer)
       
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid CSV file"
        ) from exc
    buffer.seek(0)

    # Validate columns and preprocess the data.
    # predictions = model.predict(df)

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                'attachment; filename="predictions.csv"'
            )
        }
    )
def main():
    uvicorn.run(
            "api.api:app",
            host="0.0.0.0",
            port=8000
        )