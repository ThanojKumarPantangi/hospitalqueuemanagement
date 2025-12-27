import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-500
                    dark:bg-slate-950 dark:text-slate-100">

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full border-b border-slate-200/60
                   bg-white/80 backdrop-blur-xl transition-colors
                   dark:border-slate-800/60 dark:bg-slate-900/80"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl
                         bg-gradient-to-br from-teal-500 to-emerald-500
                         font-bold text-white shadow-md"
            >
              H
            </div>

            <h1 className="text-lg font-semibold tracking-tight">
              Hospital{" "}
              <span className="text-teal-600 dark:text-teal-400">Queue</span>
            </h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main
        className="relative flex min-h-[calc(100vh-73px)]
                   items-center justify-center p-6"
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -z-10
                     h-[420px] w-full max-w-3xl -translate-x-1/2
                     bg-gradient-to-r from-teal-400/15 to-emerald-400/10
                     blur-[140px]
                     dark:from-teal-500/10 dark:to-emerald-500/5"
        />

        <div className="w-full transition-all duration-500 ease-in-out">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center text-xs
                   text-slate-400 dark:text-slate-600"
      >
        © 2025 Hospital Management System. All rights reserved.
      </footer>
    </div>
  );
}

export default PublicLayout;
