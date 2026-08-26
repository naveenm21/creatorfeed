'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth-actions'
import { useEffect } from 'react';

export function Navbar() {
  const { user, loading } = useAuth()
  const [userStats, setUserStats] = useState<{ karma: number, badges: string[] } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/user/stats')
        .then(res => res.json())
        .then(data => setUserStats(data))
        .catch(() => {});
    }
  }, [user]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full h-[64px] glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center text-[22px] font-display font-bold text-primary tracking-tight group">
            CreatorFeed
            <span className="w-1.5 h-1.5 bg-brandprimary rounded-full ml-1 shadow-[0_0_8px_var(--pink-soft)] group-hover:scale-150 transition-transform duration-300"></span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 pr-1">
            <Link href="/how-it-works" className="text-[14px] font-medium text-secondary hover:text-brandprimary transition-colors">
              How it works
            </Link>
            <Link href="/trending" className="text-[14px] font-medium text-secondary hover:text-brandprimary transition-colors">
              Trending
            </Link>
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-borderdefault animate-pulse"/>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-brandprimary flex items-center justify-center text-white text-[14px] font-bold shadow-md">
                    {user.user_metadata?.full_name?.[0] ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-card border border-borderdefault rounded-[20px] py-2 z-50 shadow-[var(--float-shadow)]">
                    <div className="px-4 py-3 border-b border-borderdefault">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-[14px] font-bold text-primary truncate hover:text-brandprimary transition-colors block"
                      >
                        {user.user_metadata?.full_name ?? 'Creator'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[12px] text-secondary truncate">
                          {user.email}
                        </p>
                        <span className="w-1 h-1 rounded-full bg-borderdefault" />
                        <span className="flex items-center gap-1 text-[12px] font-bold text-mint">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {userStats?.karma ?? 0}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/profile/${user.id}`}
                      className="w-full h-12 flex items-center justify-between px-4 text-[14px] font-semibold text-primary hover:bg-brandprimarysubtle group transition-colors border-b border-borderdefault"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brandprimary group-hover:scale-125 transition-transform" />
                        My Profile
                      </span>
                      <svg className="w-4 h-4 text-secondary group-hover:text-brandprimary transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-3 text-[14px] font-medium text-secondary hover:text-primary hover:bg-cardhover transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin"
                className="h-[40px] px-5 rounded-[999px] text-[14px] font-bold border border-borderdefault text-primary hover:bg-cardhover hover:border-borderhover transition-all flex items-center">
                Sign in
              </Link>
            )}
            <Link 
              href="/submit" 
              className="hidden md:flex items-center justify-center h-[40px] px-6 rounded-[999px] bg-brandprimary text-white text-[14px] font-bold hover:bg-brandprimaryhover hover:-translate-y-[1px] hover:shadow-[var(--raise-shadow)] active:scale-[0.98] transition-all duration-200"
            >
              Submit a Problem
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button 
            className="md:hidden text-primary p-2 focus:outline-none"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer */}
          <div className="relative w-[280px] max-w-full bg-card border-l border-borderdefault h-full shadow-[var(--float-shadow)] flex flex-col p-6 animate-slide-in">
            <button 
              className="absolute top-5 right-5 text-secondary hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col space-y-6 mt-12">
              <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold text-primary pb-4 border-b border-borderdefault">
                How it works
              </Link>
              <Link href="/trending" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold text-primary pb-4 border-b border-borderdefault">
                Trending
              </Link>
              {loading ? (
                <div className="h-[44px] w-1/2 bg-borderdefault animate-pulse rounded-lg mb-4" />
              ) : user ? (
                <>
                  <Link href="/my-debates" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold text-primary pb-4 border-b border-borderdefault">
                    My Debates
                  </Link>
                  <button 
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }} 
                    className="text-[18px] font-bold text-left text-secondary pb-4 border-b border-borderdefault"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-bold text-primary pb-4 border-b border-borderdefault">
                  Sign in
                </Link>
              )}
              <Link href="/submit" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center w-full h-[52px] rounded-[16px] bg-brandprimary text-white text-[16px] font-bold shadow-[var(--raise-shadow)] active:scale-95 transition-all">
                Submit a Problem →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
