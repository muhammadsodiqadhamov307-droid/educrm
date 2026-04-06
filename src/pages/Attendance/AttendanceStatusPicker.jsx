import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";
import { cn } from "../../utils/cn";

const statusStyles = {
  present: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  absent_excused: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  absent_unexcused: "bg-rose-50 text-rose-700 hover:bg-rose-100",
};

function AttendanceStatusPicker({ anchorRect, isOpen, onClose, onSave }) {
  const { t } = useTranslation();
  const pickerRef = useRef(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = [
    { key: "present", label: t("attendance.statusOptions.present"), symbol: "✔" },
    { key: "absent_excused", label: t("attendance.statusOptions.absentExcused"), symbol: "~" },
    { key: "absent_unexcused", label: t("attendance.statusOptions.absentUnexcused"), symbol: "✗" },
  ];

  useEffect(() => {
    if (!isOpen) {
      setSelectedStatus("");
      setSelectedGrade(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      if (isSubmitting) {
        return;
      }
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (isSubmitting) {
        return;
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const positionStyle = useMemo(() => {
    if (!anchorRect) {
      return { top: 0, left: 0 };
    }

    const width = 260;
    const maxLeft = Math.max(window.innerWidth - width - 12, 12);

    return {
      position: "fixed",
      top: anchorRect.bottom + 8,
      left: Math.min(anchorRect.left, maxLeft),
      zIndex: 9999,
    };
  }, [anchorRect]);

  if (!isOpen || !anchorRect) {
    return null;
  }

  const handleStatusClick = async (status) => {
    if (status === "present") {
      setSelectedStatus(status);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ status, grade: null });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (grade = selectedGrade) => {
    if (!selectedStatus) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({ status: selectedStatus, grade });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="min-w-[260px] rounded-2xl border border-ink-200 bg-white p-3 shadow-soft"
      ref={pickerRef}
      style={positionStyle}
    >
      {!selectedStatus ? (
        <div className="space-y-2">
          {options.map((option) => (
            <button
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${statusStyles[option.key]}`}
              disabled={isSubmitting}
              key={option.key}
              onClick={() => handleStatusClick(option.key)}
              type="button"
            >
              <span>{option.symbol}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink-900">{t("attendance.gradeTitle")}</p>
            <p className="mt-1 text-xs text-ink-500">{t("attendance.gradeLabel")}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4, 5].map((grade) => (
              <button
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition",
                  selectedGrade === grade
                    ? "border-brand-500 bg-brand-600 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50",
                )}
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                type="button"
              >
                {grade}
              </button>
            ))}
          </div>

          <button
            className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            disabled={isSubmitting}
            onClick={() => handleSave(null)}
            type="button"
          >
            {t("attendance.skipGrade")}
          </button>

          <Button className="w-full" loading={isSubmitting} onClick={() => handleSave()} type="button">
            {t("attendance.saveWithGrade")}
          </Button>
        </div>
      )}
    </div>,
    document.body,
  );
}

AttendanceStatusPicker.propTypes = {
  anchorRect: PropTypes.shape({
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AttendanceStatusPicker;
