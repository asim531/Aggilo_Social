import AuthForm from "@/components/AuthForm";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#0b0d0f]">
      {/* ── Hero section ──────────────────────────────────────── */}
      <div className="text-center mb-10 max-w-md">
        {/* App logo */}
        <div className="mb-4">
          <span className="text-5xl text-aggilo-accent font-bold">A</span>
        </div>

        {/* Cluster name */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Sisters in Dua
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-lg mb-1">
          Faith lived, discussed, and held together.
        </p>

        {/* Clio introduction card */}
        <div className="mt-6 p-5 rounded-xl bg-[#161a14] border border-gray-700 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤲</span>
            <span className="font-semibold text-white">
              Assalamu Alaikum
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            Sisters in Dua is a women-only community for Muslim women navigating faith in real life — at work, at home, and everywhere the two collide.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            Not a classroom. Not a fatwa service. A space where women talk honestly about staying close to Allah through doubt, ambition, burnout, motherhood, career pressure, and everything in between.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            Grounded in Quran and authentic Sunnah. Every cluster is actively hosted. Guided by practitioners and scholars.
          </p>
          <p className="text-xs text-gray-500 italic mb-4">
            Your community Anchor keeps the discussion grounded in verified sources and holds the space. The Admin and Managers are who you go to for guidance.
          </p>
          <div className="border-l-2 border-emerald-500/30 pl-3 mb-4">
            <p className="text-sm text-gray-400 italic">
              &quot;I build rooms around who you actually are. This one is ready.&quot;
            </p>
            <p className="text-xs text-gray-500 mt-1">
              — Clio, your Aggilo guide
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Currently in beta</span>
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-4 p-3 rounded-lg bg-[#11140f] border border-gray-800 text-left">
          <p className="text-xs text-gray-500 leading-relaxed">
            Your privacy matters. You will choose a nickname — no real names are shown. This is a safe, women-only space.
          </p>
        </div>
      </div>

      {/* ── Auth form ─────────────────────────────────────────── */}
      <AuthForm />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="mt-12 text-center text-xs text-gray-600">
        <p>
          Verified sources only. Quran and authentic Sunnah. By{" "}
          <a href="https://aggilo.in" target="_blank" rel="noopener noreferrer" className="text-aggilo-accent hover:underline">Aggilo</a>.
        </p>
      </footer>
    </main>
  );
}
