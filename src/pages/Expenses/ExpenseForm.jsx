import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { expensesApi } from "../../api/endpoints/expenses";
import { supportTeachersApi } from "../../api/endpoints/supportTeachers";
import { studentsApi } from "../../api/endpoints/students";
import { teachersApi } from "../../api/endpoints/teachers";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useUiStore } from "../../store/uiStore";
import { fetchAllPages } from "../../utils/fetchAllPages";

function ExpenseForm({ expense, isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [supportTeachers, setSupportTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const markTeachersForRefresh = useUiStore((state) => state.markTeachersForRefresh);

  const schema = useMemo(
    () =>
      z
        .object({
          amount: z.coerce.number().min(1, t("expenses.validation.amount")),
          category: z.enum(["teacher_salary", "support_salary", "student_refund", "other"]),
          teacher: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
          support_teacher: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
          student: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
          note: z.string().trim().optional(),
        })
        .superRefine((values, context) => {
          if (values.category === "teacher_salary" && !values.teacher) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("expenses.validation.teacher"),
              path: ["teacher"],
            });
          }
          if (values.category === "support_salary" && !values.support_teacher) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("expenses.validation.supportTeacher"),
              path: ["support_teacher"],
            });
          }
          if (values.category === "student_refund" && !values.student) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("expenses.validation.categoryField"),
              path: ["student"],
            });
          }
          if (values.category === "other" && !values.note) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("expenses.validation.note"),
              path: ["note"],
            });
          }
        }),
    [t],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      category: "other",
      teacher: "",
      support_teacher: "",
      student: "",
      note: "",
    },
  });

  const category = useWatch({ control, name: "category" });
  const filteredStudents = useMemo(() => {
    const normalized = studentSearch.trim().toLowerCase();
    if (!normalized) {
      return students;
    }

    return students.filter((student) =>
      [student.first_name, student.last_name, student.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [studentSearch, students]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      amount: expense?.amount ?? "",
      category: expense?.category || "other",
      teacher: expense?.teacher?.id ?? "",
      support_teacher: expense?.support_teacher?.id ?? "",
      student: expense?.student?.id ?? "",
      note: expense?.note || "",
    });
    setStudentSearch("");
  }, [expense, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadTeachers = async () => {
      const [teacherResults, supportTeacherResults] = await Promise.all([
        fetchAllPages((params) => teachersApi.list(params)),
        fetchAllPages((params) => supportTeachersApi.getAll(params)),
      ]);
      setTeachers(teacherResults);
      setSupportTeachers(supportTeacherResults);
    };

    const loadStudents = async () => {
      const results = await fetchAllPages((params) =>
        studentsApi.list({
          ...params,
          status: "active",
          page_size: 100,
        }),
      );
      setStudents(results);
    };

    loadTeachers();
    loadStudents();
  }, [isOpen]);

  const onSubmit = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        amount: values.amount,
        category: values.category,
        teacher: values.category === "teacher_salary" ? Number(values.teacher) : null,
        support_teacher:
          values.category === "support_salary" ? Number(values.support_teacher) : null,
        student: values.category === "student_refund" ? Number(values.student) : null,
        note: values.note || "",
      };

      if (expense?.id) {
        await expensesApi.update(expense.id, payload);
        toast.success(t("expenses.updatedSuccess"));
      } else {
        await expensesApi.create(payload);
        toast.success(t("expenses.createdSuccess"));
      }

      if (
        payload.category === "teacher_salary" ||
        payload.category === "support_salary" ||
        expense?.category === "teacher_salary" ||
        expense?.category === "support_salary"
      ) {
        markTeachersForRefresh();
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
      title={expense?.id ? t("expenses.editExpense") : t("expenses.addExpense")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={errors.amount?.message}
            label={t("expenses.amount")}
            placeholder="250000"
            register={register("amount")}
            type="number"
          />

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("expenses.category")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("category")}
            >
              <option value="teacher_salary">{t("expenses.categoryOptions.teacher_salary")}</option>
              <option value="support_salary">{t("expenses.categoryOptions.support_salary")}</option>
              <option value="student_refund">{t("expenses.categoryOptions.student_refund")}</option>
              <option value="other">{t("expenses.categoryOptions.other")}</option>
            </select>
          </label>
        </div>

        {category === "teacher_salary" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.teacher")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("teacher")}
            >
              <option value="">{t("groups.selectTeacher")}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || [teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim()}
                </option>
              ))}
            </select>
            {errors.teacher?.message ? <p className="text-sm text-rose-600">{errors.teacher.message}</p> : null}
          </label>
        ) : null}

        {category === "support_salary" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.supportTeacher")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              {...register("support_teacher")}
            >
              <option value="">{t("expenses.selectSupportTeacher")}</option>
              {supportTeachers.map((supportTeacher) => (
                <option key={supportTeacher.id} value={supportTeacher.id}>
                  {supportTeacher.full_name || supportTeacher.phone}
                </option>
              ))}
            </select>
            {errors.support_teacher?.message ? (
              <p className="text-sm text-rose-600">{errors.support_teacher.message}</p>
            ) : null}
          </label>
        ) : null}

        {category === "student_refund" ? (
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink-700">{t("common.search")}</span>
              <input
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder={t("students.searchPlaceholder")}
                type="text"
                value={studentSearch}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink-700">{t("expenses.selectStudent")}</span>
              <select
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                {...register("student")}
              >
                <option value="">{t("expenses.selectStudent")}</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {[student.first_name, student.last_name].filter(Boolean).join(" ").trim()} - {student.phone}
                  </option>
                ))}
              </select>
              {errors.student?.message ? <p className="text-sm text-rose-600">{errors.student.message}</p> : null}
            </label>
          </div>
        ) : null}

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
            {expense?.id ? t("common.save") : t("expenses.addExpense")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

ExpenseForm.propTypes = {
  expense: PropTypes.shape({
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    category: PropTypes.string,
    id: PropTypes.number,
    note: PropTypes.string,
    student: PropTypes.shape({
      id: PropTypes.number,
    }),
    teacher: PropTypes.shape({
      id: PropTypes.number,
    }),
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default ExpenseForm;
