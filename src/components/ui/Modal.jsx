import { useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X } from "lucide-react";

import { cn } from "../../utils/cn";

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
};

function Modal({ children, isOpen, onClose, size = "md", title }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/30 p-0 backdrop-blur-sm sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        aria-modal="true"
        className={cn(
          "relative z-10 flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-soft transition duration-200 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-white/70",
          sizeClasses[size],
        )}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h3 className="text-lg font-bold text-ink-900">{title}</h3>
          <button
            className="rounded-full p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  title: PropTypes.string.isRequired,
};

export default Modal;
