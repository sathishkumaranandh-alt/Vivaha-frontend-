import React from "react";

import { reportError } from "./utils/monitoring";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, { componentStack: errorInfo && errorInfo.componentStack });
    this.setState({ hasError: true, error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fff", color: "red", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h1>Something went wrong:</h1>
          <p><strong>Message:</strong> {this.state.error?.toString()}</p>
          <p><strong>Stack:</strong> {this.state.errorInfo?.componentStack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
