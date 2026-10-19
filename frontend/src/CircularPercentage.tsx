
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";
import "./CircularPercentage.css";

import ProgressProviderUsingClass from "./ProgressProvider";

type CircularPercentageProps = {
  label: string;
  percentage: number;
  color?: string;
};

export default function CircularPercentage({
  label,
  percentage,
  color = "#169b91",
}: CircularPercentageProps) {
  const value = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;



  return (
    <article className="circular-percentage">
      <div
        className="circular-percentage-chart"
        role="img"
        aria-label={`${label}: ${value.toFixed(2)}%`}
      >
        <ProgressProviderUsingClass
  key={`${label}-${value}`}
  valueStart={0}
  valueEnd={value}
>
  {(animatedValue) => (
    <CircularProgressbarWithChildren
      value={animatedValue}
      maxValue={100}
      styles={buildStyles({
        pathColor: color,
        trailColor: "#e7efee",
        strokeLinecap: "round",
        pathTransitionDuration: 1.15,
      })}
    >
      <div className="circular-percentage-center">
        <strong>{value.toFixed(2)}%</strong>
    
      </div>
    </CircularProgressbarWithChildren>
  )}
</ProgressProviderUsingClass>
      </div>

      <p className="circular-percentage-label">{label}</p>
    </article>
  );
}
