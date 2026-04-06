import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { supportTeachersApi } from "../../api/endpoints/supportTeachers";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

function SupportTeacherForm({ isOpen, onClose, onSuccess, supportTeacher }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          full_name: z.string().trim().min(1, t("supportTeachers.validation.fullName")),
          phone: z.string().trim().min(1, t("supportTeachers.validation.phone")),
          password: z.string().trim(),
          share_percent: z.coerce
            .number()
            .min(0, t("supportTeachers.validation.sharePercentMin"))
            .max(100, t("supportTeachers.validation.sharePercentMax")),
        })
        .superRefine((values, context) => {
          if (!supportTeacher?.id && values.password.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("supportTeachers.validation.password"),
              path: ["password"],
            });
          }
          if (supportTeacher?.id && values.password && values.password.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("supportTeachers.validation.password"),
              path: ["password"],
            });
          }
        }),
    [supportTeacher?.id, t],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "",
      password: "",
      share_percent: 30,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      full_name: supportTeacher?.full_name || "",
      phone: supportTeacher?.phone || "",
      password: "",
      share_percent: supportTeacher?.share_percent ?? 30,
    });
  }, [isOpen, reset, supportTeacher]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        full_name: values.full_name,
        phone: values.phone,
        share_percent: values.share_percent,
      };

      if (values.password) {
        payload.password = values.password;
      }

      if (supportTeacher?.id) {
        await supportTeachersApi.update(supportTeacher.id, payload);
        toast.success(t("supportTeachers.updatedSuccess"));
      } else {
        await supportTeachersApi.create(payload);
        toast.success(t("supportTeachers.createdSuccess"));
      }

      await onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={supportTeacher?.id ? t("supportTeachers.edit") : t("supportTeachers.add")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          error={errors.full_name?.message}
          label={t("supportTeachers.fullName")}
          placeholder={t("supportTeachers.fullName")}
          register={register("full_name")}
        />
        <Input
          error={errors.phone?.message}
          label={t("common.phone")}
          placeholder={t("common.phone")}
          register={register("phone")}
        />
        <Input
          error={errors.password?.message}
          label={t("auth.password")}
          placeholder={supportTeacher?.id ? t("supportTeachers.passwordOptional") : t("auth.password")}
          register={register("password")}
          type="password"
        />
        <Input
          error={errors.share_percent?.message}
          label={`${t("supportTeachers.sharePercent")} (%)`}
          placeholder="30"
          register={register("share_percent")}
          type="number"
        />

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={submitting} type="submit">
            {supportTeacher?.id ? t("common.save") : t("supportTeachers.add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

SupportTeacherForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  supportTeacher: PropTypes.shape({
    full_name: PropTypes.string,
    id: PropTypes.number,
    phone: PropTypes.string,
    share_percent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default SupportTeacherForm;
