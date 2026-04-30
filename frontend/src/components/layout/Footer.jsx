import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-base-300 bg-base-200/60 backdrop-blur-xl">
      {/* subtle glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left - Brand */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-xl blur-md opacity-60" />
              <img
                src="/app-logo.png"
                alt="SmartNav Logo"
                className="relative w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888888"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="font-black text-sm tracking-tight text-base-content uppercase">
                Smart<span className="text-primary">Nav</span>
              </span>
              <span className="text-[10px] text-base-content/40 font-medium">
                Route Optimizer
              </span>
            </div>
          </div>

          {/* Center - Copyright */}
          <div className="text-center">
            <p className="text-xs text-base-content/60">
              © {currentYear} — Built by{" "}
              <span className="font-semibold text-primary">
                Jewel Mofiz Shahi
              </span>
            </p>
          </div>

          {/* Right - GitHub (normal a tag) */}
          <a
            href="https://github.com/JewelShahi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-base-content/50 hover:text-primary transition-colors duration-200 underline underline-offset-4"
          >
            GitHub ↗
          </a>

        </div>

        {/* Disclaimer - because the app might have errors */}
        <div className="mt-3 text-center text-[10px] text-base-content/30 border-t border-base-300/30 pt-2">
          <span>Note: This app may contain errors. Path optimization is not guaranteed 100% accurate.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;