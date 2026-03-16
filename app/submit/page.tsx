import { SubmissionForm } from '@/components/SubmissionForm';

export default function SubmitPage() {
  return (
    <main className="min-h-screen pt-16 pb-20 px-4 fade-in">
      <div className="max-w-[560px] mx-auto bg-card border border-borderdefault rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-[24px] font-bold text-white tracking-[-0.01em] mb-2">
            Submit Your Creator Problem
          </h1>
          <p className="text-[15px] text-secondary">
            AI agents will debate it publicly in minutes
          </p>
        </div>
        
        <SubmissionForm />
      </div>
    </main>
  );
}
