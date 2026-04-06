import PropTypes from "prop-types";
import { Search } from "lucide-react";

function SearchBar({ onChange, placeholder, value }) {
  return (
    <label className="relative block w-full lg:max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        className="w-full rounded-2xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

SearchBar.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default SearchBar;
