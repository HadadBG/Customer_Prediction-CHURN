## Running with Docker Compose

The project can be deployed locally using Docker Compose. The application runs in two separate containers: a FastAPI backend for customer churn predictions and a React frontend served by Nginx.

### Architecture

- **Frontend:** React + Vite, built for production and served by Nginx.
- **Backend:** Python + FastAPI, responsible for loading the trained model and generating predictions.
- **Model artifact:** `artifacts/churn_model.joblib`.
- **Networking:** Nginx serves the frontend on port `8080` and forwards API requests to the backend through Docker's internal network.

```text
Browser
   |
   | http://localhost:8080
   v
Frontend (Nginx)
   |
   | /api/*
   v
Backend (FastAPI, port 8000)
   |
   v
Trained churn model
```

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with the Linux container engine enabled.
- Docker Compose v2.
- Internet access to download the required base images and dependencies during the initial build.

### Start the application

From the project root, run:

```bash
docker compose up --build -d
```

This command builds the frontend and backend images, creates the required network, and starts both services in the background.

Check the container status:

```bash
docker compose ps
```

### Access the application

Once the containers are running, use the following URLs:

| Resource | URL |
|---|---|
| Web application | http://localhost:8080 |
| FastAPI Swagger documentation | http://localhost:8080/api/docs |

The backend is not published directly to the host by default. API requests from the frontend are routed through Nginx using the `/api/` prefix.

### Useful Docker Compose commands

**View logs:**

```bash
docker compose logs -f
```

View logs for a specific service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Stop the application:**

```bash
docker compose stop
```

**Restart stopped containers:**

```bash
docker compose start
```

**Rebuild after changing the source code or model:**

```bash
docker compose up --build -d
```

**Stop and remove the containers:**

```bash
docker compose down
```

This command removes the containers and the Compose network but keeps the locally built images.

### Troubleshooting

- **Image download or build errors:** Ensure Docker Desktop is running and can access the container registries. Corporate networks may require configuring a proxy in Docker Desktop.
- **Frontend unavailable:** Check the container status and frontend logs using `docker compose ps` and `docker compose logs frontend`.
- **Backend errors:** Inspect `docker compose logs backend` and verify that `artifacts/churn_model.joblib` is available when building the image.
- **CSV upload errors:** The Nginx configuration limits request bodies to 20 MB.


## Running without Docker

This project can also be executed locally without Docker. The backend and frontend run independently, so both environments must be configured.

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.14+ | Backend |
| uv | Latest | Python package manager |
| Node.js | 24+ | Frontend |
| npm | Included with Node.js | Frontend dependencies |
| Git | Latest | Repository management |

---

### 1. Clone the repository

```bash
git clone https://github.com/HadadBG/Customer_Prediction-CHURN
cd Customer_Prediction-CHURN
```

### 2. Backend Setup (Python)

#### Install uv

**Windows (PowerShell)**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS / Linux**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Verify the installation:

```bash
uv --version
```

#### Install dependencies

**Development**

Installs all dependencies, including development tools and testing libraries.

```bash
uv sync
```

**Production**

Installs only the dependencies required to run the application.

```bash
uv sync --no-dev
```

#### Launch the API

From the project root:

```bash
uv run api
```

The API will be available at:

```text
http://localhost:8000
```

API documentation (Swagger UI):

```text
http://localhost:8000/docs
```

#### (Optional) Launch JupyterLab

If development dependencies are installed:

```bash
uv run jupyter lab
```

---

### 3. Frontend Setup (React + Vite)

Make sure Node.js and npm are installed.

Verify the installation:

```bash
node --version
npm --version
```

Navigate to the frontend directory:

```bash
cd frontend
```

#### Install dependencies

```bash
npm ci
```

#### Run in development mode

```bash
npm run dev
```

Vite will start the development server. By default, it is available at:

```text
http://localhost:5173
```

#### Build for production

To generate the optimized production files:

```bash
npm run build
```

The resulting files will be generated in the `dist/` directory.

To locally preview the production build:

```bash
npm run preview
```

---

### 4. Application Configuration

Make sure the frontend API endpoint points to the backend instance:

```text
http://localhost:8000/predict
```

Both services must be running for the application to work correctly.

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

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
| Gradient Boosting | Own Implementation | 0.8755 | 0.5207 | 0.8007 | 0.6311 |
| Gradient Boosting | Scikit-learn | 0.8685 | 0.4914 | 0.7815 | 0.6045 |
| XGBoost | XGBoost Team | 0.8785 | 0.5305 | 0.8097 | 0.6410 |
| XGBoost | Own Implementation | 0.8785 | 0.5305 | 0.8097 | ***0.6410*** |

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



## 🚧 Status

Current phase:

- [x] Project initialization
- [x] Dataset selected
- [x] Exploratory Data Analysis
- [x] Data preprocessing
- [x] Model training
- [x] Model comparison
- [x] FastAPI
- [x] FrontEnd
- [x] Docker
- [x] Test BackEnd
- [ ] 🚧 Test FrontEnd (In Progress)
- [ ] CI/CD
- [ ] Explainable Artificial Intelligence (SHAP)
- [ ] Deployment