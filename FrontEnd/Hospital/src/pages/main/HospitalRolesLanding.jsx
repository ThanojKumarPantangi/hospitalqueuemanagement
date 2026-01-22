import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../../components/button/ThemeToggle";
import {
  Stethoscope,
  UserRound,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity,
  Users,
  BarChart3,
  Bell,
  Lock,
  Smartphone,
  Search,
} from "lucide-react";

const rolesData = [
  {
    id: "patient",
    title: "Patient",
    icon: UserRound,
    tagline: "Track your token, reduce waiting stress.",
    primaryCta: "Track Token",
    secondaryCta: "Login",
    highlights: [
      "Live token status & queue position",
      "Estimated waiting time (approx.)",
      "Department & doctor info (optional)",
      "Get notified when your turn is near",
    ],
    features: [
      {
        icon: Clock,
        title: "Live Queue Updates",
        desc: "See the current token being served in real-time.",
      },
      {
        icon: Search,
        title: "Token / Mobile Search",
        desc: "Quickly find your visit using token or phone number.",
      },
      {
        icon: Bell,
        title: "Turn Alerts",
        desc: "Receive alerts when your token is approaching.",
      },
      {
        icon: Smartphone,
        title: "Mobile Friendly",
        desc: "Works smoothly on phones for easy access.",
      },
    ],
  },
  {
    id: "doctor",
    title: "Doctor",
    icon: Stethoscope,
    tagline: "Faster consultations, smoother workflow.",
    primaryCta: "Doctor Login",
    secondaryCta: "View Workflow",
    highlights: [
      "See next patient instantly",
      "One-click actions: Start / Complete",
      "Reduce manual typing & delays",
      "Clear patient flow visibility",
    ],
    features: [
      {
        icon: Activity,
        title: "Smart Queue View",
        desc: "Focus on Now Serving + Next Up without clutter.",
      },
      {
        icon: CheckCircle2,
        title: "Quick Visit Completion",
        desc: "Finish visits quickly with minimal steps.",
      },
      {
        icon: Users,
        title: "Department Coordination",
        desc: "Works across OPD departments with clean flow.",
      },
      {
        icon: Lock,
        title: "Role-based Access",
        desc: "Only doctors can access doctor tools & patient flow.",
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: ShieldCheck,
    tagline: "Control operations and monitor performance.",
    primaryCta: "Admin Login",
    secondaryCta: "See Reports",
    highlights: [
      "Manage doctors & departments",
      "Queue rules & priority control",
      "Analytics and performance insights",
      "Secure system administration",
    ],
    features: [
      {
        icon: BarChart3,
        title: "Reports & Analytics",
        desc: "Track daily patient counts, wait time & peak hours.",
      },
      {
        icon: ShieldCheck,
        title: "System Controls",
        desc: "Configure departments, roles and permissions.",
      },
      {
        icon: Bell,
        title: "Announcements",
        desc: "Broadcast important messages to staff or departments.",
      },
      {
        icon: Lock,
        title: "Security",
        desc: "Secure access with role-based login & audit readiness.",
      },
    ],
  },
];

const container = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const chipMotion = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function HospitalRolesLanding() {
  const [activeRole, setActiveRole] = useState("patient");

  const active = useMemo(
    () => rolesData.find((r) => r.id === activeRole) || rolesData[0],
    [activeRole]
  );

  const ActiveIcon = active.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      {/* Top Nav */}
      <div className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-black/5 border border-black/10 dark:bg-white/10 dark:border-white/10 grid place-items-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Hospital Queue</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smart Queue Management
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
              onClick={() => {
                const el = document.getElementById("features");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Features
            </button>
            <button
              className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
              onClick={() => {
                const el = document.getElementById("roles");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Roles
            </button>
            <button
              className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5"
              onClick={() => {
                const el = document.getElementById("how");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How it works
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>

            <Link
              to="/login"
              className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              Signup
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl px-4 py-14"
      >
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <motion.p
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              <Lock className="h-4 w-4" />
              Role-based access • Live queue updates • Faster workflow
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-4 text-3xl font-semibold leading-tight md:text-5xl"
            >
              Hospital Queue Management System
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-base text-slate-600 md:text-lg dark:text-slate-300"
            >
              Reduce waiting time, improve patient flow, and make reception & doctor
              work faster using a clean, real-time queue system.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-5 py-3 text-sm text-slate-900 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                Login <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/doctor-signup"
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-5 py-3 text-sm text-slate-900 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                Doctor Signup <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Today</p>
                <p className="mt-1 text-lg font-semibold">Live Queue</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Now serving updates in real-time.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure</p>
                <p className="mt-1 text-lg font-semibold">Role Based</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Patient, Doctor, Admin views separated.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right - Role Preview */}
          <div className="rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Role Preview</p>
              <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-slate-950/60">
                <ActiveIcon className="h-4 w-4" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {active.title}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {active.tagline}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {rolesData.map((r) => {
                const Icon = r.icon;
                const isActive = r.id === activeRole;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRole(r.id)}
                    className={classNames(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      isActive
                        ? "border-black/15 bg-black/5 dark:border-white/20 dark:bg-white/10"
                        : "border-black/10 bg-white/60 hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <p className="mt-2 text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      View
                    </p>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-5 rounded-3xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{active.title} Services</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      What you can do in this role
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
                  >
                    {active.primaryCta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4 space-y-2">
                  {active.highlights.map((h) => (
                    <motion.div
                      key={h}
                      variants={chipMotion}
                      initial="hidden"
                      animate="show"
                      className="flex items-start gap-2 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {h}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              What you get
            </p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
              Core Features
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Built for faster reception handling, smoother doctor flow, and better
              patient transparency.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Real-time Queue",
              desc: "See now serving + next tokens with live updates.",
            },
            {
              icon: Bell,
              title: "Notifications",
              desc: "Notify patients when their token is near (optional).",
            },
            {
              icon: ShieldCheck,
              title: "Role-based Access",
              desc: "Separate dashboards for Patient, Doctor, and Admin.",
            },
            {
              icon: Users,
              title: "Multi-Department Support",
              desc: "Run OPD queues department-wise without confusion.",
            },
            {
              icon: Lock,
              title: "Secure Authentication",
              desc: "Login & permissions to protect patient operations.",
            },
            {
              icon: Smartphone,
              title: "Mobile Friendly UI",
              desc: "Works well on phone, tablet, and desktop.",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-3xl border border-black/10 bg-white/70 p-5 hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="h-10 w-10 rounded-2xl bg-black/5 border border-black/10 dark:bg-white/10 dark:border-white/10 grid place-items-center">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold">{f.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Who it is for
            </p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
              Role-based Services
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Each role gets a focused dashboard with only the tools they need.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {rolesData.map((r) => {
            const Icon = r.icon;
            const isActive = r.id === activeRole;

            return (
              <div
                key={r.id}
                className={classNames(
                  "rounded-3xl border p-5 transition",
                  isActive
                    ? "border-black/15 bg-black/5 dark:border-white/20 dark:bg-white/10"
                    : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-black/5 border border-black/10 dark:bg-white/10 dark:border-white/10 grid place-items-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => setActiveRole(r.id)}
                    className="rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-xs text-slate-700 hover:bg-black/5 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Preview
                  </button>
                </div>

                <p className="mt-4 text-lg font-semibold">{r.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {r.tagline}
                </p>

                <div className="mt-4 space-y-2">
                  {r.highlights.slice(0, 3).map((h) => (
                    <div
                      key={h}
                      className="flex items-start gap-2 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        {h}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    to="/login"
                    className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
                  >
                    Login
                  </Link>

                  <Link
                    to={r.id === "doctor" ? "/doctor-signup" : "/signup"}
                    className="flex-1 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-center text-sm text-slate-900 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  >
                    Signup
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-16">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Simple flow</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            A clean workflow from token creation to consultation completion.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Create Token",
              desc: "Reception registers patient and generates token instantly.",
            },
            {
              step: "02",
              title: "Live Tracking",
              desc: "Queue updates continuously and patient can track status.",
            },
            {
              step: "03",
              title: "Doctor Calls Next",
              desc: "Doctor views next patient and starts consultation quickly.",
            },
            {
              step: "04",
              title: "Complete Visit",
              desc: "Visit ends, queue moves forward, and reports stay organized.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-3xl border border-black/10 bg-white/70 p-5 hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step {s.step}
              </p>
              <p className="mt-2 text-base font-semibold">{s.title}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white/70 dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-black/5 border border-black/10 dark:bg-white/10 dark:border-white/10 grid place-items-center">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Hospital Queue</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Built for patient flow efficiency
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
              >
                Signup
              </Link>

              <Link
                to="/doctor-signup"
                className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Doctor Signup
              </Link>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} Hospital Queue Management • All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}