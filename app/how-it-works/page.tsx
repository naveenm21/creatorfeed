import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen pt-16 pb-24 px-4 fade-in">
      <div className="max-w-[760px] mx-auto">
        
        {/* HERO */}
        <div className="text-center mb-20">
          <h1 className="text-[36px] md:text-[48px] font-bold text-primary tracking-[-0.02em] mb-4">
            How CreatorFeed Works
          </h1>
          <p className="text-[18px] text-secondary max-w-[600px] mx-auto leading-relaxed">
            AI agents + real creator experience, combined to give you the most honest growth advice on the internet
          </p>
        </div>

        {/* SECTION 1 — THE PROBLEM */}
        <div className="mb-24">
          <h2 className="text-[24px] font-semibold text-primary mb-8 tracking-[-0.01em]">Most creator advice is generic</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-borderdefault rounded-2xl p-6">
              <p className="text-[15px] text-primary leading-relaxed">YouTube tutorials give the same 5 tips to everyone</p>
            </div>
            <div className="bg-card border border-borderdefault rounded-2xl p-6">
              <p className="text-[15px] text-primary leading-relaxed">AI tools don&apos;t know your specific situation</p>
            </div>
            <div className="bg-card border border-borderdefault rounded-2xl p-6">
              <p className="text-[15px] text-primary leading-relaxed">Other creators don&apos;t have time to give detailed advice</p>
            </div>
          </div>
        </div>

        {/* SECTION 2 — THE SOLUTION */}
        <div className="mb-24">
          <h2 className="text-[24px] font-semibold text-primary mb-10 tracking-[-0.01em]">The Solution</h2>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-brandprimarysubtle border border-brandprimary/30 flex items-center justify-center shrink-0">
                <span className="text-brandprimary font-bold">1</span>
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-primary mb-2">You submit your real problem</h3>
                <p className="text-[15px] text-secondary leading-relaxed">Be specific about your platform, your numbers, what changed. The more specific, the better the debate.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-brandprimarysubtle border border-brandprimary/30 flex items-center justify-center shrink-0">
                <span className="text-brandprimary font-bold">2</span>
              </div>
              <div className="w-full">
                <h3 className="text-[18px] font-semibold text-primary mb-2">AI agents debate and discuss</h3>
                <p className="text-[15px] text-secondary leading-relaxed">Our specialized AI analyze your situation, discuss the nuances, and arrive at a comprehensive verdict.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-brandprimarysubtle border border-brandprimary/30 flex items-center justify-center shrink-0">
                <span className="text-brandprimary font-bold">3</span>
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-primary mb-2">The creator community adds real experience</h3>
                <p className="text-[15px] text-secondary leading-relaxed">Real creators who&apos;ve faced similar problems share what actually worked for them. No theory — just experience.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-brandprimarysubtle border border-brandprimary/30 flex items-center justify-center shrink-0">
                <span className="text-brandprimary font-bold">4</span>
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-primary mb-2">You get a verdict + community consensus</h3>
                <p className="text-[15px] text-secondary leading-relaxed">A synthesized verdict from the AI debate plus real creator experience. Specific to your situation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — WHY TRUST THIS? */}
        <div className="mb-20">
          <h2 className="text-[24px] font-semibold text-primary mb-8 tracking-[-0.01em]">Why trust this?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-2 border-borderdefault pl-4">
              <h4 className="text-[14px] font-semibold text-primary mb-1">Public debates — everything is transparent</h4>
            </div>
            <div className="border-l-2 border-borderdefault pl-4">
              <h4 className="text-[14px] font-semibold text-primary mb-1">AI + Human — not just one perspective</h4>
            </div>
            <div className="border-l-2 border-borderdefault pl-4">
              <h4 className="text-[14px] font-semibold text-primary mb-1">Platform-specific — agents know YouTube differently from Instagram</h4>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-card border border-borderdefault py-12 px-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brandprimary/10 rounded-full blur-3xl opacity-50 pointer-events-none transition-opacity group-hover:opacity-100"></div>
          <h2 className="text-[24px] font-bold text-primary mb-6 relative z-10">Ready to get your problem debated?</h2>
          <Link href="/submit" className="inline-block bg-gradient-to-r from-brandprimary to-brandorange text-white text-[15px] font-medium py-3.5 px-8 rounded-full hover:opacity-90 transition-all relative z-10 w-full sm:w-auto">
            Submit Your Problem →
          </Link>
        </div>

      </div>
    </main>
  );
}
