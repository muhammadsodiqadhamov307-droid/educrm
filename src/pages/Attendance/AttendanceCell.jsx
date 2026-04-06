import { useMemo, useRef } from "react";
import PropTypes from "prop-types";

import { cn } from "../../utils/cn";
import AttendanceStatusPicker from "./AttendanceStatusPicker";

const cellStyles = {
  present: "bg-emerald-500 text-white",
  absent_excused: "bg-amber-400 text-white",
  absent_unexcused: "bg-rose-500 text-white",
  empty: "bg-ink-100 text-ink-400",
};

const cellSymbols = {
  present: "✓",
  absent_excused: "~",
  absent_unexcused: "✗",
  empty: "",
};

function AttendanceCell({
  disabled = false,
  grade = null,
  isActiveDate,
  isOpen,
  onClose,
  onSave,
  onToggle,
  status,
  title,
}) {
  const key = status || "empty";
  const buttonRef = useRef(null);
  const anchorRect = useMemo(
    () => (isOpen && buttonRef.current ? buttonRef.current.getBoundingClientRect() : null),
    [isOpen],
  );

  return (
    <div className="relative flex justify-center">
      <button
        ref={buttonRef}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition",
          cellStyles[key],
          isActiveDate ? "border-brand-500 ring-4 ring-brand-100" : "border-transparent",
          disabled && "cursor-not-allowed opacity-60",
        )}
        disabled={disabled}
        onClick={onToggle}
        title={title}
        type="button"
      >
        {cellSymbols[key]}
        {grade ? (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-ink-200 bg-white px-1 text-[10px] font-extrabold leading-none text-ink-900 shadow-sm">
            {grade}
          </span>
        ) : null}
      </button>

      <AttendanceStatusPicker
        anchorRect={anchorRect}
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}

AttendanceCell.propTypes = {
  disabled: PropTypes.bool,
  grade: PropTypes.number,
  isActiveDate: PropTypes.bool.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  status: PropTypes.oneOf(["present", "absent_excused", "absent_unexcused", null]),
  title: PropTypes.string,
};

export default AttendanceCell;
