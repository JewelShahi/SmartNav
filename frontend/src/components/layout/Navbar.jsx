import React from 'react';
import { Sun, Moon } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-500 backdrop-blur-xl ${theme === 'dark'
        ? 'bg-base-300/80 border-b border-white/[0.04]'
        : 'bg-base-200/80 border-b border-slate-300/50'
      }`}>
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3 animate-in slide-in-from-left-3 duration-500">
            <div className="relative group/logo">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/30 to-violet-500/30 rounded-xl blur-md opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
              <img
                src="/app-logo.png"
                alt="SmartNav Logo"
                className={`relative w-9 h-9 object-contain`}
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-black tracking-tight leading-none transition-colors duration-500 uppercase text-3xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                Smart<span className="text-primary">Nav</span>
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 animate-in slide-in-from-right-3 duration-500 delay-100">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${theme === 'dark'
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-amber-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-amber-600'
                }`}
              aria-label="Toggle Theme"
            >
              <div className="relative w-5 h-5">
                <Sun
                  size={18}
                  className={`absolute inset-0 transition-all duration-500 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
                    }`}
                />
                <Moon
                  size={18}
                  className={`absolute inset-0 transition-all duration-500 ${theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;