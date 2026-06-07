"use client";
import React from "react";

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "red", color: "white", padding: "20px", zIndex: 9999 }}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.error?.toString()}</pre>
          <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
