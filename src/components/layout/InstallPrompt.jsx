import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Button from "../ui/Button";

function isStandaloneMode() {
  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    return true;
  }

  return window.navigator.standalone === true;
}

function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(() => isStandaloneMode());

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const onAppInstalled = () => {
      setStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (standalone || dismissed || !deferredPrompt) {
    return null;
  }

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome !== "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-r from-indigo-600 via-brand-600 to-indigo-950 px-4 py-4 text-white shadow-lg shadow-indigo-950/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">{t("layout.installTitle")}</p>
          <p className="mt-1 text-sm text-indigo-100">{t("layout.installSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="border-white/20 bg-white/12 text-white hover:bg-white/20"
            onClick={() => setDismissed(true)}
            size="sm"
            variant="ghost"
          >
            {t("common.close")}
          </Button>
          <Button
            className="!bg-white !text-indigo-700 hover:!bg-indigo-50"
            onClick={handleInstall}
            size="sm"
            variant="secondary"
          >
            <Download className="h-4 w-4" />
            {t("layout.installAction")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
