import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Search, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { groupsApi } from "../../api/endpoints/groups";
import { studentsApi } from "../../api/endpoints/students";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";

function AddStudentToGroup({ existingStudentIds, groupId, isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  const filteredStudents = useMemo(
    () => students.filter((student) => !existingStudentIds.includes(student.id)),
    [existingStudentIds, students],
  );

  const loadStudents = async (search = "") => {
    setLoading(true);

    try {
      const { data } = await studentsApi.list({ page: 1, search: search || undefined });
      setStudents(data.results || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadStudents(query);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setStudents([]);
    }
  }, [isOpen]);

  const handleAddStudent = async (studentId) => {
    setSubmittingId(studentId);

    try {
      await groupsApi.addStudent(groupId, { student_id: studentId });
      toast.success(t("groups.studentAddedSuccess"));
      await onSuccess();
      await loadStudents(query);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={t("groups.addStudentToGroup")}>
      <div className="space-y-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("groups.searchStudents")}
            value={query}
          />
        </label>

        <div className="max-h-[420px] space-y-3 overflow-y-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="rounded-2xl border border-ink-100 p-4" key={index}>
                <Skeleton className="rounded-xl" height={18} width={180} />
                <Skeleton className="mt-3 rounded-xl" height={14} width={130} />
              </div>
            ))
          ) : filteredStudents.length ? (
            filteredStudents.map((student) => (
              <div
                className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3"
                key={student.id}
              >
                <div>
                  <p className="font-semibold text-ink-900">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-sm text-ink-500">{student.phone}</p>
                </div>
                <Button
                  loading={submittingId === student.id}
                  onClick={() => handleAddStudent(student.id)}
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                  {t("common.add")}
                </Button>
              </div>
            ))
          ) : (
            <EmptyState
              icon={UserPlus}
              message={t("groups.noAvailableStudentsMessage")}
              title={t("groups.noAvailableStudentsTitle")}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

AddStudentToGroup.propTypes = {
  existingStudentIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  groupId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddStudentToGroup;
