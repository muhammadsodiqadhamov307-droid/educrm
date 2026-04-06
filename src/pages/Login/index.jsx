import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import LanguageSwitcher from "../../components/shared/LanguageSwitcher";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import useAuthStore from "../../store/authStore";
import { getDefaultRouteForRole } from "../../utils/navigation";

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const schema = z.object({
    username: z.string().min(3, t("validation.usernameMin")),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    const user = await login(values);
    navigate(getDefaultRouteForRole(user.role), { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute right-6 top-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="absolute inset-0 bg-mesh-light" />

      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] bg-ink-950 px-10 py-12 text-white shadow-soft lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-brand-200">
            <ShieldCheck className="h-4 w-4" />
            EduCRM
          </div>
          <h1 className="mt-8 max-w-lg text-4xl font-extrabold leading-tight">
            {t("auth.welcome")}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-ink-300">{t("auth.subtitle")}</p>
          <div className="mt-10 grid gap-4">
            {["dashboard", "students", "attendance"].map((key) => (
              <div
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-ink-200"
                key={key}
              >
                {t(`nav.${key}`)}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel w-full p-6 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-brand-600 p-4 text-white shadow-lg shadow-brand-600/30">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">EduCRM</p>
                <h2 className="text-3xl font-extrabold text-ink-900">{t("auth.login")}</h2>
              </div>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                error={errors.username?.message}
                label={t("auth.username")}
                placeholder={t("auth.usernamePlaceholder")}
                register={register("username")}
              />
              <Input
                error={errors.password?.message}
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                register={register("password")}
                type="password"
              />

              <Button className="w-full" loading={isLoading} size="lg" type="submit">
                {t("auth.loginButton")}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
