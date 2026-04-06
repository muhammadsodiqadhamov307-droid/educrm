import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { teachersApi } from "../../api/endpoints/teachers";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

function TeacherForm({ isOpen, onClose, onSuccess, teacher }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          first_name: z.string().trim().min(1, t("teachers.validation.firstName")),
          last_name: z.string().trim().min(1, t("teachers.validation.lastName")),
          username: z.string().trim().min(3, t("teachers.validation.username")),
          password: z.string().trim(),
          phone: z.string().trim().min(1, t("teachers.validation.phone")),
          balance: z.coerce.number(),
          share_percent: z.coerce.number().min(0, t("teachers.validation.sharePercentMin")).max(100, t("teachers.validation.sharePercentMax")),
        })
        .superRefine((values, context) => {
          if (!teacher?.id && values.password.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("teachers.validation.password"),
              path: ["password"],
            });
          }
          if (teacher?.id && values.password && values.password.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("teachers.validation.password"),
              path: ["password"],
            });
          }
        }),
    [t, teacher?.id],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      phone: "",
      balance: 0,
      share_percent: 30,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      first_name: teacher?.first_name || "",
      last_name: teacher?.last_name || "",
      username: teacher?.username || "",
      password: "",
      phone: teacher?.phone || "",
      balance: teacher?.balance ?? 0,
      share_percent: teacher?.share_percent ?? 30,
    });
  }, [isOpen, reset, teacher]);

  const onSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        phone: values.phone,
        balance: values.balance,
        share_percent: values.share_percent,
      };

      if (values.password) {
        payload.password = values.password;
      }

      if (teacher?.id) {
        await teachersApi.update(teacher.id, payload);
        toast.success(t("teachers.updatedSuccess"));
      } else {
        await teachersApi.create(payload);
        toast.success(t("teachers.createdSuccess"));
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
      title={teacher?.id ? t("teachers.editTeacher") : t("teachers.addTeacher")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={errors.first_name?.message}
            label={t("students.firstName")}
            placeholder={t("students.firstName")}
            register={register("first_name")}
          />
          <Input
            error={errors.last_name?.message}
            label={t("students.lastName")}
            placeholder={t("students.lastName")}
            register={register("last_name")}
          />
          <Input
            error={errors.username?.message}
            label={t("auth.username")}
            placeholder={t("auth.username")}
            register={register("username")}
          />
          <Input
            error={errors.phone?.message}
            label={t("students.phone")}
            placeholder={t("students.phone")}
            register={register("phone")}
          />
          <Input
            error={errors.password?.message}
            label={t("auth.password")}
            placeholder={teacher?.id ? t("teachers.passwordOptional") : t("auth.password")}
            register={register("password")}
            type="password"
          />
          <Input
            error={errors.balance?.message}
            label={t("teachers.balance")}
            placeholder="0"
            register={register("balance")}
            type="number"
          />
          <Input
            error={errors.share_percent?.message}
            label={`${t("teachers.sharePercent")} (%)`}
            placeholder="30"
            register={register("share_percent")}
            type="number"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={submitting} type="submit">
            {teacher?.id ? t("common.save") : t("teachers.addTeacher")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

TeacherForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  teacher: PropTypes.shape({
    balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    first_name: PropTypes.string,
    id: PropTypes.number,
    last_name: PropTypes.string,
    phone: PropTypes.string,
    share_percent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
  }),
};

export default TeacherForm;
