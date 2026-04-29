import React, { useState } from 'react';
import { MapPin, Clock, Zap, Target, ChevronRight, ChevronDown, Navigation } from 'lucide-react';
import { useTheme } from "../../hooks/ThemeContext";

export const RouteSummary = ({ data }) => {
  if (!data) return null;

  const { theme } = useTheme();

  const [routeExpanded, setRouteExpanded] = useState(true);
  const [segExpanded, setSegExpanded] = useState(false);

  const km = (data.summary.totalDistance / 1000).toFixed(1);
  const mins = Math.round(data.summary.totalDuration / 60);
  const avgSpeed = data.summary.totalDuration > 0
    ? ((data.summary.totalDistance / 1000) / (data.summary.totalDuration / 3600)).toFixed(0)
    : 0;
  const stops = data.optimizedOrder?.filter(p => !p.isOrigin).length || 0;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* ── Unified Main Stats Card ── */}
      <div className="overflow-hidden rounded-[1.25rem] border border-base-300 shadow-lg">

        {/* 1. Distance Hero (Gradient BG) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-5 pb-6 shadow-lg shadow-primary/20">
          <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-black/[0.06]" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]" />

          <div className="relative">
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-content/50">
              <MapPin size={10} strokeWidth={2.5} /> Total Distance
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-[2.5rem] leading-none font-black tabular-nums tracking-tight ${theme === 'dark' ? 'text-black' : 'text-white'}`}>
                {km}
              </span>
              <span className="text-sm font-semibold text-primary-content/35">km</span>
            </div>
          </div>
        </div>

        {/* 2. Other Stats (Base-200 BG) */}
        <div className="bg-base-100/40 p-4 border-t border-primary/10">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-base-200/60 border border-base-300/60 py-3 px-2 shadow-lg">
              <Clock size={15} className="text-secondary" strokeWidth={2} />
              <div className="text-center">
                <span className="block text-lg font-extrabold tabular-nums text-secondary leading-none">{mins}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-base-content/40">Min</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-base-200/60 border border-base-300/60 py-3 px-2 shadow-lg">
              <Zap size={15} className="text-warning" strokeWidth={2} />
              <div className="text-center">
                <span className="block text-lg font-extrabold tabular-nums text-warning leading-none">{avgSpeed}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-base-content/40">Km/h</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-base-200/60 border border-base-300/80 py-3 px-2 shadow-lg">
              <Target size={15} className="text-success" strokeWidth={2} />
              <div className="text-center">
                <span className="block text-lg font-extrabold tabular-nums text-success leading-none">{stops}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-base-content/40">Stops</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Optimized order (Accordion with Timeline) ── */}
      {data.optimizedOrder?.length > 0 && (
        <div className="bg-base-100/40 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setRouteExpanded(!routeExpanded)}
            className="flex w-full items-center justify-between px-4 py-2.5 border-b border-base-300 hover:bg-base-300/50 transition-colors duration-200"
          >
            <span className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                <ChevronRight size={10} className="text-primary" strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-base-content/40">Optimized Order</span>
              <span className="rounded-md bg-primary/10 px-1.5 py-[1px] text-[9px] font-extrabold text-primary tabular-nums">
                {data.optimizedOrder.length}
              </span>
            </span>
            <ChevronDown
              size={14}
              className={`text-base-content/30 transition-transform duration-300 ${routeExpanded ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className="grid transition-all duration-300 ease-out overflow-hidden"
            style={{ gridTemplateRows: routeExpanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-4 max-h-[220px] overflow-y-auto scrollbar-thin">
                {/* Timeline Container */}
                <div className="relative ml-[11px]">
                  {/* Connector Line */}
                  <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-error/60 via-primary/40 to-primary/10" />

                  <div className="space-y-0">
                    {data.optimizedOrder.map((point, i) => {
                      // Map the distance from the segments array to the correct point
                      const distToHere = !point.isOrigin && data.segments?.[i - 1]
                        ? (data.segments[i - 1].distance / 1000).toFixed(1)
                        : null;

                      return (
                        <div
                          key={i}
                          className="group/row relative flex items-center gap-3 py-[9px] pl-5 pr-2 hover:pl-6 hover:bg-base-300/60 hover:translate-x-1 rounded-xl transition-all duration-200 cursor-default"
                        >
                          {/* Node Dot */}
                          <div className={`absolute left-[-11px] top-1/2 -translate-y-1/2 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full transition-all duration-200 group-hover/row:scale-110 ${point.isOrigin
                            ? 'bg-error text-error ring-[3px] ring-error/30 shadow-sm shadow-error/20'
                            : 'bg-base-100 text-primary ring-[2.5px] ring-primary/30 border border-base-300'
                            }`}>
                            {point.isOrigin
                              ? <Navigation size={10} className="-rotate-45 text-white" strokeWidth={2.5} />
                              : <span className="text-[9px] font-black leading-none">{i}</span>
                            }
                          </div>

                          {/* Label */}
                          <p className="min-w-0 flex-1 truncate text-xs font-medium text-base-content/50 group-hover/row:text-base-content/70 transition-colors duration-200">
                            {point.address || point.label || `${point.point?.lat?.toFixed(4)}, ${point.point?.lng?.toFixed(4)}`}
                          </p>

                          {/* Distance Tag */}
                          {distToHere !== null && (
                            <span className="shrink-0 rounded-md bg-base-100/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-base-content/65 transition-colors duration-200 border border-base-300/50 shadow-sm">
                              {distToHere} km
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Route Segments (Accordion) ── */}
      {data.segments?.length > 0 && (
        <div className="bg-base-100/40 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setSegExpanded(!segExpanded)}
            className="flex w-full items-center justify-between px-4 py-2.5 border-b border-base-300 hover:bg-base-300/50 transition-colors duration-200"
          >
            <span className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {data.segments.slice(0, 5).map((s, i) => (
                  <div key={i} className="w-2 h-2 rounded-full ring-1 ring-black/10" style={{ background: s.color }} />
                ))}
                {data.segments.length > 5 && (
                  <div className="w-2 h-2 rounded-full bg-base-400/50 flex items-center justify-center ring-1 ring-black/10">
                    <span className="text-[5px] font-bold text-base-content/60">+</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-base-content/40">Route Segments</span>
            </span>
            <ChevronDown
              size={14}
              className={`text-base-content/30 transition-transform duration-300 ${segExpanded ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          <div
            className="grid transition-all duration-300 ease-out overflow-hidden"
            style={{ gridTemplateRows: segExpanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-2 space-y-[2px]">
                {data.segments.map((seg, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-300/60 hover:translate-x-1 transition-all duration-200 cursor-default"
                  >
                    <div
                      className="w-7 h-1.5 rounded-full shrink-0 transition-all duration-200 group-hover:w-9"
                      style={{
                        background: seg.isReturn ? 'none' : seg.color,
                        opacity: seg.isReturn ? 0.5 : 1,
                        boxShadow: !seg.isReturn ? `0 0 6px ${seg.color}30` : 'none',
                        backgroundImage: seg.isReturn
                          ? `repeating-linear-gradient(90deg,${seg.color} 0,${seg.color} 4px,transparent 4px,transparent 8px)`
                          : undefined
                      }}
                    />
                    <span className="text-xs flex-1 text-base-content/50 group-hover:text-base-content/70 transition-colors duration-200">
                      {seg.isReturn ? '↩ Return to start' : `Stop ${seg.fromIndex === 0 ? 'Origin' : seg.fromIndex} → Stop ${seg.toIndex}`}
                    </span>
                    <span className="shrink-0 rounded-md bg-base-100/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-base-content/65 transition-colors duration-200 border border-base-300/50 shadow-sm">
                      {(seg.distance / 1000).toFixed(1)} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};