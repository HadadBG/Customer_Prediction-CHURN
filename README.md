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
git clone https://github.com/your-username/your-repository.git
cd your-repository
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


## ✅ Model Performance Comparison

| Algorithm | Implementation | Accuracy | Recall | Precision | F1 Score |
|---------------|-------:|-------:|-------:|----------:|---------:|
| Logistic Regression | Manual | 0.7820 | 0.5574 | 0.4720 | 0.5112 |
| Logistic Regression| Scikit-learn | 0.7815 | 0.5550 | 0.4709 | 0.5095 |
| K-Nearest Neighbors | Manual | - | - | - | - |
| K-Nearest Neighbors | Scikit-learn | - | - | - | - |
| Desicion Tree | Manual | - | - | - | - |
| Desicion Tree | Scikit-learn | - | - | - | - |
| Random Forest | Manual | - | - | - | - |
| Random Forest | Scikit-learn | - | - | - | - |
## 🚧 Status

Current phase:

- [x] Project initialization
- [x] Dataset selected
- [x] Exploratory Data Analysis
- [x] Data preprocessing
- [x] Model training
- 🚧 Model comparison (In Progress)
- [ ] FastAPI
- [ ] PostgreSQL
- [ ] Docker
- [ ] CI/CD
- [ ] Deployment

