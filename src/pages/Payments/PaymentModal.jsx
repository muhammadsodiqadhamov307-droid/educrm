import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { paymentsApi } from "../../api/endpoints/payments";
import { studentsApi } from "../../api/endpoints/students";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { fetchAllPages } from "../../utils/fetchAllPages";
import PaymentHistory from "./PaymentHistory";

function PaymentModal({ isOpen, onClose, onSuccess, student, students }) {
  const { t } = useTranslation();
  const [selectedStudentId, setSelectedStudentId] = useState(student?.id || "");
  const [studentOptions, setStudentOptions] = useState(students);
  const [studentSearch, setStudentSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        student: z.coerce.number().min(1, t("payments.validation.student")),
        amount: z.coerce.number().min(1000, t("payments.validation.amount")),
        note: z.string().trim().optional(),
      }),
    [t],
  );

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      student: student?.id || "",
      amount: "",
      note: "",
    },
  });

  const watchedStudent = watch("student");
  const selectedStudent = useMemo(
    () => studentOptions.find((item) => Number(item.id) === Number(watchedStudent)) || student || null,
    [student, studentOptions, watchedStudent],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStudentOptions(students);
    setSelectedStudentId(student?.id || "");
    setStudentSearch("");
    reset({
      student: student?.id || "",
      amount: "",
      note: "",
    });
  }, [isOpen, reset, student, students]);

  useEffect(() => {
    if (!isOpen || student) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const { data } = await studentsApi.list({ search: studentSearch || undefined });
      setStudentOptions(data.results || []);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, student, studentSearch]);

  const loadPayments = async (studentId) => {
    if (!studentId) {
      setPayments([]);
      return;
    }

    setHistoryLoading(true);

    try {
      const results = await fetchAllPages((params) => paymentsApi.list(params), {
        student: studentId,
      });
      setPayments(results);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    loadPayments(Number(watchedStudent) || selectedStudentId || student?.id || "");
  }, [isOpen, watchedStudent, selectedStudentId, student?.id]);

  const handleCreate = async (values) => {
    setSubmitting(true);

    try {
      await paymentsApi.create(values);
      toast.success(t("payments.createdSuccess"));
      reset({
        student: student?.id || values.student,
        amount: "",
        note: "",
      });
      await loadPayments(values.student);
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (paymentId, payload) => {
    await paymentsApi.update(paymentId, payload);
    toast.success(t("payments.updatedSuccess"));
    await loadPayments(Number(watchedStudent));
    await onSuccess();
  };

  const handleDelete = async (payment) => {
    await paymentsApi.remove(payment.id);
    toast.success(t("payments.deletedSuccess"));
    await loadPayments(Number(watchedStudent));
    await onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("payments.addPayment")}>
      <div className="space-y-6">
        <form className="space-y-5" onSubmit={handleSubmit(handleCreate)}>
          <div className="grid gap-4 md:grid-cols-2">
            {student ? (
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-ink-700">{t("payments.student")}</span>
                <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm font-medium text-ink-900">
                  {student.first_name} {student.last_name}
                </div>
              </label>
            ) : (
              <div className="space-y-3 md:col-span-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink-700">{t("payments.searchStudent")}</span>
                  <input
                    className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder={t("payments.searchStudent")}
                    value={studentSearch}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink-700">{t("payments.student")}</span>
                  <select
                    className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                    {...register("student")}
                    onChange={(event) => {
                      setValue("student", Number(event.target.value));
                      setSelectedStudentId(event.target.value);
                    }}
                  >
                    <option value="">{t("payments.selectStudent")}</option>
                    {studentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.first_name} {option.last_name} • {option.phone}
                      </option>
                    ))}
                  </select>
                  {errors.student?.message ? (
                    <p className="text-sm text-rose-600">{errors.student.message}</p>
                  ) : null}
                </label>
              </div>
            )}

            <Input
              error={errors.amount?.message}
              label={t("payments.amount")}
              placeholder="100000"
              register={register("amount")}
              type="number"
            />
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink-700">{t("payments.note")}</span>
              <textarea
                className="min-h-[48px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder={t("payments.note")}
                {...register("note")}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={onClose} type="button" variant="secondary">
              {t("common.close")}
            </Button>
            <Button loading={submitting} type="submit">
              {t("payments.addPayment")}
            </Button>
          </div>
        </form>

        <div className="space-y-4 border-t border-ink-100 pt-5">
          <div>
            <h3 className="text-lg font-bold text-ink-900">{t("payments.historyTitle")}</h3>
            <p className="mt-1 text-sm text-ink-600">
              {selectedStudent
                ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                : t("payments.historySubtitle")}
            </p>
          </div>
          <PaymentHistory
            loading={historyLoading}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            payments={payments}
          />
        </div>
      </div>
    </Modal>
  );
}

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  student: PropTypes.shape({
    first_name: PropTypes.string,
    id: PropTypes.number,
    last_name: PropTypes.string,
  }),
  students: PropTypes.arrayOf(
    PropTypes.shape({
      first_name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      last_name: PropTypes.string.isRequired,
      phone: PropTypes.string,
    }),
  ).isRequired,
};

export default PaymentModal;
