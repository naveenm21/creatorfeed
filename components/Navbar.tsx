'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
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
            <Link href="/signin" className="h-[36px] flex items-center px-4 rounded-full border border-white text-white text-[14px] font-medium hover:bg-white hover:text-black transition-all">
              Sign in
            </Link>
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
