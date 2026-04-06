import PropTypes from "prop-types";
import { AlertTriangle } from "lucide-react";
import React from "react";

import i18n from "../i18n";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-mesh-light px-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-8 text-center shadow-soft backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-ink-900">{i18n.t("errorBoundary.title")}</h1>
            <p className="mt-3 text-sm leading-7 text-ink-600">{i18n.t("errorBoundary.message")}</p>
            <button
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              {i18n.t("errorBoundary.retry")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
