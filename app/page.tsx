import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-full bg-white font-sans text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md shadow-blue-600/25">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Page<span className="text-blue-600">IQ</span>
            </span>
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 hover:shadow-blue-600/40"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-32 right-0 h-64 w-64 rounded-full bg-blue-300/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center sm:pt-28">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            Trend intelligence for creators
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Discover what goes viral{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              before everyone else
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            PageIQ analyzes emerging patterns across social platforms so you can
            create content that rides the wave—not chase it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#pricing"
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-700 sm:w-auto"
            >
              Start free today
            </a>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-blue-100 bg-white p-1 shadow-2xl shadow-blue-900/10">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Viral score forecast
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    +847% predicted reach
                  </span>
                </div>
                <div className="flex h-32 items-end justify-between gap-2">
                  {[40, 55, 45, 70, 62, 85, 78, 95, 88, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 opacity-90"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-blue-100 pt-4 text-left">
                  {[
                    { label: "Trends tracked", value: "12.4K" },
                    { label: "Avg. lead time", value: "48 hrs" },
                    { label: "Accuracy", value: "94%" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-slate-100 bg-slate-50/50 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to stay ahead
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Powerful insights wrapped in a simple dashboard built for
              creators, marketers, and agencies.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Early trend detection",
                description:
                  "Spot rising topics and formats across TikTok, Instagram, and YouTube before they peak.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                ),
              },
              {
                title: "Viral score predictions",
                description:
                  "AI-powered scoring tells you which ideas have the highest breakout potential.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                ),
              },
              {
                title: "Content briefs",
                description:
                  "Get actionable hooks, hashtags, and posting windows tailored to your niche.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ),
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Start free and upgrade as your audience grows. No hidden fees.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "Perfect for exploring trends on your own.",
                features: [
                  "5 trend alerts per week",
                  "Basic viral scores",
                  "1 connected platform",
                ],
                cta: "Get started",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "$29",
                period: "per month",
                description: "For serious creators who want an edge.",
                features: [
                  "Unlimited trend alerts",
                  "Advanced viral predictions",
                  "All platforms + briefs",
                  "Priority support",
                ],
                cta: "Start Pro trial",
                highlighted: true,
              },
              {
                name: "Agency",
                price: "$99",
                period: "per month",
                description: "Scale insights across teams and clients.",
                features: [
                  "Everything in Pro",
                  "10 team seats",
                  "White-label reports",
                  "API access",
                ],
                cta: "Contact sales",
                highlighted: false,
              },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "scale-[1.02] border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-600/30"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                    Most popular
                  </span>
                )}
                <h3
                  className={`text-lg font-semibold ${plan.highlighted ? "text-blue-100" : "text-slate-900"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={
                      plan.highlighted ? "text-blue-100" : "text-slate-500"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-4 text-sm leading-relaxed ${plan.highlighted ? "text-blue-100" : "text-slate-600"}`}
                >
                  {plan.description}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg
                        className={`mt-0.5 h-5 w-5 shrink-0 ${plan.highlighted ? "text-blue-200" : "text-blue-600"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        className={
                          plan.highlighted ? "text-white" : "text-slate-700"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </span>
            <span className="font-bold text-slate-900">
              Page<span className="text-blue-600">IQ</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PageIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
