import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
let clickedAnchors: HTMLAnchorElement[] = [];
jest.mock("../src/vite-env", () => ({ BASE_URL: "/" }));

jest.mock("../src/CustomerQuiz", () => ({
  __esModule: true,
  default: () => <div data-testid="customer-quiz-mock">Customer quiz mock</div>,
}));



const createCsvFile = (name = "customers.csv", size = 128): File =>
  new File([new Uint8Array(size)], name, { type: "text/csv" });

const getCsvInput = () => screen.getByLabelText("Select a CSV file");

const selectFile = (file: File) => {
  fireEvent.change(getCsvInput(), { target: { files: [file] } });
};

const getDropZone = () => {
  const dropZone = screen.getByText("Drag & drop your CSV").closest(".drop-zone");
  if (!dropZone) throw new Error("CSV drop zone was not found");
  return dropZone;
};

const mockFetch = () => globalThis.fetch as jest.MockedFunction<typeof fetch>;

const mockSuccessfulResponse = (blob = new Blob(["prediction\n0"])): Response => ({
  ok: true,
  blob: jest.fn().mockResolvedValue(blob),
}) as unknown as Response;

const mockErrorResponse = (
  status: number,
  body: unknown,
  jsonRejects = false,
): Response => ({
  ok: false,
  status,
  json: jsonRejects
    ? jest.fn().mockRejectedValue(new Error("Invalid JSON"))
    : jest.fn().mockResolvedValue(body),
})as unknown as Response;

describe("App", () => {
  beforeEach(() => {
   jest.clearAllMocks();

  clickedAnchors = [];

  jest.spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchors.push(this);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });

    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue("blob:csv-download"),
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });
 afterEach(() => {
  jest.restoreAllMocks();
});
  describe("workspace navigation", () => {
    test("renders the home dashboard and both workflows", () => {
      render(<App />);

      expect(
        screen.getByRole("heading", { name: "Choose your workflow" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Assess one customer" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Analyze a customer list" }),
      ).toBeInTheDocument();
      expect(screen.getByText("CUSTOMER CHURN PREDICTION")).toBeInTheDocument();
    });

    test("renders the sample CSV download link using the configured base URL", () => {
      render(<App />);
      const sampleLink = screen.getByRole("link", { name: /Download sample CSV/i });

      expect(sampleLink).toHaveAttribute("href", "/Example.csv");
      expect(sampleLink).toHaveAttribute("download", "sample-churn.csv");
    });

    test("opens the customer quiz from Start assessment", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: /Start assessment/i }));

      expect(screen.getByTestId("customer-quiz-mock")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Back to workspace/i })).toBeInTheDocument();
    });

    test("returns to the dashboard from the quiz using Back to workspace", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: /Start assessment/i }));
      await user.click(screen.getByRole("button", { name: /Back to workspace/i }));

      expect(
        screen.getByRole("heading", { name: "Choose your workflow" }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("customer-quiz-mock")).not.toBeInTheDocument();
    });

    test("returns to the dashboard when the brand button is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: /Start assessment/i }));
      await user.click(screen.getByRole("button", { name: "Return to home" }));

      expect(
        screen.getByRole("heading", { name: "Choose your workflow" }),
      ).toBeInTheDocument();
    });
  });

  describe("CSV selection", () => {
    test("opens the file picker when Browse files is clicked", async () => {
      const user = userEvent.setup();
      const clickSpy = jest
        .spyOn(HTMLInputElement.prototype, "click")
        .mockImplementation(() => undefined);
      render(<App />);

      await user.click(screen.getByRole("button", { name: "Browse files" }));

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    test("accepts a CSV file and displays its name and formatted size", () => {
      render(<App />);
      const file = createCsvFile("customers.csv", 2048);

      selectFile(file);

      expect(screen.getByText("customers.csv")).toBeInTheDocument();
      expect(screen.getByText("2.0 KB · Selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Process CSV" })).toBeEnabled();
    });

    test("accepts a CSV extension regardless of letter casing", () => {
      render(<App />);
      const file = createCsvFile("CUSTOMERS.CSV");

      selectFile(file);

      expect(screen.getByText("CUSTOMERS.CSV")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("rejects a file that does not have a CSV extension", () => {
      render(<App />);
      const file = new File(["not a csv"], "customers.txt", { type: "text/plain" });

      selectFile(file);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please select a valid CSV file.",
      );
      expect(screen.queryByText("customers.txt")).not.toBeInTheDocument();
    });

    test("clears a previous file error after selecting a valid CSV", () => {
      render(<App />);
      selectFile(new File(["invalid"], "customers.txt", { type: "text/plain" }));

      selectFile(createCsvFile());

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText("customers.csv")).toBeInTheDocument();
    });

    test("removes a selected file", async () => {
      const user = userEvent.setup();
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Remove selected file" }));

      expect(screen.queryByText("customers.csv")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Browse file" })).toBeInTheDocument();
    });
  });

  describe("drag and drop", () => {
    test("adds the dragging class while a file is dragged over the drop zone", () => {
      render(<App />);
      const dropZone = getDropZone();

      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass("is-dragging");
    });

    test("removes the dragging class when the pointer leaves the drop zone", () => {
      render(<App />);
      const dropZone = getDropZone();

      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).not.toHaveClass("is-dragging");
    });

    test("selects a CSV file dropped into the drop zone", () => {
      render(<App />);
      const file = createCsvFile("dropped-customers.csv");

      fireEvent.drop(getDropZone(), {
        dataTransfer: { files: [file] },
      });

      expect(screen.getByText("dropped-customers.csv")).toBeInTheDocument();
      expect(getDropZone()).not.toHaveClass("is-dragging");
    });

    test("shows an error when a non-CSV file is dropped", () => {
      render(<App />);
      const file = new File(["invalid"], "customers.xlsx");

      fireEvent.drop(getDropZone(), {
        dataTransfer: { files: [file] },
      });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please select a valid CSV file.",
      );
    });
  });

  describe("CSV processing", () => {
    test("uploads the selected file and downloads the prediction CSV", async () => {
      const user = userEvent.setup();
      const blob = new Blob(["prediction\n0"]);
      const response = mockSuccessfulResponse(blob);
      mockFetch().mockResolvedValue(response as Response);
      const clickedAnchors: HTMLAnchorElement[] = [];
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(function (this: HTMLAnchorElement) {
          clickedAnchors.push(this);
        });
      render(<App />);
      const file = createCsvFile("customers.csv");
      selectFile(file);

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      await waitFor(() => {
        expect(mockFetch()).toHaveBeenCalledWith(
          "api/predict_file",
          expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
        );
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv-download");
        expect(clickedAnchors).toHaveLength(1);
      });

      const requestOptions = mockFetch().mock.calls[0][1] as RequestInit;
      expect((requestOptions.body as FormData).get("file")).toBe(file);
      expect(clickedAnchors[0].download).toBe("customers-predictions.csv");
      expect(clickedAnchors[0].href).toBe("blob:csv-download");
      expect(screen.getByRole("button", { name: "Process CSV" })).toBeEnabled();
      clickSpy.mockRestore();
    });

    test("shows the API detail when the server returns an error", async () => {
      const user = userEvent.setup();
      mockFetch().mockResolvedValue(
        mockErrorResponse(400, { detail: "The CSV is missing required columns." }) as Response,
      );
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "The CSV is missing required columns.",
      );
    });

    test("joins validation messages when the API returns an array of details", async () => {
      const user = userEvent.setup();
      mockFetch().mockResolvedValue(
        mockErrorResponse(422, {
          detail: [{ msg: "CreditScore is required" }, { msg: "Age must be numeric" }, {}],
        }) as Response,
      );
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "CreditScore is required. Age must be numeric",
      );
    });

    test("uses the HTTP status fallback when the error response is not valid JSON", async () => {
      const user = userEvent.setup();
      mockFetch().mockResolvedValue(mockErrorResponse(500, null, true) as Response);
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Unable to process the CSV (HTTP 500).",
      );
    });

    test("shows a network error when the request fails", async () => {
      const user = userEvent.setup();
      mockFetch().mockRejectedValue(new Error("Network unavailable"));
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Network unavailable",
      );
    });

    test("disables the process button while the request is pending", async () => {
      const user = userEvent.setup();
      let resolveRequest!: (response: Response) => void;
      const pendingRequest = new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      });
      mockFetch().mockReturnValue(pendingRequest);
      render(<App />);
      selectFile(createCsvFile());

      await user.click(screen.getByRole("button", { name: "Process CSV" }));

      expect(screen.getByRole("button", { name: /Processing\.\.\./i })).toBeDisabled();

      resolveRequest(mockSuccessfulResponse() as Response);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Process CSV" })).toBeEnabled();
      });
    });

    test("opens the file picker instead of processing when no file is selected", async () => {
      const user = userEvent.setup();
      const clickSpy = jest
        .spyOn(HTMLInputElement.prototype, "click")
        .mockImplementation(() => undefined);
      render(<App />);

      await user.click(screen.getByRole("button", { name: "Browse file" }));

      expect(clickSpy).toHaveBeenCalled();
      expect(mockFetch()).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });
});
