import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full h-[56px] bg-black/85 backdrop-blur-md border-b border-borderdefault">
      <div className="max-w-[1080px] mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center text-[18px] font-bold text-white tracking-tight">
          CreatorFeed
          <span className="w-1.5 h-1.5 bg-brandpurple rounded-full ml-1 animate-pulse"></span>
        </Link>
        
        <div className="flex items-center space-x-3">
          <Link href="#" className="text-[14px] text-secondary hover:text-primary transition-colors">
            How it works
          </Link>
          <button className="h-[36px] px-4 rounded-full border border-white text-white text-[14px] font-medium hover:bg-white hover:text-black transition-all">
            Sign in
          </button>
          <Link 
            href="/submit" 
            className="flex items-center justify-center h-[36px] px-4 rounded-full bg-brandpurple text-white text-[14px] font-medium hover:bg-brandpurplehover transition-all"
            style={{ boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
          >
            Submit a Problem
          </Link>
        </div>
      </div>
    </nav>
  );
}
