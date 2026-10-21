import { useState, type FormEvent, type ReactNode } from "react";
import "./CustomerQuiz.css";
import CircularPercentage from "./CircularPercentage";
import 'react-circular-progressbar/dist/styles.css';

type FieldName =
  | "CreditScore"
  | "Geography"
  | "Gender"
  | "Age"
  | "Tenure"
  | "Balance"
  | "NumOfProducts"
  | "HasCrCard"
  | "IsActiveMember"
  | "EstimatedSalary"
  | "Satisfaction Score"
  | "Card Type"
  | "Point Earned";

type QuizForm = Record<FieldName, string>;

type CustomerPayload = {
  CreditScore: number;
  Geography: string;
  Gender: string;
  Age: number;
  Tenure: number;
  Balance: number;
  NumOfProducts: number;
  HasCrCard: number;
  IsActiveMember: number;
  EstimatedSalary: number;
  "Satisfaction Score": number;
  "Card Type": string;
  "Point Earned": number;
};

type PredictionResult = {
  outcome: "churn" | "no-churn" | "unknown";
  probabilityPercent: number | null;
  message: string;
};

const PREDICT_URL = "/api/predict";

const initialForm: QuizForm = {
  CreditScore: "",
  Geography: "",
  Gender: "",
  Age: "",
  Tenure: "",
  Balance: "",
  NumOfProducts: "",
  HasCrCard: "",
  IsActiveMember: "",
  EstimatedSalary: "",
  "Satisfaction Score": "",
  "Card Type": "",
  "Point Earned": "",
};

const stepFields: Record<number, FieldName[]> = {
  1: ["CreditScore", "Geography", "Gender", "Age", "Tenure"],
  2: [
    "Balance",
    "NumOfProducts",
    "HasCrCard",
    "IsActiveMember",
    "EstimatedSalary",
  ],
  3: ["Satisfaction Score", "Card Type", "Point Earned"],
};

const allFields = [...stepFields[1], ...stepFields[2], ...stepFields[3]];

const numericLimits: Partial<
  Record<FieldName, { min: number; max: number; integer?: boolean }>
> = {
  CreditScore: { min: 300, max: 900, integer: true },
  Age: { min: 18, max: 100, integer: true },
  Tenure: { min: 0, max: 10, integer: true },
  Balance: { min: 0, max: 300000 },
  NumOfProducts: { min: 1, max: 4, integer: true },
  EstimatedSalary: { min: 0, max: 250000 },
  "Satisfaction Score": { min: 1, max: 5, integer: true },
  "Point Earned": { min: 0, max: 1000, integer: true },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}





function normalizePrediction(payload: unknown): PredictionResult {
  const root = isRecord(payload) ? payload : {};
  console.log(root)
  
 

  let outcome: PredictionResult["outcome"] = "unknown";
  if (typeof root.prediction === "boolean") {
    outcome = root.prediction ? "churn" : "no-churn";
  } 

  let probabilityPercent: number | null = null;
 if (typeof root.score === "number") {
    probabilityPercent = root.score*100
  } 

  const message =
    outcome === "churn"
      ? "The model predicts that this customer will churn."
      : outcome === "no-churn"
        ? "The model predicts that this customer will stay."
        : "The API returned a response, but its prediction format could not be identified automatically.";

  return { outcome, probabilityPercent, message };
}

function apiErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const detail = payload.detail ?? payload.message ?? payload.error;
  return typeof detail === "string" ? detail : null;
}

function CustomerQuiz() {
  const [form, setForm] = useState<QuizForm>(initialForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const handleChange = (field: FieldName, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setPrediction(null);
  };

  const validateFields = (fields: FieldName[]) => {
    
    const nextErrors: Partial<Record<FieldName, string>> = { ...errors };

    for (const field of fields) {
      delete nextErrors[field];
      const value = form[field].trim();

      if (!value) {
        nextErrors[field] = "This field is required.";
        continue;
      }

      const limit = numericLimits[field];
      if (limit) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          nextErrors[field] = "Enter a valid number.";
        } else if (parsed < limit.min || parsed > limit.max) {
          nextErrors[field] = `Enter a value from ${limit.min} to ${limit.max}.`;
        } else if (limit.integer && !Number.isInteger(parsed)) {
          nextErrors[field] = "Enter a whole number.";
        }
      }
    }

    setErrors(nextErrors);
    return fields.every((field) => !nextErrors[field]);
  };

  const handleNext = () => {
    
    if (validateFields(stepFields[step])) {
      setStep((current) => Math.min(current + 1, 3));
    }
  };

  const handlePrevious = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setPrediction(null);
    console.log("dubmit handled")
    if (!validateFields(allFields)) {
      const firstInvalidStep = Object.entries(stepFields).find(([, fields]) =>
        fields.some((field) => {
          const value = form[field].trim();
          const limit = numericLimits[field];
          if (!value) return true;
          if (!limit) return false;
          const parsed = Number(value);
          return (
            !Number.isFinite(parsed) ||
            parsed < limit.min ||
            parsed > limit.max ||
            (Boolean(limit.integer) && !Number.isInteger(parsed))
          );
        }),
      );
      if (firstInvalidStep) setStep(Number(firstInvalidStep[0]));
      return;
    }

    const payload: CustomerPayload = {
      CreditScore: Number(form.CreditScore),
      Geography: form.Geography,
      Gender: form.Gender,
      Age: Number(form.Age),
      Tenure: Number(form.Tenure),
      Balance: Number(form.Balance),
      NumOfProducts: Number(form.NumOfProducts),
      HasCrCard: Number(form.HasCrCard),
      IsActiveMember: Number(form.IsActiveMember),
      EstimatedSalary: Number(form.EstimatedSalary),
      "Satisfaction Score": Number(form["Satisfaction Score"]),
      "Card Type": form["Card Type"],
      "Point Earned": Number(form["Point Earned"]),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(PREDICT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseBody: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(responseBody) ?? `The API returned HTTP ${response.status}.`,
        );
      }
      if (responseBody === null) {
        throw new Error("The API response was not valid JSON. Check the /predict endpoint.");
      }

      setPrediction(normalizePrediction(responseBody));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while requesting the prediction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setForm(initialForm);
    setErrors({});
    setStep(1);
    setSubmitError("");
    setPrediction(null);
  };

  return (
    <section className="single-quiz" aria-labelledby="single-quiz-title">
      <div className="single-quiz-heading">
        <div>
          <p className="single-quiz-eyebrow">SINGLE CUSTOMER ASSESSMENT</p>
          <h1 id="single-quiz-title">Let's get to know your customer.</h1>
          <p className="single-quiz-description">
            Enter the customer's profile, account details, and card experience to estimate churn risk.
          </p>
        </div>
        <div className="single-quiz-step-count">STEP {step} OF 3</div>
      </div>

      <div className="single-quiz-progress" aria-label={`Step ${step} of 3`}>
        <span style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="single-quiz-step-labels" aria-hidden="true">
        <span className={step === 1 ? "active" : step > 1 ? "complete" : ""}>Customer profile</span>
        <span className={step === 2 ? "active" : step > 2 ? "complete" : ""}>Account details</span>
        <span className={step === 3 ? "active" : ""}>Card experience</span>
      </div>

      <form className="single-quiz-form" onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <div className="single-quiz-fields">
            <Field label="Credit score" name="CreditScore" hint="300–900" error={errors.CreditScore}>
              <input
                id="CreditScore"
                type="number"
                min="300"
                max="900"
                step="1"
                value={form.CreditScore}
                onChange={(event) => handleChange("CreditScore", event.target.value)}
                placeholder="e.g. 688"
                aria-invalid={Boolean(errors.CreditScore)}
                aria-describedby={errors.CreditScore ? "CreditScore-error" : undefined}
              />
            </Field>
            <Field label="Geography" name="Geography" error={errors.Geography}>
              <select
                id="Geography"
                value={form.Geography}
                onChange={(event) => handleChange("Geography", event.target.value)}
                aria-invalid={Boolean(errors.Geography)}
                aria-describedby={errors.Geography ? "Geography-error" : undefined}
              >
                <option value="">Select a country</option>
                <option value="México">México</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Spain">Spain</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Gender" name="Gender" error={errors.Gender}>
              <select
                id="Gender"
                value={form.Gender}
                onChange={(event) => handleChange("Gender", event.target.value)}
                aria-invalid={Boolean(errors.Gender)}
                aria-describedby={errors.Gender ? "Gender-error" : undefined}
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </Field>
            <Field label="Age" name="Age" hint="18–100" error={errors.Age}>
              <input
                id="Age"
                type="number"
                min="18"
                max="100"
                step="1"
                value={form.Age}
                onChange={(event) => handleChange("Age", event.target.value)}
                placeholder="e.g. 35"
                aria-invalid={Boolean(errors.Age)}
                aria-describedby={errors.Age ? "Age-error" : undefined}
              />
            </Field>
            <Field label="Tenure" name="Tenure" hint="Years with the credit card · 0–10 (select 10 for 10+ years)" error={errors.Tenure}>
              <input
                id="Tenure"
                type="number"
                min="0"
                max="10"
                step="1"
                value={form.Tenure}
                onChange={(event) => handleChange("Tenure", event.target.value)}
                placeholder="e.g. 5"
                aria-invalid={Boolean(errors.Tenure)}
                aria-describedby={errors.Tenure ? "Tenure-error" : undefined}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="single-quiz-fields">
            <Field label="Balance" name="Balance" hint="Balance in credit card" error={errors.Balance}>
              <input
                id="Balance"
                type="number"
                min="0"
                max="300000"
                step="0.01"
                value={form.Balance}
                onChange={(event) => handleChange("Balance", event.target.value)}
                placeholder="e.g. 111578.18"
                aria-invalid={Boolean(errors.Balance)}
                aria-describedby={errors.Balance ? "Balance-error" : undefined}
              />
            </Field>
            <Field label="Number of products" name="NumOfProducts" error={errors.NumOfProducts}>
              <select
                id="NumOfProducts"
                value={form.NumOfProducts}
                onChange={(event) => handleChange("NumOfProducts", event.target.value)}
                aria-invalid={Boolean(errors.NumOfProducts)}
                aria-describedby={errors.NumOfProducts ? "NumOfProducts-error" : undefined}
              >
                <option value="">Select quantity</option>
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="Has credit card?" name="HasCrCard" error={errors.HasCrCard}>
              <select
                id="HasCrCard"
                value={form.HasCrCard}
                onChange={(event) => handleChange("HasCrCard", event.target.value)}
                aria-invalid={Boolean(errors.HasCrCard)}
                aria-describedby={errors.HasCrCard ? "HasCrCard-error" : undefined}
              >
                <option value="">Select an option</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Active member?" name="IsActiveMember" error={errors.IsActiveMember}>
              <select
                id="IsActiveMember"
                value={form.IsActiveMember}
                onChange={(event) => handleChange("IsActiveMember", event.target.value)}
                aria-invalid={Boolean(errors.IsActiveMember)}
                aria-describedby={errors.IsActiveMember ? "IsActiveMember-error" : undefined}
              >
                <option value="">Select an option</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </Field>
            <Field label="Estimated salary" name="EstimatedSalary" hint="Annual salary estimate" error={errors.EstimatedSalary}>
              <input
                id="EstimatedSalary"
                type="number"
                min="0"
                max="250000"
                step="0.01"
                value={form.EstimatedSalary}
                onChange={(event) => handleChange("EstimatedSalary", event.target.value)}
                placeholder="e.g. 166165.93"
                aria-invalid={Boolean(errors.EstimatedSalary)}
                aria-describedby={errors.EstimatedSalary ? "EstimatedSalary-error" : undefined}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="single-quiz-fields">
            <Field label="Satisfaction score" name="Satisfaction Score" hint="1 = low · 5 = high" error={errors["Satisfaction Score"]}>
              <select
                id="Satisfaction-Score"
                value={form["Satisfaction Score"]}
                onChange={(event) => handleChange("Satisfaction Score", event.target.value)}
                aria-invalid={Boolean(errors["Satisfaction Score"])}
                aria-describedby={errors["Satisfaction Score"] ? "Satisfaction-Score-error" : undefined}
              >
                <option value="">Select a score</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="Card type" name="Card Type" error={errors["Card Type"]}>
              <select
                id="Card-Type"
                value={form["Card Type"]}
                onChange={(event) => handleChange("Card Type", event.target.value)}
                aria-invalid={Boolean(errors["Card Type"])}
                aria-describedby={errors["Card Type"] ? "Card-Type-error" : undefined}
              >
                <option value="">Select card type</option>
                <option value="DIAMOND">Diamond</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="SILVER">Silver</option>
              </select>
            </Field>
            <Field label="Points earned" name="Point Earned" hint="0–1000" error={errors["Point Earned"]}>
              <input
                id="Point-Earned"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={form["Point Earned"]}
                onChange={(event) => handleChange("Point Earned", event.target.value)}
                placeholder="e.g. 384"
                aria-invalid={Boolean(errors["Point Earned"])}
                aria-describedby={errors["Point Earned"] ? "Point-Earned-error" : undefined}
              />
            </Field>
          </div>
        )}

        {submitError && (
          <div className="single-quiz-alert" role="alert">
            <strong>Prediction failed</strong>
            <span>{submitError}</span>
            <small>Confirm that FastAPI is running and that the individual prediction route matches the URL configured in CustomerQuiz.tsx.</small>
          </div>
        )}

        <div className="single-quiz-actions">
          <div>
            {step > 1 && (
              <button className="single-quiz-button secondary" type="button" onClick={handlePrevious} disabled={isSubmitting}>
                Previous
              </button>
            )}
          </div>
          {step < 3 ? (
            <button className="single-quiz-button primary" key="continue" type="button" onClick={handleNext}>
              Continue <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button className="single-quiz-button primary" key="submit" type="submit" disabled={isSubmitting}>
              {isSubmitting && <span className="single-quiz-spinner" aria-hidden="true" />}
              {isSubmitting ? "Assessing customer..." : "Predict churn"}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          )}
        </div>
      </form>

      {prediction && (
        <section className={`single-quiz-result ${prediction.outcome}`} aria-live="polite">
          
          <div className="single-quiz-result-icon" aria-hidden="true">
            {prediction.outcome === "churn" ? "!" : prediction.outcome === "no-churn" ? "✓" : "i"}
          </div>
          <div className="single-quiz-result-copy">
            <p className="single-quiz-eyebrow">ASSESSMENT RESULT</p>
            <h2>
              {prediction.outcome === "churn"
                ? "Churn predicted"
                : prediction.outcome === "no-churn"
                  ? "No churn predicted"
                  : "Response received"}
            </h2>
            <p>{prediction.message}</p>
            {prediction.probabilityPercent !== null && (
              
            <div className="single-quiz-probabilities">
  <CircularPercentage
      label="Churn probability"
      percentage={prediction.probabilityPercent}
      color="#d97757"
    />

   
  </div>
            )}
            <p className="single-quiz-disclaimer">This is a model estimate, not a guarantee of customer behavior.</p>
            <button className="single-quiz-button secondary" type="button" onClick={resetAssessment}>
              Assess another customer
            </button>
          </div>
        </section>
      )}
    </section>
  );
}

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, name, hint, error, children }: FieldProps) {
  const fieldId = name.replace(/[^a-zA-Z0-9]+/g, "-");
  const errorId = `${fieldId}-error`;
  return (
    <div className={`single-quiz-field ${error ? "has-error" : ""}`}>
      <label htmlFor={fieldId}>{label}</label>
      {children}
      {hint && <small className="single-quiz-field-hint">{hint}</small>}
      {error && <small className="single-quiz-field-error" id={errorId}>{error}</small>}
    </div>
  );
}

export default CustomerQuiz;
