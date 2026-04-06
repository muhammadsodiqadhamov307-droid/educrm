import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import toast from "react-hot-toast";

import { coursesApi } from "../../api/endpoints/courses";
import { groupsApi } from "../../api/endpoints/groups";
import { supportTeachersApi } from "../../api/endpoints/supportTeachers";
import { teachersApi } from "../../api/endpoints/teachers";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { getLocalizedScheduleDays } from "../../utils/schedule";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function fetchAllPages(request) {
  let page = 1;
  let next = true;
  const results = [];

  while (next) {
    const { data } = await request({ page });
    results.push(...(data.results || []));
    next = Boolean(data.next);
    page += 1;
  }

  return results;
}

function GroupForm({ group, isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [supportTeachers, setSupportTeachers] = useState([]);
  const [supportTeacherSearch, setSupportTeacherSearch] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("groups.validation.name")),
    course: z.coerce.number().min(1, t("groups.validation.course")),
    teacher: z.coerce.number().min(1, t("groups.validation.teacher")),
    support_teacher: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
    schedule_days: z.array(z.string()).min(1, t("groups.validation.days")),
    schedule_time: z.string().min(1, t("groups.validation.time")),
    start_date: z.string().min(1, t("groups.validation.startDate")),
    status: z.enum(["active", "archived"]),
  });

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      course: "",
      teacher: "",
      support_teacher: "",
      schedule_days: [],
      schedule_time: "",
      start_date: "",
      status: "active",
    },
  });

  const selectedDays = watch("schedule_days");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      name: group?.name || "",
      course: group?.course?.id || "",
      teacher: group?.teacher?.id || "",
      support_teacher: group?.support_teacher?.id || "",
      schedule_days: group?.schedule?.days || [],
      schedule_time: group?.schedule?.time || "",
      start_date: group?.start_date || "",
      status: group?.status || "active",
    });
  }, [group, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadOptions = async () => {
      setIsLoadingOptions(true);

      try {
        const [coursesResponse, teachersResponse, supportTeachersResponse] = await Promise.all([
          fetchAllPages((params) => coursesApi.list(params)),
          fetchAllPages((params) => teachersApi.list(params)),
          fetchAllPages((params) => supportTeachersApi.getAll(params)),
        ]);

        setCourses(coursesResponse);
        setTeachers(teachersResponse);
        setSupportTeachers(supportTeachersResponse);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSupportTeacherSearch("");
    }
  }, [isOpen]);

  const toggleDay = (day) => {
    const currentDays = getValues("schedule_days");
    const nextDays = currentDays.includes(day)
      ? currentDays.filter((item) => item !== day)
      : [...currentDays, day];
    setValue("schedule_days", nextDays, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name,
        course: values.course,
        teacher: values.teacher,
        support_teacher: values.support_teacher ? Number(values.support_teacher) : null,
        schedule: {
          days: values.schedule_days,
          time: values.schedule_time,
        },
        start_date: values.start_date,
        status: values.status,
      };

      if (group?.id) {
        await groupsApi.update(group.id, payload);
        toast.success(t("groups.updatedSuccess"));
      } else {
        await groupsApi.create(payload);
        toast.success(t("groups.createdSuccess"));
      }

      await onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSupportTeachers = supportTeachers.filter((teacher) => {
    const haystack = [teacher.full_name, teacher.phone].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(supportTeacherSearch.trim().toLowerCase());
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={group?.id ? t("groups.editGroup") : t("groups.addGroup")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={errors.name?.message}
            label={t("groups.groupName")}
            placeholder={t("groups.groupName")}
            register={register("name")}
          />

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.course")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              disabled={isLoadingOptions}
              {...register("course")}
            >
              <option value="">{t("groups.selectCourse")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.course?.message ? <p className="text-sm text-rose-600">{errors.course.message}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.teacher")}</span>
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              disabled={isLoadingOptions}
              {...register("teacher")}
            >
              <option value="">{t("groups.selectTeacher")}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim() || teacher.phone}
                </option>
              ))}
            </select>
            {errors.teacher?.message ? <p className="text-sm text-rose-600">{errors.teacher.message}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("groups.supportTeacher")}</span>
            <input
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setSupportTeacherSearch(event.target.value)}
              placeholder={t("common.search")}
              type="text"
              value={supportTeacherSearch}
            />
            <select
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              disabled={isLoadingOptions}
              {...register("support_teacher")}
            >
              <option value="">{t("groups.notAssigned")}</option>
              {filteredSupportTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name || teacher.phone}
                </option>
              ))}
            </select>
          </label>

          <Input
            error={errors.start_date?.message}
            label={t("groups.startDate")}
            register={register("start_date")}
            type="date"
          />

          <Input
            error={errors.schedule_time?.message}
            label={t("groups.scheduleTime")}
            register={register("schedule_time")}
            type="time"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-ink-700">{t("groups.scheduleDays")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {weekDays.map((day) => {
              const translated = getLocalizedScheduleDays({ days: [day] }, t)[0];
              const active = selectedDays.includes(day);

              return (
                <button
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  }`}
                  key={day}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleDay(day);
                  }}
                  type="button"
                >
                  {translated}
                </button>
              );
            })}
          </div>
          {errors.schedule_days?.message ? (
            <p className="text-sm text-rose-600">{errors.schedule_days.message}</p>
          ) : null}
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink-700">{t("groups.status")}</span>
          <select
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            {...register("status")}
          >
            <option value="active">{t("groups.statusOptions.active")}</option>
            <option value="archived">{t("groups.statusOptions.archived")}</option>
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button loading={isSubmitting} type="submit">
            {group?.id ? t("common.save") : t("groups.addGroup")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

GroupForm.propTypes = {
  group: PropTypes.shape({
    course: PropTypes.shape({
      id: PropTypes.number,
    }),
    id: PropTypes.number,
    name: PropTypes.string,
    schedule: PropTypes.shape({
      days: PropTypes.arrayOf(PropTypes.string),
      time: PropTypes.string,
    }),
    start_date: PropTypes.string,
    status: PropTypes.string,
    support_teacher: PropTypes.shape({
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

export default GroupForm;
