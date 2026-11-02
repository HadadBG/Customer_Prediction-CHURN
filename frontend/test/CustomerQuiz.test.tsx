import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import CustomerQuiz from "../src/CustomerQuiz";

// Keep the tests focused on the quiz behavior, not on the chart implementation
// or on CSS imported by the component.
jest.mock("../src/CustomerQuiz.css", () => ({}));
jest.mock("react-circular-progressbar/dist/styles.css", () => ({}));
jest.mock("../src/CircularPercentage", () => ({
  __esModule: true,
  default: ({
    label,
    percentage,
  }: {
    label: string;
    percentage: number;
  }) => (
    <div data-testid="circular-percentage">
      {label}: {percentage}
    </div>
  ),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });

  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderQuiz() {
  return render(<CustomerQuiz />);
}

type User = ReturnType<typeof userEvent.setup>;

type StepOneOverrides = Partial<{
  creditScore: string;
  geography: string;
  gender: string;
  age: string;
  tenure: string;
}>;

async function fillStepOne(user: User, overrides: StepOneOverrides = {}) {
  await user.type(
    screen.getByLabelText("Credit score"),
    overrides.creditScore ?? "688",
  );
  await user.selectOptions(
    screen.getByLabelText("Geography"),
    overrides.geography ?? "México",
  );
  await user.selectOptions(
    screen.getByLabelText("Gender"),
    overrides.gender ?? "Female",
  );
  await user.type(screen.getByLabelText("Age"), overrides.age ?? "35");
  await user.type(screen.getByLabelText("Tenure"), overrides.tenure ?? "5");
}

async function fillStepTwo(user: User) {
  await user.type(screen.getByLabelText("Balance"), "111578.18");
  await user.selectOptions(screen.getByLabelText("Number of products"), "2");
  await user.selectOptions(screen.getByLabelText("Has credit card?"), "1");
  await user.selectOptions(screen.getByLabelText("Active member?"), "1");
  await user.type(screen.getByLabelText("Estimated salary"), "166165.93");
}

async function fillStepThree(user: User) {
  await user.selectOptions(screen.getByLabelText("Satisfaction score"), "4");
  await user.selectOptions(screen.getByLabelText("Card type"), "DIAMOND");
  await user.type(screen.getByLabelText("Points earned"), "384");
}

async function goToStepThree(user: User) {
  await fillStepOne(user);
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await fillStepTwo(user);
  await user.click(screen.getByRole("button", { name: /continue/i }));

  expect(screen.getByText("STEP 3 OF 3")).toBeInTheDocument();
}

function mockSuccessfulResponse(body: unknown) {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe("CustomerQuiz", () => {
  it("renders the first step of the assessment", () => {
    renderQuiz();

    expect(
      screen.getByRole("heading", { name: "Let's get to know your customer." }),
    ).toBeInTheDocument();
    expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Credit score")).toBeInTheDocument();
    expect(screen.getByLabelText("Geography")).toBeInTheDocument();
    expect(screen.getByLabelText("Gender")).toBeInTheDocument();
    expect(screen.getByLabelText("Age")).toBeInTheDocument();
    expect(screen.getByLabelText("Tenure")).toBeInTheDocument();
    expect(screen.queryByLabelText("Balance")).not.toBeInTheDocument();
  });

  it("shows required-field errors and does not advance when step 1 is empty", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
    expect(screen.getAllByText("This field is required.")).toHaveLength(5);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["Credit score", "299", "Enter a value from 300 to 900."],
    ["Credit score", "901", "Enter a value from 300 to 900."],
    ["Age", "17", "Enter a value from 18 to 100."],
    ["Age", "35.5", "Enter a whole number."],
    ["Tenure", "11", "Enter a value from 0 to 10."],
  ])(
    "validates %s (%s) and stays on the first step",
    async (field, value, expectedError) => {
      const user = userEvent.setup();
      renderQuiz();

      const overrides: StepOneOverrides = {};
      if (field === "Credit score") overrides.creditScore = value;
      if (field === "Age") overrides.age = value;
      if (field === "Tenure") overrides.tenure = value;

      await fillStepOne(user, overrides);
      await user.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
      expect(screen.getByText(expectedError)).toBeInTheDocument();
    },
  );

  it("clears a field's validation error after the user corrects it", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getAllByText("This field is required.")).toHaveLength(5);

    await user.type(screen.getByLabelText("Credit score"), "688");

    expect(screen.queryAllByText("This field is required.")).toHaveLength(4);
  });

  it("moves between steps and preserves values when going back", async () => {
    const user = userEvent.setup();
    renderQuiz();

    await fillStepOne(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("STEP 2 OF 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Balance")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Credit score")).toHaveValue(688);
    expect(screen.getByLabelText("Geography")).toHaveValue("México");
  });

  it("submits the numeric payload and displays a churn prediction", async () => {
    const user = userEvent.setup();
    renderQuiz();
    mockSuccessfulResponse({ prediction: true, score: 0.82 });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(await screen.findByRole("heading", { name: "Churn predicted" })).toBeInTheDocument();
    expect(
      screen.getByText("The model predicts that this customer will churn."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("circular-percentage")).toHaveTextContent(
      "Churn probability: 82",
    );

    const expectedPayload = {
      CreditScore: 688,
      Geography: "México",
      Gender: "Female",
      Age: 35,
      Tenure: 5,
      Balance: 111578.18,
      NumOfProducts: 2,
      HasCrCard: 1,
      IsActiveMember: 1,
      EstimatedSalary: 166165.93,
      "Satisfaction Score": 4,
      "Card Type": "DIAMOND",
      "Point Earned": 384,
    };

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedPayload),
    });
  });

  it("displays a no-churn result when the API returns prediction false", async () => {
    const user = userEvent.setup();
    renderQuiz();
    mockSuccessfulResponse({ prediction: false, score: 0.15 });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(
      await screen.findByRole("heading", { name: "No churn predicted" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The model predicts that this customer will stay."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("circular-percentage")).toHaveTextContent(
      "Churn probability: 15",
    );
  });

  it("shows an informational result when the prediction format is unknown", async () => {
    const user = userEvent.setup();
    renderQuiz();
    mockSuccessfulResponse({ result: "unknown" });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(
      await screen.findByRole("heading", { name: "Response received" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The API returned a response, but its prediction format could not be identified automatically.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("circular-percentage")).not.toBeInTheDocument();
  });

  it("shows the API detail when the request returns an HTTP error", async () => {
    const user = userEvent.setup();
    renderQuiz();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ detail: "Invalid customer data" }),
    });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid customer data",
    );
    expect(screen.getByText("Prediction failed")).toBeInTheDocument();
  });

  it("uses the HTTP status when the API error has no string message", async () => {
    const user = userEvent.setup();
    renderQuiz();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ detail: { reason: "failure" } }),
    });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The API returned HTTP 500.",
    );
  });

  it("shows an error when the API response is not valid JSON", async () => {
    const user = userEvent.setup();
    renderQuiz();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
    });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The API response was not valid JSON. Check the /predict endpoint.",
    );
  });

  it("shows the network error when fetch rejects", async () => {
    const user = userEvent.setup();
    renderQuiz();
    fetchMock.mockRejectedValue(new Error("Network unavailable"));

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network unavailable",
    );
  });

  it("disables submission while the request is pending", async () => {
    const user = userEvent.setup();
    renderQuiz();

    let resolveFetch!: (value: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    const submitButton = screen.getByRole("button", {
      name: /assessing customer/i,
    });
    expect(submitButton).toBeDisabled();

    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ prediction: false, score: 0.2 }),
      });
    });

    await screen.findByRole("heading", { name: "No churn predicted" });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /predict churn/i }),
      ).toBeEnabled();
    });
  });

  it("resets the assessment so another customer can be entered", async () => {
    const user = userEvent.setup();
    renderQuiz();
    mockSuccessfulResponse({ prediction: true, score: 0.82 });

    await goToStepThree(user);
    await fillStepThree(user);
    await user.click(screen.getByRole("button", { name: /predict churn/i }));

    await screen.findByRole("heading", { name: "Churn predicted" });
    await user.click(
      screen.getByRole("button", { name: "Assess another customer" }),
    );

    expect(screen.getByText("STEP 1 OF 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Credit score")).toHaveValue(null);
    expect(screen.queryByRole("heading", { name: "Churn predicted" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

