## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- Python **3.14+**
- Git
- uv (Python package manager)

### 1. Install uv

#### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### macOS / Linux

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Verify the installation:

```bash
uv --version
```

### 2. Clone the repository

```bash
git clone https://github.com/HadadBG/Customer_Prediction-CHURN
cd Customer_Prediction-CHURN
```

### 3. Install dependencies
#### Development
```bash
uv sync
```
#### Production
```bash
uv sync --no-dev
```
### 4. Activate the virtual environment

#### Windows (PowerShell)

```powershell
.venv\Scripts\Activate.ps1
```

#### Windows (Command Prompt)

```cmd
.venv\Scripts\activate.bat
```

#### Linux / macOS

```bash
source .venv/bin/activate
```
### Launch JupyterLab

```bash
jupyter lab
```

## 🛢️ Dataset
This project uses the **Customer Churn Records** dataset from Kaggle.

The dataset contains customer demographic and banking information used to predict whether a customer will leave the bank (churn).

You can download the dataset from:
- Kaggle: https://www.kaggle.com/datasets/radheshyamkollipara/bank-customer-churn

After downloading it, place the dataset in:

```
churn_model/data/Customer-Churn-Records.csv
```

## ✅ Model Performance Comparison
The table below compares the performance of the custom machine learning implementations with their Scikit-learn equivalents on the Customer Churn dataset.

| Algorithm | Implementation | Accuracy | Recall | Precision | F1 Score |
|---------------|-------:|-------:|-------:|----------:|---------:|
| Logistic Regression | Own Implementation | 0.7820 | 0.5574 | 0.4720 | 0.5112 |
| Logistic Regression| Scikit-learn | 0.7815 | 0.5550 | 0.4709 | 0.5095 |
| K-Nearest Neighbors | Own Implementation | 0.8335 | 0.3936 | 0.6544 | 0.4916 |
| K-Nearest Neighbors | Scikit-learn | 0.8335 | 0.3936 | 0.6544 | 0.4916 |
| Decision Tree | Own Implementation | 0.8625 | 0.5281 | 0.7248 | 0.6110 |
| Decision Tree | Scikit-learn | 0.8625 | 0.5281 | 0.7248 | 0.6110 |
| Random Forest | Own Implementation | 0.8740 | 0.4987 | 0.8120 | 0.6181 |
| Random Forest | Scikit-learn | 0.8655 | 0.4400 | 0.8181 | 0.5723 |
| Gradient Boosting | Own Implementation | 0.8735 | 0.4889 | 0.8196 | 0.6125 |
| Gradient Boosting | Scikit-learn | 0.8670 | 0.5061 | 0.7638 | 0.6088 |
| XGBoost | XGBoost Team | 0.8720 | 0.4865 | 0.8122 | 0.6085 |
| XGBoost | Own Implementation | 0.8760 | 0.5134 | 0.8108 | ***0.6287*** |

## 💪 Model Training

Train the churn prediction model using the default dataset:

```
uv run train
```

By default, the training script uses /data/Customer-Churn-Records.csv.

Custom Dataset

To train the model using a different dataset, specify its path with the --data argument:

```
uv run train --data "./data/Customer-Churn-Records.csv"
```

The --data argument accepts a custom path to the CSV file you want to use for training.

## 🚀 Running the API

This project uses FastAPI and Uvicorn to expose the churn prediction model through a REST API.

1. Start the API

From the project root directory, run:

```
uv run api
```

This command starts the Uvicorn server using the configuration defined in api/__main__.py.

By default, the API listens on port 8000.

2. Access the API

Once the server is running, you can access the following endpoints:

API documentation (Swagger UI): http://127.0.0.1:8000/docs

Alternative API documentation (ReDoc): http://127.0.0.1:8000/redoc

API root: http://127.0.0.1:8000/

Note: Make sure the trained model and preprocessing artifacts are available in the expected locations before starting the API, by default the repository includes a pretrained object.

## 🚧 Status

Current phase:

- [x] Project initialization
- [x] Dataset selected
- [x] Exploratory Data Analysis
- [x] Data preprocessing
- [x] Model training
- [x] Model comparison
- [x] FastAPI
- [ ] 🚧 FrontEnd (In Progress)
- [ ] Docker
- [ ] CI/CD
- [ ] Deployment

