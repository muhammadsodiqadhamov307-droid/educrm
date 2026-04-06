import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Button from "./Button";
import Modal from "./Modal";

function ConfirmDialog({ isOpen, message, onClose, onConfirm, title }) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div className="space-y-6">
        <p className="text-sm leading-6 text-ink-600">{message}</p>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button onClick={onConfirm} variant="danger">
            {t("common.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default ConfirmDialog;
