import { Component, type ReactNode } from "react";

type ProgressProviderProps = {
  valueStart?: number;
  valueEnd: number;
  children: (value: number) => ReactNode;
};

type ProgressProviderState = {
  value: number;
};

export default class ProgressProviderUsingClass extends Component<
  ProgressProviderProps,
  ProgressProviderState
> {
  private firstFrame: number | null = null;
  private secondFrame: number | null = null;

  constructor(props: ProgressProviderProps) {
    super(props);

    this.state = {
      value: props.valueStart ?? 0,
    };
  }

  componentDidMount() {
    // First frame: allow the initial render to be painted.
    this.firstFrame = requestAnimationFrame(() => {
      // Second frame: update the value to trigger the CSS transition.
      this.secondFrame = requestAnimationFrame(() => {
        this.setState({
          value: this.props.valueEnd,
        });
      });
    });
  }

  componentWillUnmount() {
    if (this.firstFrame !== null) {
      cancelAnimationFrame(this.firstFrame);
    }

    if (this.secondFrame !== null) {
      cancelAnimationFrame(this.secondFrame);
    }
  }

  render() {
    return this.props.children(this.state.value);
  }
}