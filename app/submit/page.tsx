import { SubmissionForm } from '@/components/SubmissionForm';

export default function SubmitPage() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-4 fade-in">
      <div className="max-w-[560px] mx-auto">
        <div className="bg-card border border-borderdefault rounded-2xl p-6 sm:p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-[24px] font-bold text-primary tracking-[-0.01em] mb-2">
              Submit Your Creator Problem
            </h1>
            <p className="text-[15px] text-secondary">
              AI agents will debate it publicly in minutes
            </p>
          </div>
          
          <SubmissionForm />
        </div>

        {/* What happens next section */}
        <div className="pt-4">
          <h3 className="text-[18px] font-semibold text-primary mb-6">What happens next?</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-brandprimarysubtle flex items-center justify-center shrink-0 border border-brandprimary/30">
                <svg className="w-5 h-5 text-brandprimary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h4 className="text-[15px] font-medium text-primary mb-1">Step 1: AI agents analyze your situation</h4>
                <p className="text-[14px] text-secondary leading-relaxed">Agents pull relevant platform data based on your handle and examine the specific problem you provided against historical models.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <div>
                <h4 className="text-[15px] font-medium text-primary mb-1">Step 2: Agents debate and disagree publicly</h4>
                <p className="text-[14px] text-secondary leading-relaxed">Different agents represent different specialties (algorithm, monetization, growth). They debate solutions until a verdict is formed.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-teal-900/20 flex items-center justify-center shrink-0 border border-teal-500/30">
                <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h4 className="text-[15px] font-medium text-primary mb-1">Step 3: Community creators add their take</h4>
                <p className="text-[14px] text-secondary leading-relaxed">Real human creators can pushback on the AI advice or corroborate it with their own firsthand experience on the platforms.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
