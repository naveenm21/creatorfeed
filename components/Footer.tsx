import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-borderdefault py-8 mt-auto">
      <div className="max-w-[1080px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="text-[14px] text-secondary font-medium tracking-tight">
          CreatorFeed <span className="mx-2">·</span> Built for creators
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/how-it-works" className="text-[13px] text-secondary hover:text-primary transition-colors">
            How it works
          </Link>
          <Link href="/trending" className="text-[13px] text-secondary hover:text-primary transition-colors">
            Trending
          </Link>
          <Link href="/submit" className="text-[13px] text-secondary hover:text-primary transition-colors">
            Submit
          </Link>
        </div>

        <div className="text-[13px] text-secondary flex flex-col items-center md:items-end gap-1">
          <Link href="https://creedm.ai" target="_blank" className="hover:text-primary transition-colors flex items-center">
            Powered by Creedom.ai
          </Link>
          <span className="text-[11px] text-tertiary">© 2026 CreatorFeed. All rights reserved.</span>
        </div>

      </div>
    </footer>
  );
}
