import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { groupsApi } from "../../api/endpoints/groups";
import { supportTasksApi } from "../../api/endpoints/supportTasks";
import { studentsApi } from "../../api/endpoints/students";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

function SendToSupportModal({ isOpen, onClose, onSuccess, student }) {
  const { t } = useTranslation();
  const [studentDetail, setStudentDetail] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        group_id: z.coerce.number().min(1, t("groups.validation.course")),
        note: z.string().trim().optional().or(z.literal("")),
      }),
    [t],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      group_id: "",
      note: "",
    },
  });

  const selectedGroupId = watch("group_id");
  const selectedGroup = availableGroups.find((groupItem) => String(groupItem.id) === String(selectedGroupId));

  useEffect(() => {
    if (!isOpen || !student?.id) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const studentResponse = await studentsApi.retrieve(student.id);
        const groupResults = await Promise.all(
          (studentResponse.data.groups || []).map((groupItem) => groupsApi.retrieve(groupItem.id)),
        );
        const groups = groupResults.map((response) => response.data);

        setStudentDetail(studentResponse.data);
        setAvailableGroups(groups);
        reset({
          group_id: groups[0]?.id ?? "",
          note: "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, reset, student?.id]);

  const onSubmit = async (values) => {
    if (!student?.id) {
      return;
    }

    setSubmitting(true);
    try {
      await supportTasksApi.sendToSupport(student.id, {
        group_id: values.group_id,
        note: values.note || "",
      });
      toast.success(t("students.supportSent"));
      await onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.group_id?.[0] ||
          error?.response?.data?.detail ||
          t("supportTeachers.noSupportTeacherAssigned"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={t("students.sendToSupport")}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 rounded-2xl bg-ink-100" />
          <div className="h-12 rounded-2xl bg-ink-100" />
          <div className="h-32 rounded-2xl bg-ink-100" />
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl bg-ink-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{t("common.name")}</p>
            <p className="mt-2 text-lg font-bold text-ink-900">
              {studentDetail?.first_name} {studentDetail?.last_name}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.title")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("group_id")}
            >
              <option value="">{t("common.noData")}</option>
              {(studentDetail?.groups || []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.group_id?.message ? <p className="text-sm text-rose-600">{errors.group_id.message}</p> : null}
          </label>

          <div className="rounded-2xl bg-ink-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{t("groups.supportTeacher")}</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {selectedGroup?.support_teacher?.full_name || t("supportTeachers.noSupportTeacherAssigned")}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("students.supportNote")}</span>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder={t("students.supportNotePlaceholder")}
              {...register("note")}
            />
            {errors.note?.message ? <p className="text-sm text-rose-600">{errors.note.message}</p> : null}
          </label>

          <div className="flex justify-end gap-3">
            <Button onClick={onClose} type="button" variant="secondary">
              {t("common.cancel")}
            </Button>
            <Button loading={submitting} type="submit">
              {t("students.sendToSupport")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

SendToSupportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  student: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default SendToSupportModal;
