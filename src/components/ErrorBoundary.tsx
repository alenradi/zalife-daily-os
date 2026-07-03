import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/** Prevents a single page render error from blanking the entire app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="lock-screen">
            <span className="lk-icon">⚠️</span>
            <h3>Nekaj je šlo narobe</h3>
            <p>Ta stran je naletela na napako. Poskusi znova.</p>
            <p className="small text-muted">{this.state.message}</p>
            <button className="btn btn-primary mt" onClick={this.reset}>
              Poskusi znova
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
