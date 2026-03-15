import { SubmissionForm } from '@/components/SubmissionForm';

export default function SubmitPage() {
  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit a Creator Problem</h1>
      <SubmissionForm />
    </main>
  );
}
