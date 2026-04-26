import { BrandPanel } from './BrandPanel';
import { LoginCard } from './LoginCard';

export function LoginPage() {
  return (
    <main className="min-h-screen bg-[#061225] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <BrandPanel />
        <section className="relative order-1 flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_24%_16%,rgba(223,31,45,0.1),transparent_28%),radial-gradient(circle_at_88%_82%,rgba(8,27,58,0.12),transparent_26%),linear-gradient(135deg,#fbfcfe_0%,#edf2f8_100%)] px-4 py-7 sm:px-8 sm:py-10 lg:order-2 lg:px-10 xl:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18))]" />
          <div className="relative z-10 flex w-full justify-center">
            <LoginCard />
          </div>
        </section>
      </div>
    </main>
  );
}
