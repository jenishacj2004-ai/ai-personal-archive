import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            AI Personal Archive
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Features
            </Link>

            <Link
              href="#about"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              About
            </Link>

            <Link
              href="/login"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.15),transparent_35%)]" />

        <div className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Intelligent Personal Knowledge Management
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            Your
            <span className="text-blue-400"> AI-Powered </span>
            Personal Archive
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Store, organize, search and rediscover your important memories,
            notes, projects and documents in one intelligent personal archive.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-blue-500 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-600"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Everything you need in one archive
            </h2>

            <p className="mt-4 text-slate-400">
              A centralized space designed to help you manage and discover
              your personal knowledge.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="🗂️"
              title="Smart Archive"
              description="Keep your notes, projects, documents and memories organized in one place."
            />

            <FeatureCard
              icon="🤖"
              title="AI Search"
              description="Use intelligent search to quickly discover information stored in your archive."
            />

            <FeatureCard
              icon="🔎"
              title="Easy Discovery"
              description="Find related information and rediscover valuable content whenever you need it."
            />

            <FeatureCard
              icon="🔐"
              title="Secure Access"
              description="Authentication and authorization help keep your personal archive protected."
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-white/10 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              About the project
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              A digital home for your knowledge
            </h2>

            <p className="mt-6 leading-7 text-slate-400">
              AI Personal Archive is designed to bring your personal
              information together into a single, searchable and organized
              platform.
            </p>

            <p className="mt-4 leading-7 text-slate-400">
              Instead of keeping important information scattered across
              different applications, the archive provides one central place
              to store and access it.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="grid grid-cols-2 gap-4">
              <Stat value="01" label="Personal Archive" />
              <Stat value="AI" label="Powered Search" />
              <Stat value="24/7" label="Accessible" />
              <Stat value="∞" label="Possibilities" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-5xl">
            Start building your personal archive
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Organize your knowledge today and make it easier to find tomorrow.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-blue-500 px-8 py-4 font-semibold transition hover:bg-blue-600"
          >
            Create Your Archive
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-center text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© 2026 AI Personal Archive</p>

          <p>Organize. Discover. Remember.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-5 text-lg font-semibold">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
      <div className="text-2xl font-bold text-blue-400">{value}</div>

      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}