'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth-actions'

export function Navbar() {
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full h-[56px] bg-black/85 backdrop-blur-md border-b border-borderdefault">
        <div className="max-w-[1080px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center text-[18px] font-bold text-white tracking-tight">
            CreatorFeed
            <span className="w-1.5 h-1.5 bg-brandprimary rounded-full ml-1 animate-pulse"></span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4 pr-1">
            <Link href="/how-it-works" className="text-[14px] text-secondary hover:text-primary transition-colors mr-2">
              How it works
            </Link>
            <Link href="/trending" className="text-[14px] text-secondary hover:text-primary transition-colors mr-2">
              Trending
            </Link>
            {loading ? (
              <div className="w-8 h-8 rounded-full 
                bg-borderdefault animate-pulse"/>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 
                    hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full 
                    bg-purple-600 flex items-center 
                    justify-center text-white text-[13px] 
                    font-bold">
                    {user.user_metadata?.full_name?.[0] ?? 
                      user.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 
                    w-48 bg-card border border-borderdefault 
                    rounded-xl py-2 z-50">
                    <div className="px-4 py-2 border-b 
                      border-borderdefault">
                      <p className="text-[13px] font-medium 
                        text-white truncate">
                        {user.user_metadata?.full_name ?? 'Creator'}
                      </p>
                      <p className="text-[12px] text-secondary 
                        truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 
                        text-[13px] text-secondary 
                        hover:text-white hover:bg-cardhover 
                        transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin"
                className="h-[36px] px-4 rounded-full 
                  text-[14px] font-medium border 
                  border-white/30 text-white 
                  hover:bg-white hover:text-black 
                  transition-colors flex items-center">
                Sign in
              </Link>
            )}
            <Link 
              href="/submit" 
              className="flex items-center justify-center h-[36px] px-4 rounded-full bg-brandpurple text-white text-[14px] font-medium hover:bg-brandpurplehover transition-all"
              style={{ boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer */}
          <div className="relative w-[280px] max-w-full bg-[#0A0A0A] border-l border-borderdefault h-full shadow-2xl flex flex-col p-6 animate-slide-in">
            <button 
              className="absolute top-5 right-5 text-secondary hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col space-y-6 mt-12">
              <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-semibold text-primary pb-4 border-b border-borderdefault">
                How it works
              </Link>
              <Link href="/trending" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-semibold text-primary pb-4 border-b border-borderdefault">
                Trending
              </Link>
              <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-semibold text-primary pb-4 border-b border-borderdefault">
                Sign in
              </Link>
              <Link href="/submit" onClick={() => setMobileMenuOpen(false)} className="text-[18px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brandprimary to-brandorange">
                Submit a Problem →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
