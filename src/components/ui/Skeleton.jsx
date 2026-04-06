import PropTypes from "prop-types";

import { cn } from "../../utils/cn";

function Skeleton({ className, height, width }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-ink-200/80", className)}
      style={{ height, width }}
    />
  );
}

Skeleton.propTypes = {
  className: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Skeleton;
