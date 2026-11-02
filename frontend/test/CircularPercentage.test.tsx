import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import CircularPercentage from "../src/CircularPercentage";

// Keep the animation deterministic: render the final value immediately.
jest.mock("../src/ProgressProvider", () => ({
  __esModule: true,
  default: ({
    valueEnd,
    children,
  }: {
    valueEnd: number;
    children: (value: number) => ReactNode;
  }) => <>{children(valueEnd)}</>,
}));

describe("CircularPercentage", () => {
  it("renders the label", () => {
    render(<CircularPercentage label="Churn probability" percentage={65} />);

    expect(screen.getByText("Churn probability")).toBeInTheDocument();
  });

  it("displays the percentage with two decimal places", () => {
    render(<CircularPercentage label="Churn probability" percentage={65.234} />);

    expect(screen.getByText("65.23%")).toBeInTheDocument();
  });

  it("provides an accessible image label with the formatted percentage", () => {
    render(<CircularPercentage label="Churn probability" percentage={65.2} />);

    expect(
      screen.getByRole("img", {
        name: "Churn probability: 65.20%",
      }),
    ).toBeInTheDocument();
  });

  it("clamps percentages above 100", () => {
    render(<CircularPercentage label="Churn probability" percentage={125} />);

    expect(screen.getByText("100.00%")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Churn probability: 100.00%",
      }),
    ).toBeInTheDocument();
  });

  it("clamps percentages below 0", () => {
    render(<CircularPercentage label="Churn probability" percentage={-15} />);

    expect(screen.getByText("0.00%")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Churn probability: 0.00%",
      }),
    ).toBeInTheDocument();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "uses 0 for a non-finite percentage (%s)",
    (percentage) => {
      render(<CircularPercentage label="Churn probability" percentage={percentage} />);

      expect(screen.getByText("0.00%")).toBeInTheDocument();
      expect(
        screen.getByRole("img", {
          name: "Churn probability: 0.00%",
        }),
      ).toBeInTheDocument();
    },
  );

  it("uses the default path color when no color is provided", () => {
    const { container } = render(
      <CircularPercentage label="Churn probability" percentage={50} />,
    );

    const progressPath = container.querySelector(".CircularProgressbar-path");

    expect(progressPath).toHaveStyle({ stroke: "#169b91" });
  });

  it("uses the custom path color when one is provided", () => {
    const { container } = render(
      <CircularPercentage
        label="Churn probability"
        percentage={50}
        color="#d97757"
      />,
    );

    const progressPath = container.querySelector(".CircularProgressbar-path");

    expect(progressPath).toHaveStyle({ stroke: "#d97757" });
  });
});
