import { BarChart3, Network, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    text: 'Enterprise grade security and data protection',
  },
  {
    icon: BarChart3,
    title: 'Data that drives decisions',
    text: 'Real-time insights that power decisions',
  },
  {
    icon: Network,
    title: 'Everything connected',
    text: 'People, processes and sites in one intelligent platform',
  },
];

export function BrandPanel() {
  return (
    <section className="auth-brand-panel relative order-2 flex min-h-[380px] flex-col overflow-hidden bg-[#061225] px-6 py-8 text-white sm:px-8 lg:order-1 lg:min-h-screen lg:px-12 lg:py-11 xl:px-16">
      <div className="auth-network-bg" aria-hidden="true">
        <div className="auth-orbit auth-orbit-one" />
        <div className="auth-orbit auth-orbit-two" />
        <div className="auth-grid-lines" />
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} className={`auth-node auth-node-${index + 1}`} />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-10 flex items-center gap-3 lg:mb-16">
          <img src="/4c-logo.png" alt="4C360 Sites" className="h-14 w-14 rounded-2xl object-contain shadow-[0_18px_34px_rgba(0,0,0,0.22)] lg:h-16 lg:w-16" />
          <div>
            <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              360
            </div>
            <div className="mt-1 text-xs font-bold uppercase text-white/80">
              Sites
            </div>
          </div>
        </div>

        <div className="max-w-[34rem]">
          <h1
            className="text-[2.5rem] font-bold leading-[1.08] text-white sm:text-5xl xl:text-[3.65rem]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Intelligence that <span className="text-[#ef2332]">connects.</span>
            <br />
            Operations that <span className="text-[#ef2332]">perform.</span>
          </h1>
          <div className="mt-7 h-0.5 w-16 bg-[#ef2332]" />
          <p className="mt-7 max-w-[27rem] text-[1.02rem] leading-8 text-slate-200/95">
            The unified platform for managing sites, people, and performance with real-time intelligence.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-auto lg:grid-cols-1 lg:gap-5">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="auth-feature-item flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-md lg:max-w-[24rem]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ef2332]/45 bg-[#ef2332]/8 text-[#ef2332] shadow-[0_0_28px_rgba(239,35,50,0.14)]">
                  <Icon size={23} strokeWidth={2.1} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{feature.title}</h2>
                  <p className="mt-1 max-w-[15rem] text-xs leading-5 text-slate-300">{feature.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 hidden items-center gap-2 text-sm text-slate-300 lg:flex">
          <ShieldCheck size={16} />
          Trusted by forward-thinking organizations worldwide.
        </p>
      </div>
    </section>
  );
}
