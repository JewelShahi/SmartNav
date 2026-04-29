import React from "react";

export const Footer = () => {
  return (
    <footer className="relative w-full border-t border-base-300 bg-base-200/60 backdrop-blur-xl">

      {/* subtle glow line like navbar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left - Brand */}
          <div className="flex items-center gap-3">

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-xl blur-md opacity-60" />
              <img
                src="/app-logo.png"
                alt="SmartNav Logo"
                className="relative w-8 h-8 object-contain"
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
              © {new Date().getFullYear()} — Built by{" "}
              <span className="font-semibold text-primary">
                Jewel Mofiz Shahi
              </span>
            </p>
          </div>

          {/* Right - GitHub */}
          <a
            href="https://github.com/JewelShahi"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-base-content/50 hover:text-primary transition-colors duration-200 underline underline-offset-4"
          >
            GitHub ↗
          </a>

        </div>
      </div>
    </footer>
  );
};
