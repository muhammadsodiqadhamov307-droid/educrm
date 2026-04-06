import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";

function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-light px-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/95 p-8 text-center shadow-soft backdrop-blur-xl">
        <p className="text-7xl font-black tracking-tight text-brand-600 sm:text-8xl">{t("notFound.code")}</p>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-ink-900">{t("notFound.title")}</h1>
        <p className="mt-3 text-sm leading-7 text-ink-600">{t("notFound.message")}</p>
        <div className="mt-6">
          <Button onClick={() => navigate("/")}>{t("notFound.action")}</Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
