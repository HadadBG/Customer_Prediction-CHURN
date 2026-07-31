## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- Python **3.14+**
- Git
- uv (Python package manager)

### 1.-Install uv

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

### 2.-Clone the repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### 3.-Install dependencies
#### Development
```bash
uv sync
```
#### Production
```bash
uv sync --no-dev
```
### 4.-Activate the virtual environment

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
### Run Notebooks

```bash
jupyter lab
```
## 🚧 Status

Current phase:

- [x] Project initialization
- [x] Dataset selected
- [ ] Exploratory Data Analysis
- [ ] Data preprocessing
- [ ] Model training
- [ ] Model comparison
- [ ] FastAPI
- [ ] PostgreSQL
- [ ] Docker
- [ ] CI/CD
- [ ] Deployment

