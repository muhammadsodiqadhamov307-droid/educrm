import PropTypes from "prop-types";

function EmptyState({ action, icon: Icon, message, title }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-ink-50/80 px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-brand-100 p-4 text-brand-700">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-600">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

EmptyState.propTypes = {
  action: PropTypes.node,
  icon: PropTypes.elementType.isRequired,
  message: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default EmptyState;
