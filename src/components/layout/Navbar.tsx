import Link from 'next/link';
import { CreditCard, Search, Percent, BarChart3, Plane } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              CardPortal
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/compare" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <Search className="h-4 w-4" />
              Compare Cards
            </Link>
            <Link href="/offers" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <Percent className="h-4 w-4" />
              Latest Offers
            </Link>
            <Link href="/calculator" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <Plane className="h-4 w-4" />
              Points Calculator
            </Link>
          </div>

          {/* Mobile Menu Button (Optional placeholder for future) */}
          <div className="md:hidden flex items-center">
            <button className="text-slate-500 hover:text-slate-900 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}