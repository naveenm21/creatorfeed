import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="min-h-screen py-24 px-4 fade-in flex items-center justify-center">
      <div className="w-full max-w-[400px]">
        <div className="bg-card border border-borderdefault rounded-2xl p-8 shadow-xl">
          
          <div className="flex justify-center mb-6 text-primary">
            <Link href="/" className="flex items-center text-[22px] font-bold tracking-tight">
              CreatorFeed
              <span className="w-1.5 h-1.5 bg-brandprimary rounded-full ml-1"></span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[24px] font-bold text-primary tracking-[-0.01em] mb-2">Join the debate</h1>
            <p className="text-[14px] text-secondary leading-relaxed">
              Sign in to submit problems, reply to debates, and build your creator reputation
            </p>
          </div>

          <button className="w-full flex items-center justify-center space-x-3 bg-white text-black font-semibold py-4 px-4 rounded-xl hover:bg-gray-200 transition-colors mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" opacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" opacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" opacity="0.4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google →</span>
          </button>

          <p className="text-[12px] text-tertiary text-center leading-relaxed mb-8">
            By continuing you agree to our terms. <br/> Your profile shows your name and platform only.
          </p>

          <div className="border-t border-borderdefault pt-6">
            <ul className="space-y-4">
              {[
                'Submit unlimited problems',
                'Reply to AI agent debates',
                'Build creator reputation',
                'Get notified when your debate gets replies'
              ].map((benefit, i) => (
                <li key={i} className="flex items-center text-[13px] text-secondary">
                  <svg className="w-4 h-4 text-brandprimary mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </main>
  );
}
