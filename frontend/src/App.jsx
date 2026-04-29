// ========== App.jsx ==========
import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Map, MapControls, MapMarker, MapSource, MapLayer } from "./components/ui/map";
import { RouteService, GeocodeService } from "./api/services";
import { useTheme } from './hooks/useTheme';
import {
  Plus, Zap, Clock, MapPin, Navigation, Home, Save,
  Route, ArrowRight, Sparkles, Target, MapIcon,
  ChevronDown, X, CheckCircle2, Loader2, Gauge, RotateCcw,
  Waypoints
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const App = () => {
  const { theme, toggleTheme } = useTheme();

  const [origin, setOrigin] = useState("");
  const [stops, setStops] = useState([""]);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSearch, setActiveSearch] = useState({ index: null, data: [] });
  const [savedStart, setSavedStart] = useState(false);
  const [mounted, setMounted] = useState(false);

  const debounceTimer = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapStyle = theme === 'dark'
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  useEffect(() => {
    const saved = localStorage.getItem('userDefaultStart');
    if (saved) {
      setOrigin(saved);
      setSavedStart(true);
    }
  }, []);

  const handleSaveStart = () => {
    if (!origin.trim()) return toast.error("Enter an address first");
    localStorage.setItem('userDefaultStart', origin);
    setSavedStart(true);
    toast.custom((t) => (
      <div className={`alert shadow-2xl border px-5 py-4 max-w-sm animate-in slide-in-from-right-5 duration-300 ${theme === 'dark' ? 'bg-[#1a1f35] border-white/[0.06]' : 'bg-white border-slate-200'
        }`}>
        <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
        <span className="font-semibold text-sm text-slate-900 dark:text-white">Starting point saved!</span>
      </div>
    ), { duration: 2500 });
  };

  const handleSearch = (query, index) => {
    if (index === 'origin') setOrigin(query);
    else {
      const newStops = [...stops];
      newStops[index] = query;
      setStops(newStops);
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (query.trim().length > 2) {
        try {
          const { data } = await GeocodeService.autocomplete(query);
          setActiveSearch({ index, data });
        } catch (err) { console.error(err); }
      } else setActiveSearch({ index: null, data: [] });
    }, 400);
  };

  const selectSuggestion = (address, index) => {
    if (index === 'origin') setOrigin(address);
    else {
      const newStops = [...stops];
      newStops[index] = address;
      setStops(newStops);
    }
    setActiveSearch({ index: null, data: [] });
  };

  const handleOptimize = async () => {
    if (!origin || stops.some(s => !s.trim())) return toast.error("Please fill all locations");
    setLoading(true);
    setRouteData(null);
    try {
      const { data } = await RouteService.optimize(origin, stops, true);
      setRouteData(data);
      toast.custom((t) => (
        <div className={`alert shadow-2xl border px-5 py-4 max-w-sm animate-in slide-in-from-right-5 duration-300 ${theme === 'dark' ? 'bg-[#1a1f35] border-white/[0.06]' : 'bg-white border-slate-200'
          }`}>
          <Sparkles className="text-amber-500 shrink-0" size={18} />
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">Route Optimized!</p>
            <p className="text-xs text-slate-500 dark:text-white/50">{(data.summary.totalDistance / 1000).toFixed(1)} km • {Math.round(data.summary.totalDuration / 60)} min</p>
          </div>
        </div>
      ), { duration: 3000 });
    } catch (err) {
      toast.error("Optimization failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setOrigin(localStorage.getItem('userDefaultStart') || "");
    setStops([""]);
    setRouteData(null);
  };

  const filledStops = stops.filter(s => s.trim()).length;

  return (
    <div data-theme={theme} className="min-h-screen flex flex-col transition-colors duration-700 bg-[#07090f]" style={theme === 'light' ? { backgroundColor: '#eef0f5' } : {}}>
      <Toaster position="bottom-right" />
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <main className={`flex-grow container mx-auto px-4 py-5 lg:px- lg:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>

        {/* ========== SIDEBAR ========== */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-4">

          {/* Main Card */}
          <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="absolute -inset-[1px] bg-gradient-to-br from-cyan-500/20 via-violet-500/10 to-transparent rounded-[1.75rem] blur-[2px]" />
            <div className={`relative rounded-[1.65rem] shadow-2xl border overflow-visible transition-colors duration-700 ${theme === 'dark'
                ? 'bg-[#0d1220]/90 backdrop-blur-2xl border-white/[0.06] shadow-black/50'
                : 'bg-white/95 backdrop-blur-2xl border-slate-300/60 shadow-slate-900/8'
              }`}>
              <div className="p-6 lg:p-7">

                {/* Header */}
                <header className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20">
                        <Route size={18} strokeWidth={2.5} />
                      </div>
                      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 animate-pulse ${theme === 'dark' ? 'border-[#0d1220]' : 'border-white'
                        }`} />
                    </div>
                    <div>
                      <h1 className={`text-xl font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                        Smart<span className="text-cyan-500/70">Nav</span>
                      </h1>

                    </div>
                  </div>
                  {routeData && (
                    <button
                      onClick={handleReset}
                      className={`btn btn-ghost btn-circle btn-xs transition-all duration-200 ${theme === 'dark'
                          ? 'text-white/30 hover:text-red-400 hover:bg-red-400/10'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </header>

                {/* Origin Input */}
                <div className="form-control w-full relative mb-5">
                  <div className="flex justify-between items-center mb-2.5 px-1">
                    <label className={`text-[10px] uppercase font-black tracking-[0.15em] flex items-center gap-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'
                      }`}>
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-500 text-white">
                        <Home size={10} strokeWidth={3} />
                      </span>
                      Starting Point
                    </label>
                    <button
                      onClick={handleSaveStart}
                      className={`btn btn-ghost btn-xs gap-1.5 font-bold transition-all duration-200 ${savedStart
                          ? theme === 'dark'
                            ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          : theme === 'dark'
                            ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'
                            : 'text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50'
                        }`}
                    >
                      {savedStart ? <CheckCircle2 size={13} /> : <Save size={13} />}
                      {savedStart ? 'Saved' : 'Save'}
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      className={`input input-bordered w-full rounded-xl pl-10 h-11 text-sm font-medium transition-all duration-300 focus:outline-none ${theme === 'dark'
                          ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 hover:border-white/[0.15]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 hover:border-slate-400'
                        }`}
                      value={origin}
                      placeholder="Home or office address..."
                      onChange={(e) => handleSearch(e.target.value, 'origin')}
                    />
                    <MapPin size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${theme === 'dark' ? 'text-white/20 group-focus-within:text-cyan-400' : 'text-slate-400 group-focus-within:text-cyan-600'
                      }`} />
                  </div>
                  {activeSearch.index === 'origin' && activeSearch.data.length > 0 && (
                    <ul className={`absolute top-[76px] z-[100] menu w-full rounded-2xl shadow-2xl p-1.5 animate-in slide-in-from-top-3 duration-200 ${theme === 'dark'
                        ? 'bg-[#151b2e]/95 backdrop-blur-xl border border-white/[0.08]'
                        : 'bg-white backdrop-blur-xl border border-slate-300 shadow-slate-900/10'
                      }`}>
                      {activeSearch.data.map((s, i) => (
                        <li key={i}>
                          <button
                            onClick={() => selectSuggestion(s.formattedAddress, 'origin')}
                            className={`flex items-center gap-3 text-sm py-2.5 px-3 rounded-xl transition-colors duration-150 w-full text-left ${theme === 'dark'
                                ? 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                          >
                            <MapPin size={13} className="text-cyan-500 shrink-0" />
                            <span className="line-clamp-1">{s.formattedAddress}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5 px-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 via-violet-500/10 to-transparent" />
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'
                    }`}>
                    <Target size={10} />
                    Destinations
                    {filledStops > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-md text-[10px] font-black">
                        {filledStops}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 via-violet-500/10 to-transparent" />
                </div>

                {/* Stops */}
                <div className="form-control w-full">
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {stops.map((stop, idx) => (
                      <div key={idx} className="relative group/stop animate-in fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-center gap-2.5 px-1">
                          <div className="shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-black ring-1 ring-cyan-500/20">
                            {idx + 1}
                          </div>
                          <div className="relative flex-1">
                            <input
                              className={`input input-bordered w-full rounded-xl pl-9 h-10 text-sm font-medium transition-all duration-300 focus:outline-none ${theme === 'dark'
                                  ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 hover:border-white/[0.15]'
                                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 hover:border-slate-400'
                                }`}
                              placeholder={`Stop #${idx + 1}`}
                              value={stop}
                              onChange={(e) => handleSearch(e.target.value, idx)}
                            />
                            <MapPin size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/15' : 'text-slate-400'
                              }`} />
                            {activeSearch.index === idx && activeSearch.data.length > 0 && (
                              <ul className={`absolute top-[44px] left-0 z-[100] menu w-full rounded-2xl shadow-2xl p-1.5 animate-in slide-in-from-top-3 duration-200 ${theme === 'dark'
                                  ? 'bg-[#151b2e]/95 backdrop-blur-xl border border-white/[0.08]'
                                  : 'bg-white backdrop-blur-xl border border-slate-300 shadow-slate-900/10'
                                }`}>
                                {activeSearch.data.map((s, i) => (
                                  <li key={i}>
                                    <button
                                      onClick={() => selectSuggestion(s.formattedAddress, idx)}
                                      className={`flex items-center gap-3 text-sm py-2.5 px-3 rounded-xl transition-colors duration-150 w-full text-left ${theme === 'dark'
                                          ? 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                      <MapPin size={13} className="text-cyan-500 shrink-0" />
                                      <span className="line-clamp-1">{s.formattedAddress}</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {stops.length > 1 && (
                            <button
                              className={`btn btn-ghost btn-circle btn-xs opacity-0 group-hover/stop:opacity-100 transition-all duration-200 shrink-0 ${theme === 'dark'
                                  ? 'text-white/20 hover:text-red-400 hover:bg-red-400/10'
                                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                              onClick={() => setStops(stops.filter((_, i) => i !== idx))}
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                        {idx < stops.length - 1 && (
                          <div className="ml-[11px] mt-1 mb-0.5 w-px h-2 bg-gradient-to-b from-cyan-500/20 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    className={`btn btn-ghost btn-block btn-sm mt-4 rounded-xl border-2 border-dashed transition-all duration-300 gap-2 ${theme === 'dark'
                        ? 'border-white/[0.06] hover:border-cyan-500/30 hover:bg-cyan-500/5 text-white/25 hover:text-cyan-400'
                        : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50 text-slate-500 hover:text-cyan-700'
                      }`}
                    onClick={() => setStops([...stops, ""])}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wider">Add Stop</span>
                  </button>
                </div>

                {/* Optimize Button */}
                <button
                  className="btn btn-block mt-7 h-12 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-300 bg-secondary/60 hover:bg-secondary/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait disabled:shadow-none disabled:hover:scale-100"
                  onClick={handleOptimize}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} strokeWidth={2.5} />
                      <span>Optimize Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {routeData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '100ms' }}>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-5 shadow-lg shadow-cyan-500/15">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-2 mb-3">
                    <MapIcon size={12} strokeWidth={2.5} className="opacity-60" />
                    <p className="text-[10px] uppercase font-black tracking-[0.15em] opacity-60">Distance</p>
                  </div>
                  <p className="text-2xl font-black tracking-tight">
                    {(routeData.summary.totalDistance / 1000).toFixed(1)}
                    <span className="text-sm font-bold opacity-50 ml-1">km</span>
                  </p>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '200ms' }}>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-violet-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`relative p-5 shadow-lg overflow-hidden ${theme === 'dark'
                    ? 'bg-[#151b2e] border border-white/[0.06]'
                    : 'bg-white border border-slate-300 shadow-slate-900/8'
                  }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} strokeWidth={2.5} className="text-violet-600 dark:text-violet-400" />
                    <p className={`text-[10px] uppercase font-black tracking-[0.15em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'
                      }`}>Time</p>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-violet-600 dark:text-violet-400">
                    {Math.round(routeData.summary.totalDuration / 60)}
                    <span className={`text-sm font-bold ml-1 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'
                      }`}>min</span>
                  </p>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '300ms' }}>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`relative p-5 shadow-lg overflow-hidden ${theme === 'dark'
                    ? 'bg-[#151b2e] border border-white/[0.06]'
                    : 'bg-white border border-slate-300 shadow-slate-900/8'
                  }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge size={12} strokeWidth={2.5} className="text-amber-600 dark:text-amber-400" />
                    <p className={`text-[10px] uppercase font-black tracking-[0.15em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'
                      }`}>Avg Speed</p>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                    {routeData.summary.totalDuration > 0
                      ? ((routeData.summary.totalDistance / 1000) / (routeData.summary.totalDuration / 3600)).toFixed(0)
                      : 0}
                    <span className={`text-sm font-bold ml-1 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'
                      }`}>km/h</span>
                  </p>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '400ms' }}>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`relative p-5 shadow-lg overflow-hidden ${theme === 'dark'
                    ? 'bg-[#151b2e] border border-white/[0.06]'
                    : 'bg-white border border-slate-300 shadow-slate-900/8'
                  }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={12} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
                    <p className={`text-[10px] uppercase font-black tracking-[0.15em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'
                      }`}>Stops</p>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                    {routeData.optimizedOrder?.length || 0}
                    <span className={`text-sm font-bold ml-1 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'
                      }`}>total</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Optimized Order List */}
          {routeData?.optimizedOrder && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '500ms' }}>
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${theme === 'dark'
                  ? 'bg-[#0d1220]/90 backdrop-blur-xl border-white/[0.06]'
                  : 'bg-white border-slate-300 shadow-slate-900/8'
                }`}>
                <div className={`px-5 py-3 border-b flex items-center gap-2 ${theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
                  }`}>
                  <ArrowRight size={13} className="text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
                  <span className={`text-[10px] uppercase font-black tracking-[0.15em] ${theme === 'dark' ? 'text-white/30' : 'text-slate-500'
                    }`}>Optimized Order</span>
                </div>
                <div className="p-2.5 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  {routeData.optimizedOrder.map((point, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 animate-in fade-in slide-in-from-left-2 ${theme === 'dark' ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'
                      }`} style={{ animationDelay: `${i * 80}ms` }}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${point.isOrigin
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
                        }`}>
                        {point.isOrigin ? 'S' : i}
                      </div>
                      <p className={`text-xs font-medium line-clamp-1 flex-1 ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'
                        }`}>
                        {point.address || `${point.point.lat.toFixed(4)}, ${point.point.lng.toFixed(4)}`}
                      </p>
                      {i < routeData.optimizedOrder.length - 1 && (
                        <ChevronDown size={12} className={`shrink-0 ${theme === 'dark' ? 'text-white/15' : 'text-slate-400'
                          }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ========== MAP ========== */}
        <section className={`lg:col-span-8 xl:col-span-8 relative transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
          <div className="relative h-[500px] lg:h-full min-h-[500px]">
            <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-violet-500/[0.03] rounded-[2rem] blur-2xl pointer-events-none" />

            <div className={`relative h-full overflow-hidden rounded-[1.65rem] shadow-2xl border transition-colors duration-700 ${theme === 'dark'
                ? 'bg-[#0a0f1c] border-white/[0.06] shadow-black/50'
                : 'bg-white border-slate-300 shadow-slate-900/8'
              }`}>
              {/* Map toolbar overlay */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className={`pointer-events-auto px-4 py-2.5 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-2.5 transition-colors duration-500 ${theme === 'dark'
                    ? 'bg-[#0d1220]/80 border-white/[0.08]'
                    : 'bg-white/90 border-slate-300 shadow-slate-900/8'
                  }`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-[10px] uppercase font-black tracking-[0.15em] ${theme === 'dark' ? 'text-white/50' : 'text-slate-600'
                    }`}>
                    {routeData ? 'Route Active' : 'Live Map'}
                  </span>
                </div>
                {routeData && (
                  <div className={`pointer-events-auto px-4 py-2.5 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300 ${theme === 'dark'
                      ? 'bg-[#0d1220]/80 border-white/[0.08]'
                      : 'bg-white/90 border-slate-300 shadow-slate-900/8'
                    }`}>
                    <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <MapIcon size={12} />
                      <span className="text-xs font-black">{(routeData.summary.totalDistance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className={`w-px h-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-300'
                      }`} />
                    <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                      <Clock size={12} />
                      <span className="text-xs font-black">{Math.round(routeData.summary.totalDuration / 60)} min</span>
                    </div>
                  </div>
                )}
              </div>

              <Map center={[23.3219, 42.6977]} zoom={11} mapStyle={mapStyle}>
                <MapControls />

                {routeData?.route?.geometry && (
                  <>
                    <MapSource id="route-glow" type="geojson" data={{ type: "Feature", geometry: routeData.route.geometry }}>
                      <MapLayer
                        id="route-glow-layer"
                        type="line"
                        paint={{
                          "line-color": theme === 'dark' ? "#06b6d4" : "#0891b2",
                          "line-width": 16,
                          "line-opacity": 0.12,
                          "line-blur": 10
                        }}
                      />
                    </MapSource>
                    <MapSource id="route-src" type="geojson" data={{ type: "Feature", geometry: routeData.route.geometry }}>
                      <MapLayer
                        id="route-layer"
                        type="line"
                        paint={{
                          "line-color": theme === 'dark' ? "#06b6d4" : "#0891b2",
                          "line-width": 4,
                          "line-opacity": 0.95,
                          "line-cap": "round",
                          "line-join": "round"
                        }}
                        layout={{
                          "line-cap": "round",
                          "line-join": "round"
                        }}
                      />
                    </MapSource>
                  </>
                )}

                {routeData?.optimizedOrder?.map((point, i) => (
                  <MapMarker key={i} coordinates={[parseFloat(point.point.lng), parseFloat(point.point.lat)]}>
                    <div className="relative group/marker animate-in zoom-in-50 duration-400" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-md scale-150" />
                      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xl ring-[3px] transition-transform duration-200 group-hover/marker:scale-110 ${point.isOrigin
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 ring-emerald-500/40'
                          : 'bg-gradient-to-br from-cyan-500 to-cyan-600 ring-cyan-500/40'
                        }`}>
                        {point.isOrigin ? (
                          <Home size={12} strokeWidth={3} />
                        ) : (
                          i
                        )}
                      </div>
                      {point.isOrigin && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
                      )}
                    </div>
                  </MapMarker>
                ))}
              </Map>

              {/* Empty state overlay */}
              {!routeData && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700 delay-500">
                    <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center transition-colors duration-500 ${theme === 'dark' ? 'bg-white/[0.03]' : 'bg-slate-100'
                      }`}>
                      <Waypoints size={32} strokeWidth={1.2} className={theme === 'dark' ? 'text-white/15' : 'text-slate-400'} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white/30' : 'text-slate-600'
                        }`}>Add stops to see your route</p>
                      <p className={`text-xs font-medium mt-1 transition-colors duration-500 ${theme === 'dark' ? 'text-white/15' : 'text-slate-400'
                        }`}>The optimized path will appear here</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in duration-300 ${theme === 'dark' ? 'bg-[#07090f]/70' : 'bg-white/70'
                  }`}>
                  <div className="text-center space-y-5">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-[3px] border-cyan-500/15" />
                      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-500 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-violet-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      <Zap size={22} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>Finding optimal route...</p>
                      <p className={`text-xs mt-1 transition-colors duration-500 ${theme === 'dark' ? 'text-white/40' : 'text-slate-600'
                        }`}>Analyzing {stops.filter(s => s.trim()).length + 1} locations</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default App;