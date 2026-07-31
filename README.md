## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- Python **3.14+**
- Git
- uv (Python package manager)

### Install uv

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

### Clone the repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

### Install dependencies
#### Development
```bash
uv sync
```
####Production
```bash
uv sync --no-dev
```
### Run Notebooks

```bash
jupyter lab
```
