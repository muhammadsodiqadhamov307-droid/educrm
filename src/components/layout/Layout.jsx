import { Outlet } from "react-router-dom";

import InstallPrompt from "./InstallPrompt";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
            <InstallPrompt />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
