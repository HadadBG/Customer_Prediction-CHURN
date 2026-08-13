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
| Decision Tree | Own Implementation | - | - | - | - |
| Decision Tree | Scikit-learn | - | - | - | - |
| Random Forest | Own Implementation | - | - | - | - |
| Random Forest | Scikit-learn | - | - | - | - |
## 🚧 Status

Current phase:

- [x] Project initialization
- [x] Dataset selected
- [x] Exploratory Data Analysis
- [x] Data preprocessing
- [x] Model training
- [ ] 🚧 Model comparison (In Progress)
- [ ] FastAPI
- [ ] PostgreSQL
- [ ] Docker
- [ ] CI/CD
- [ ] Deployment

