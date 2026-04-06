import PropTypes from "prop-types";

import { cn } from "../../utils/cn";

function Input({
  className,
  error,
  label,
  name,
  placeholder,
  register,
  type = "text",
}) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-semibold text-ink-700">{label}</span> : null}
      <input
        className={cn(
          "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
          error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-ink-200",
          className,
        )}
        name={name}
        placeholder={placeholder}
        type={type}
        {...register}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

Input.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  register: PropTypes.shape({
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    ref: PropTypes.func,
  }),
  type: PropTypes.string,
};

export default Input;
