import PropTypes from "prop-types";
import { Suspense, lazy, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import PageLoader from "./components/PageLoader";
import useAuthStore from "./store/authStore";
import { getDefaultRouteForRole, isRoleAllowed } from "./utils/navigation";

const CHUNK_ERROR_PATTERN =
  /chunkloaderror|failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|module script|unexpected token '<'/i;

function lazyWithRetry(importer, cacheKey) {
  return lazy(async () => {
    try {
      const pageModule = await importer();
      window.sessionStorage.removeItem(cacheKey);
      return pageModule;
    } catch (error) {
      const message = String(error?.message || error || "");
      const alreadyRetried = window.sessionStorage.getItem(cacheKey) === "true";

      if (CHUNK_ERROR_PATTERN.test(message) && !alreadyRetried) {
        window.sessionStorage.setItem(cacheKey, "true");
        window.location.reload();
        return new Promise(() => {});
      }

      window.sessionStorage.removeItem(cacheKey);
      throw error;
    }
  });
}

const AttendancePage = lazyWithRetry(() => import("./pages/Attendance"), "lazy-retry-attendance");
const CoursesPage = lazyWithRetry(() => import("./pages/Courses"), "lazy-retry-courses");
const DashboardPage = lazyWithRetry(() => import("./pages/Dashboard"), "lazy-retry-dashboard");
const ExpensesPage = lazyWithRetry(() => import("./pages/Expenses"), "lazy-retry-expenses");
const GroupsPage = lazyWithRetry(() => import("./pages/Groups"), "lazy-retry-groups");
const LeadsPage = lazyWithRetry(() => import("./pages/Leads"), "lazy-retry-leads");
const LoginPage = lazyWithRetry(() => import("./pages/Login"), "lazy-retry-login");
const NotFoundPage = lazyWithRetry(() => import("./pages/NotFound"), "lazy-retry-not-found");
const PaymentsPage = lazyWithRetry(() => import("./pages/Payments"), "lazy-retry-payments");
const SupportTeacherProfilePage = lazyWithRetry(
  () => import("./pages/SupportTeachers/SupportTeacherProfile"),
  "lazy-retry-support-teacher-profile",
);
const SupportTeachersPage = lazyWithRetry(
  () => import("./pages/SupportTeachers"),
  "lazy-retry-support-teachers",
);
const SupportTasksPage = lazyWithRetry(() => import("./pages/SupportTasks"), "lazy-retry-support-tasks");
const StudentsPage = lazyWithRetry(() => import("./pages/Students"), "lazy-retry-students");
const TeachersPage = lazyWithRetry(() => import("./pages/Teachers"), "lazy-retry-teachers");

function AppLoader() {
  return <PageLoader />;
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return children;
}

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function RoleGuard({ roles, children }) {
  const user = useAuthStore((state) => state.user);
  const fallbackRoute = useMemo(() => getDefaultRouteForRole(user?.role), [user?.role]);

  if (!isRoleAllowed(user?.role, roles)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}

RoleGuard.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function RoleRedirect() {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
}

function App() {
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (!isHydrated) {
    return <AppLoader />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleRedirect />} />
            <Route
              path="dashboard"
              element={
                <RoleGuard roles={["admin"]}>
                  <DashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="students"
              element={
                <RoleGuard roles={["admin", "receptionist"]}>
                  <StudentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="groups"
              element={
                <RoleGuard roles={["admin", "receptionist", "teacher"]}>
                  <GroupsPage />
                </RoleGuard>
              }
            />
            <Route
              path="attendance"
              element={
                <RoleGuard roles={["admin", "teacher"]}>
                  <AttendancePage />
                </RoleGuard>
              }
            />
            <Route
              path="payments"
              element={
                <RoleGuard roles={["admin", "receptionist"]}>
                  <PaymentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="courses"
              element={
                <RoleGuard roles={["admin"]}>
                  <CoursesPage />
                </RoleGuard>
              }
            />
            <Route
              path="teachers"
              element={
                <RoleGuard roles={["admin"]}>
                  <TeachersPage />
                </RoleGuard>
              }
            />
            <Route
              path="leads"
              element={
                <RoleGuard roles={["admin", "receptionist"]}>
                  <LeadsPage />
                </RoleGuard>
              }
            />
            <Route
              path="expenses"
              element={
                <RoleGuard roles={["admin"]}>
                  <ExpensesPage />
                </RoleGuard>
              }
            />
            <Route
              path="support-tasks"
              element={
                <RoleGuard roles={["admin", "support_teacher"]}>
                  <SupportTasksPage />
                </RoleGuard>
              }
            />
            <Route
              path="support-teachers"
              element={
                <RoleGuard roles={["admin"]}>
                  <SupportTeachersPage />
                </RoleGuard>
              }
            />
            <Route
              path="support-teachers/:id"
              element={
                <RoleGuard roles={["admin"]}>
                  <SupportTeacherProfilePage />
                </RoleGuard>
              }
            />
            <Route
              path="support-teachers/me"
              element={
                <RoleGuard roles={["support_teacher"]}>
                  <SupportTeacherProfilePage />
                </RoleGuard>
              }
            />
            <Route
              path="profile"
              element={
                <RoleGuard roles={["support_teacher"]}>
                  <SupportTeacherProfilePage />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
