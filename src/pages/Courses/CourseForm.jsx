import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { coursesApi } from "../../api/endpoints/courses";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

function CourseForm({ course, isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("courses.validation.name")),
        daily_price: z.coerce.number().min(0, t("courses.validation.dailyPrice")),
        monthly_price: z.coerce.number().min(0, t("courses.validation.monthlyPrice")),
        duration_months: z.coerce.number().min(1, t("courses.validation.duration")),
        description: z.string().trim().optional(),
      }),
    [t],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      daily_price: "",
      monthly_price: "",
      duration_months: 1,
      description: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      name: course?.name || "",
      daily_price: course?.daily_price ?? "",
      monthly_price: course?.monthly_price ?? "",
      duration_months: course?.duration_months ?? 1,
      description: course?.description || "",
    });
  }, [course, isOpen, reset]);

  const onSubmit = async (values) => {
    setSubmitting(true);

    try {
      if (course?.id) {
        await coursesApi.update(course.id, values);
        toast.success(t("courses.updatedSuccess"));
      } else {
        await coursesApi.create(values);
        toast.success(t("courses.createdSuccess"));
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
      title={course?.id ? t("courses.editCourse") : t("courses.addCourse")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={errors.name?.message}
            label={t("courses.name")}
            placeholder={t("courses.name")}
            register={register("name")}
          />
          <Input
            error={errors.daily_price?.message}
            label={t("courses.dailyPrice")}
            placeholder="120000"
            register={register("daily_price")}
            type="number"
          />
          <Input
            error={errors.monthly_price?.message}
            label={t("courses.monthlyPrice")}
            placeholder="960000"
            register={register("monthly_price")}
            type="number"
          />
          <Input
            error={errors.duration_months?.message}
            label={t("courses.duration")}
            placeholder="6"
            register={register("duration_months")}
            type="number"
          />
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">{t("courses.description")}</span>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder={t("courses.description")}
            {...register("description")}
          />
          {errors.description?.message ? (
            <p className="text-sm text-rose-600">{errors.description.message}</p>
          ) : null}
        </label>

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={submitting} type="submit">
            {course?.id ? t("common.save") : t("courses.addCourse")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

CourseForm.propTypes = {
  course: PropTypes.shape({
    description: PropTypes.string,
    duration_months: PropTypes.number,
    id: PropTypes.number,
    daily_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    monthly_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default CourseForm;
