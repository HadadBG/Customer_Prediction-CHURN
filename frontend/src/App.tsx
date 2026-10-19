
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import "./App.css";
import CustomerQuiz from "./CustomerQuiz";

type Screen = "home" | "quiz";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      setFileError("Please select a valid CSV file.");
      return;
    }

    setSelectedFile(file);
    setFileError("");
  };
const handleProcessCsv = async (file: File) => {
  setFileError(null);
  setIsProcessing(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "http://localhost:8000/predict_file",
      {
        method: "POST",
        body: formData,
      }
    );

    // Handle errors returned by FastAPI
    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => null)) as { detail?: unknown } | null;

      let message = `Unable to process the CSV (HTTP ${response.status}).`;

      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        message = errorData.detail
          .map((item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof item.msg === "string"
            ) {
              return item.msg;
            }

            return "";
          })
          .filter(Boolean)
          .join(". ") || message;
      }

      throw new Error(message);
    }

    // Only download the response when the request succeeds
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `${file.name.replace(/\.csv$/i, "")}-predictions.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: unknown) {
    setFileError(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the CSV."
    );
  } finally {
    setIsProcessing(false);
  }
};
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => setScreen("home")}
          aria-label="Return to home"
        >
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M7 22V16M13 22V10M19 22V14M25 22V6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M5 25H27"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity=".5"
              />
            </svg>
          </span>
          <span className="brand-name">
            Prediction<span>Churn</span>
          </span>
        </button>

        <div className="workspace-label">
          <span className="workspace-dot" />
          <span>CHURN PREDICTION WORKSPACE</span>
        </div>
      </header>

      {screen === "home" ? (
        <main className="dashboard">
          

          <section className="workflow-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">GET STARTED</p>
                 
                <h2>Choose your workflow</h2>
                <p className="section-description">
                  How would you like to analyze customer churn today?
                </p>
              </div>
 <div className="hero-highlights">
              <div className="highlight">
                <span className="highlight-icon">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12L11 14L15 10"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>ML-powered predictions</span>
              </div>

              <span className="highlight-divider" />

              <div className="highlight">
                <span className="highlight-icon">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 9H16M8 13H16M8 17H12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span>Individual & batch analysis</span>
              </div>
            </div>
           
            </div>

            <div className="workflow-grid">
              {/* Option 1: Individual customer quiz */}
              <article className="workflow-card assessment-card">
                <div className="card-topline">
                  <span className="card-index">01 / INDIVIDUAL</span>

                  <span className="card-icon light-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="9"
                        cy="8"
                        r="3.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M3 20V18C3 14.7 5.7 12 9 12C12.3 12 15 14.7 15 18V20"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="17"
                        cy="17"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M17 15V19M15 17H19"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>

                <div className="card-content">
                  <h3>Assess one customer</h3>
                  <p>
                    Answer a few guided questions about a customer and
                    estimate their likelihood of leaving.
                  </p>

                  <div className="card-tags">
                    <span>Guided questionnaire</span>
                    <span>~ 2 minutes</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="footer-hint">
                    Ideal for individual assessments
                  </span>

                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => setScreen("quiz")}
                  >
                    Start assessment
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12H19M12 5L19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </article>

              {/* Option 2: CSV batch predictions */}
              <article className="workflow-card batch-card">
                <div className="card-topline">
                  <span className="card-index">02 / BATCH ANALYSIS</span>

                  <span className="card-icon dark-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M13 3H6C4.9 3 4 3.9 4 5V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V10L13 3Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 3V10H20M8 14H16M8 17H16"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>

                <div className="card-content">
                  <h3>Analyze a customer list</h3>
                  <p>
  Upload a CSV dataset to generate churn predictions
  for multiple customers in a single operation.
</p>

<a
  className="sample-download"
  href={`${import.meta.env.BASE_URL}Example.csv`}
  download="sample-churn.csv"
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 3V15M7 10L12 15L17 10M5 17V20H19V17"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  Download sample CSV
</a>
                  <div
                    className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <span className="upload-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 16V4M7 9L12 4L17 9"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 14V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <div className="drop-copy">
                      <span className="drop-title">
                        Drag & drop your CSV
                      </span>
                      <span className="drop-subtitle">
                        or browse files from your computer
                      </span>
                    </div>

                    <button
                      className="browse-button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse files
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    className="visually-hidden"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    aria-label="Select a CSV file"
                  />

                  {fileError && (
                    <p className="file-error" role="alert">
                      {fileError}
                    </p>
                  )}

                  {selectedFile && (
                    <div className="selected-file">
                      <span className="file-check">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12L10 17L20 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <div className="selected-file-info">
                        <span className="selected-file-name">
                          {selectedFile.name}
                        </span>
                        <span className="selected-file-size">
                          {formatFileSize(selectedFile.size)} · Selected
                        </span>
                      </div>

                      <button
                        className="remove-file"
                        type="button"
                        aria-label="Remove selected file"
                        onClick={() => setSelectedFile(null)}
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>

                <div className="batch-footer">
                  <span className="footer-hint">
                    <span className="csv-indicator">CSV</span>
                    Batch processing
                  </span>

                  <button
                    className="secondary-action"
                    disabled={isProcessing}
                    type="button"
                    onClick={() => {
        if (isProcessing) return;

        if (selectedFile) {
            void handleProcessCsv(selectedFile);
        } else {
            fileInputRef.current?.click();
        }
    }}

    
                  >
                     {isProcessing ? (
        <>
            <span className="spinner" />
            Processing...
        </>
    ) : selectedFile ? (
        "Process CSV"
    ) : (
        "Browse file"
    )}
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12H19M12 5L19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {selectedFile && (
                  <p className="selection-note">
                    File selected. Prediction processing will be connected
                    to the API in the next step.
                  </p>
                )}
              </article>
            </div>
          </section>

          <footer className="page-footer">
            <span>
              <span className="footer-dot" />
              CUSTOMER CHURN PREDICTION
            </span>
            <span>Predictions are estimates, not guarantees.</span>
          </footer>
        </main>
      ) : (
        <main className="quiz-page">
          <button
            className="back-link"
            type="button"
            onClick={() => setScreen("home")}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 12H5M12 19L5 12L12 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to workspace
          </button>

         <CustomerQuiz/>
        </main>
      )}
    </div>
  );
}

export default App;
