import { useState } from 'react';
import { Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { SocialLoginButton } from './SocialLoginButton';
import { UserTypeTags } from './UserTypeTags';

type LoginErrors = {
  identifier?: string;
  password?: string;
  form?: string;
};

function GoogleMark() {
  return <span className="text-lg font-bold text-[#4285F4]">G</span>;
}

function MicrosoftMark() {
  return (
    <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </span>
  );
}

export function LoginCard() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [notice, setNotice] = useState('');

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!identifier.trim()) {
      nextErrors.identifier = 'Enter your email or username.';
    } else if (identifier.trim().length < 3) {
      nextErrors.identifier = 'Use at least 3 characters.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setErrors({});

    if (!validate()) return;

    setLoading(true);
    window.setTimeout(() => {
      const normalized = identifier.trim().toLowerCase();
      if (normalized === 'invalid' || password.toLowerCase() === 'invalid') {
        setLoading(false);
        setErrors({ form: 'We could not verify those credentials. Please check and try again.' });
        return;
      }

      sessionStorage.setItem('4c360-auth-status', 'stubbed-local-login');
      window.location.assign('/');
    }, 650);
  };

  const requestMagicLink = () => {
    setErrors({});
    if (!identifier.trim()) {
      setErrors({ identifier: 'Enter your email or username first.' });
      return;
    }
    setNotice('Magic link request captured. Connect an auth provider to send real links.');
  };

  const providerPlaceholder = (provider: string) => {
    setErrors({});
    setNotice(`${provider} sign-in is ready for provider wiring.`);
  };

  const inputClass = (hasError?: boolean) =>
    `h-[52px] w-full rounded-xl border bg-white pl-11 pr-12 text-[15px] text-slate-950 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-[#df1f2d] focus:outline-none focus:ring-4 focus:ring-red-500/10 ${
      hasError ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200 hover:border-slate-300'
    }`;

  return (
    <section className="auth-card-enter w-full max-w-[560px] rounded-[1.75rem] border border-white/80 bg-white/96 px-5 py-6 text-slate-950 shadow-[0_34px_95px_rgba(8,19,38,0.24)] backdrop-blur-xl sm:px-8 sm:py-8 lg:px-10">
      <div className="mx-auto mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <img src="/4c-logo.png" alt="4C360 Properties" className="h-[4.5rem] w-[4.5rem] rounded-2xl object-contain shadow-[0_14px_32px_rgba(15,23,42,0.08)]" />
          <div className="text-left">
            <div className="text-[2rem] font-bold leading-none text-[#081326]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              360
            </div>
            <div className="mt-2 text-xs font-bold uppercase text-slate-800">
              Properties
            </div>
          </div>
        </div>
        <h2 className="text-[2rem] font-bold leading-tight text-[#081326]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Welcome back
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Sign in to access your 4C360 Properties account</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-identifier" className="mb-2 block text-sm font-semibold text-slate-800">
            Email or Username
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              className={inputClass(Boolean(errors.identifier))}
              placeholder="Enter your email or username"
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
            />
          </div>
          {errors.identifier && (
            <p id="login-identifier-error" className="mt-2 text-sm font-medium text-red-600">
              {errors.identifier}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-800">
              Password
            </label>
            <a href="/forgot-password" className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className={inputClass(Boolean(errors.password))}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df1f2d]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="mt-2 text-sm font-medium text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        {errors.form && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errors.form}
          </div>
        )}

        {notice && (
          <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#081b3a] px-5 text-base font-bold text-white shadow-[0_18px_40px_rgba(8,27,58,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d254f] hover:shadow-[0_22px_46px_rgba(8,27,58,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df1f2d] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-sm text-slate-500">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <SocialLoginButton icon={<Mail size={21} />} onClick={requestMagicLink} disabled={loading}>
          Send me a magic link
        </SocialLoginButton>
        <SocialLoginButton icon={<GoogleMark />} onClick={() => providerPlaceholder('Google')} disabled={loading}>
          Continue with Google
        </SocialLoginButton>
        <SocialLoginButton icon={<MicrosoftMark />} onClick={() => providerPlaceholder('Microsoft')} disabled={loading}>
          Continue with Microsoft
        </SocialLoginButton>
      </div>

      <p className="mt-7 text-center text-sm text-slate-500">
        New to 4C360 Properties?{' '}
        <a href="/register" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
          Create an account
        </a>
      </p>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
        <ShieldCheck size={18} />
        Secure. Reliable. Always.
      </p>

      <div className="mt-6 grid gap-5 rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#f8fafc)] p-4 shadow-inner shadow-slate-100 sm:grid-cols-[1.05fr_1fr] sm:p-5">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#081b3a]">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Organization-based access</h3>
            <p className="mt-3 text-xs leading-6 text-slate-600">
              All members belong to an organization. Roles are assigned by your organization administrator.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">User types</p>
          <UserTypeTags />
        </div>
      </div>
    </section>
  );
}
