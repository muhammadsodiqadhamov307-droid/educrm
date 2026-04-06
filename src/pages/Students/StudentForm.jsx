import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { studentsApi } from "../../api/endpoints/students";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

function StudentForm({ isOpen, onClose, onSuccess, student }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    first_name: z.string().trim().min(1, t("students.validation.firstName")),
    last_name: z.string().trim().min(1, t("students.validation.lastName")),
    phone: z.string().trim().min(1, t("students.validation.phone")),
    phone2: z.string().trim().optional(),
    balance: z.coerce.number(),
    discount: z.coerce
      .number()
      .min(0, t("students.validation.discountMin"))
      .max(100, t("students.validation.discountMax")),
    free_lessons_total: z.coerce
      .number()
      .int()
      .min(0, t("students.validation.freeLessonsMin"))
      .max(3, t("students.validation.freeLessonsMax")),
    status: z.enum(["active", "inactive", "frozen"]),
    source: z.string().trim().optional(),
  });

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
      phone: "",
      phone2: "",
      balance: 0,
      discount: 0,
      free_lessons_total: 0,
      status: "active",
      source: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      first_name: student?.first_name || "",
      last_name: student?.last_name || "",
      phone: student?.phone || "",
      phone2: student?.phone2 || "",
      balance: student?.balance ?? 0,
      discount: student?.discount ?? 0,
      free_lessons_total: student?.free_lessons_total ?? 0,
      status: student?.status || "active",
      source: student?.source || "",
    });
  }, [isOpen, student, reset]);

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      if (student?.id) {
        await studentsApi.update(student.id, values);
        toast.success(t("students.updatedSuccess"));
      } else {
        await studentsApi.create(values);
        toast.success(t("students.createdSuccess"));
      }

      await onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={student?.id ? t("students.editStudent") : t("students.addStudent")}
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
            error={errors.phone?.message}
            label={t("students.phone")}
            placeholder={t("students.phone")}
            register={register("phone")}
          />
          <Input
            error={errors.phone2?.message}
            label={t("students.phone2")}
            placeholder={t("students.phone2")}
            register={register("phone2")}
          />
          <Input
            error={errors.balance?.message}
            label={t("students.balance")}
            placeholder="0"
            register={register("balance")}
            type="number"
          />
          <Input
            error={errors.discount?.message}
            label={t("students.discount")}
            placeholder="0"
            register={register("discount")}
            type="number"
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("students.freeLessonsLabel")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("free_lessons_total")}
            >
              <option value={0}>{t("students.freeLessonsOptions.none")}</option>
              <option value={1}>{t("students.freeLessonsOptions.one")}</option>
              <option value={2}>{t("students.freeLessonsOptions.two")}</option>
              <option value={3}>{t("students.freeLessonsOptions.three")}</option>
            </select>
            {errors.free_lessons_total?.message ? (
              <p className="text-sm text-rose-600">{errors.free_lessons_total.message}</p>
            ) : null}
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">{t("students.status")}</span>
          <select
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            {...register("status")}
          >
            <option value="active">{t("students.statusOptions.active")}</option>
            <option value="inactive">{t("students.statusOptions.inactive")}</option>
            <option value="frozen">{t("students.statusOptions.frozen")}</option>
          </select>
        </label>

        <Input
          error={errors.source?.message}
          label={t("students.source")}
          placeholder={t("students.source")}
          register={register("source")}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={isSubmitting} type="submit">
            {student?.id ? t("common.save") : t("students.addStudent")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

StudentForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  student: PropTypes.shape({
    balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    discount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    first_name: PropTypes.string,
    free_lessons_total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id: PropTypes.number,
    last_name: PropTypes.string,
    phone: PropTypes.string,
    phone2: PropTypes.string,
    source: PropTypes.string,
    status: PropTypes.string,
  }),
};

export default StudentForm;
