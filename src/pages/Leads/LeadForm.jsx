import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { coursesApi } from "../../api/endpoints/courses";
import { leadsApi } from "../../api/endpoints/leads";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { fetchAllPages } from "../../utils/fetchAllPages";

function LeadForm({ isOpen, lead, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);

  const schema = useMemo(
    () =>
      z.object({
        first_name: z.string().trim().min(1, t("leads.validation.firstName")),
        last_name: z.string().trim().min(1, t("leads.validation.lastName")),
        phone: z.string().trim().regex(/^(\+998|998|0)[0-9]{9}$/, t("leads.validation.phoneFormat")),
        phone2: z.string().optional().or(z.literal("")),
        note: z.string().trim().optional(),
        status: z.enum(["new", "contacted", "enrolled", "rejected"]),
        source: z.string().trim().optional(),
        interested_course: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
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
      first_name: "",
      last_name: "",
      phone: "",
      phone2: "",
      note: "",
      status: "new",
      source: "",
      interested_course: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      first_name: lead?.first_name || "",
      last_name: lead?.last_name || "",
      phone: lead?.phone || "",
      phone2: lead?.phone2 || "",
      note: lead?.note || "",
      status: lead?.status || "new",
      source: lead?.source || "",
      interested_course: lead?.interested_course?.id ?? "",
    });
  }, [isOpen, lead, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadCourses = async () => {
      const results = await fetchAllPages((params) => coursesApi.list(params));
      setCourses(results);
    };

    loadCourses();
  }, [isOpen]);

  const onSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        phone2: values.phone2 || "",
        interested_course: values.interested_course ? Number(values.interested_course) : null,
      };
      let response;

      if (lead?.id) {
        response = await leadsApi.update(lead.id, payload);
        if (lead.status !== "enrolled" && values.status === "enrolled") {
          response = await leadsApi.convert(lead.id);
          toast.success(t("leads.convertedSuccess"));
        } else {
          toast.success(t("leads.updatedSuccess"));
        }
      } else {
        response = await leadsApi.create(payload);
        toast.success(t("leads.createdSuccess"));
      }

      await onSuccess(response?.data);
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
      title={lead?.id ? t("leads.editLead") : t("leads.addLead")}
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
            label={t("leads.phone2")}
            placeholder={t("leads.phone2")}
            register={register("phone2")}
            type="text"
          />
          <Input
            error={errors.source?.message}
            label={t("students.source")}
            placeholder={t("students.source")}
            register={register("source")}
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("leads.interestedCourse")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("interested_course")}
            >
              <option value="">{t("common.noData")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">{t("students.status")}</span>
          <select
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            {...register("status")}
          >
            <option value="new">{t("leads.statusOptions.new")}</option>
            <option value="contacted">{t("leads.statusOptions.contacted")}</option>
            <option value="enrolled">{t("leads.statusOptions.enrolled")}</option>
            <option value="rejected">{t("leads.statusOptions.rejected")}</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">{t("payments.note")}</span>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder={t("payments.note")}
            {...register("note")}
          />
          {errors.note?.message ? <p className="text-sm text-rose-600">{errors.note.message}</p> : null}
        </label>

        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={submitting} type="submit">
            {lead?.id ? t("common.save") : t("leads.addLead")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

LeadForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  lead: PropTypes.shape({
    first_name: PropTypes.string,
    id: PropTypes.number,
    last_name: PropTypes.string,
    note: PropTypes.string,
    phone: PropTypes.string,
    phone2: PropTypes.string,
    source: PropTypes.string,
    status: PropTypes.string,
    interested_course: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default LeadForm;
