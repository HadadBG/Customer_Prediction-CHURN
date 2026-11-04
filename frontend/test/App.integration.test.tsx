
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fetchMock from "jest-fetch-mock";

import App from "../src/App";

// Completa el cuestionario de principio a fin.
async function completeAssessment(
  user: ReturnType<typeof userEvent.setup>,
) {
  // Navegar desde App hacia CustomerQuiz.
  await user.click(
    screen.getByRole("button", { name: /start assessment/i }),
  );

  // STEP 1
  await user.type(screen.getByLabelText("Credit score"), "688");

  await user.selectOptions(
    screen.getByLabelText("Geography"),
    "México",
  );

  await user.selectOptions(
    screen.getByLabelText("Gender"),
    "Female",
  );

  await user.type(screen.getByLabelText("Age"), "35");
  await user.type(screen.getByLabelText("Tenure"), "5");

  await user.click(
    screen.getByRole("button", { name: /continue/i }),
  );

  // STEP 2
  await user.type(
    screen.getByLabelText("Balance"),
    "111578.18",
  );

  await user.selectOptions(
    screen.getByLabelText("Number of products"),
    "2",
  );

  await user.selectOptions(
    screen.getByLabelText("Has credit card?"),
    "1",
  );

  await user.selectOptions(
    screen.getByLabelText("Active member?"),
    "1",
  );

  await user.type(
    screen.getByLabelText("Estimated salary"),
    "166165.93",
  );

  await user.click(
    screen.getByRole("button", { name: /continue/i }),
  );

  // STEP 3
  await user.selectOptions(
    screen.getByLabelText("Satisfaction score"),
    "4",
  );

  await user.selectOptions(
    screen.getByLabelText("Card type"),
    "GOLD",
  );

  await user.type(
    screen.getByLabelText("Points earned"),
    "384",
  );

  // Enviar evaluación.
  await user.click(
    screen.getByRole("button", { name: /predict churn/i }),
  );
}

describe("App integration tests", () => {
  test("should submit customer data and display the churn prediction", async () => {
    const user = userEvent.setup();

    // Simular respuesta exitosa de FastAPI.
    fetchMock.mockResponseOnce(
      JSON.stringify({
        prediction: true,
        score: 0.82,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    render(<App />);

    await completeAssessment(user);

    // Comprobar el resultado.
    expect(
      await screen.findByRole("heading", {
        name: "Churn predicted",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "The model predicts that this customer will churn.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Churn probability"),
    ).toBeInTheDocument();

    // Obtener la petición realizada.
    const predictionCall = fetchMock.mock.calls.find(
      ([url]) => String(url).includes("/predict"),
    );

    expect(predictionCall).toBeDefined();

    const requestOptions = predictionCall?.[1];

    expect(requestOptions?.method).toBe("POST");

    // Comprobar el contrato de la petición.
    expect(
      JSON.parse(String(requestOptions?.body)),
    ).toEqual({
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
      "Card Type": "GOLD",
      "Point Earned": 384,
    });
  });

  test("should display an error when the prediction API returns HTTP 422", async () => {
    const user = userEvent.setup();

    // Simular respuesta HTTP 422.
    fetchMock.mockResponseOnce(
      JSON.stringify({
        detail: "Invalid customer data",
      }),
      {
        status: 422,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    render(<App />);

    await completeAssessment(user);

    // La API devuelve un error y el componente debe mostrarlo.
    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Prediction failed");
    expect(alert).toHaveTextContent("Invalid customer data");
  });

  test("should upload a CSV file and trigger the predictions download", async () => {
    const user = userEvent.setup();

    // Simular respuesta del endpoint de procesamiento masivo.
    fetchMock.mockResponseOnce(
      "CreditScore,Prediction\n688,1\n",
      {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
        },
      },
    );

    // Mock de las funciones de descarga de JSDOM.
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;

    const createObjectURLMock = jest
      .fn()
      .mockReturnValue("blob:http://localhost/result");

    const revokeObjectURLMock = jest.fn();

    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: createObjectURLMock,
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURLMock,
    });

    const downloadedFiles: string[] = [];

    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFiles.push(this.download);
      });

    render(<App />);

    // Seleccionar un CSV.
    const file = new File(
      ["CreditScore,Age\n688,35\n"],
      "customers.csv",
      {
        type: "text/csv",
      },
    );

    const fileInput = screen.getByLabelText(
      "Select a CSV file",
    );

    await user.upload(fileInput, file);

    expect(
      screen.getByText("customers.csv"),
    ).toBeInTheDocument();

    // Procesar el archivo.
    await user.click(
      screen.getByRole("button", {
        name: /process csv/i,
      }),
    );

    // Esperar a que termine el procesamiento.
    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    // Comprobar la petición de carga.
    const uploadCall = fetchMock.mock.calls.find(
      ([url]) => String(url).includes("/predict_file"),
    );

    expect(uploadCall).toBeDefined();

    const requestBody = uploadCall?.[1]?.body;

    expect(requestBody).toBeInstanceOf(FormData);

    const uploadedFile = (requestBody as FormData).get("file");

    expect(uploadedFile).toBeInstanceOf(File);
    expect((uploadedFile as File).name).toBe("customers.csv");

    // Comprobar que se generó la descarga.
    expect(downloadedFiles).toContain(
      "customers-predictions.csv",
    );

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);

    // Restaurar mocks.
    clickSpy.mockRestore();

    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: originalCreateObjectURL,
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });
});
