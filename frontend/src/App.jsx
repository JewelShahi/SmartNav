import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer.jsx';
import { Map, MapControls, MapMarker, MapSource, MapLayer, MarkerLeader } from './components/ui/map';
import { RouteService } from './api/services';
import { AddressInput } from './components/ui/AddressInput';
import { RouteSummary } from './components/ui/RouteSummary';
import { useTheme } from "./hooks/ThemeContext";
import {
  Plus, Zap, X, Trash2, Navigation, Home, Save,
  Route, Loader2, RotateCcw, CheckCircle2,
  Waypoints, MapPin, Clock, TrendingUp, Target,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import SEG_COLORS from './components/colors/segColor';

const safeCoord = (val) => {
  const n = parseFloat(val);
  return isFinite(n) ? n : null;
};

/* ─────────────────────────────────────────────────────────────
   StopMarker Component
   Using React State instead of CSS group-hover guarantees it works.
──────────────────────────────────────────────────────────── */
const StopMarker = ({ point, index, color, isOrigin }) => {
  const [hovered, setHovered] = useState(false);

  const fullAddress = point.address || point.label || "Point";
  const shortAddress = fullAddress;

  const lng = safeCoord(point.point?.lng);
  const lat = safeCoord(point.point?.lat);
  if (lng === null || lat === null) return null;

  return (
    <MapMarker longitude={lng} latitude={lat} anchor="bottom">
      <div
        className="relative flex flex-col items-center cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── DETAILED HOVER TOOLTIP ── */}
        {hovered && (point.address || point.label) && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none w-max max-w-[420px]">
            <div
              className="text-white text-[12px] font-semibold px-3 py-2 rounded-xl shadow-2xl"
              style={{ background: color }}
            >
              {point.address ?? point.label}
            </div>
          </div>
        )}

        {/* ── FLOATING PILL PIN ── */}
        <div
          className="flex items-center justify-center font-black text-white select-none shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: color,
            color: "white",
            fontSize: 12,
          }}
        >
          {isOrigin ? <Home size={13} strokeWidth={2.5} /> : index}
        </div>

        {/* ── DOTTED DROP LINE TO GROUND ── */}
        <div
          className="w-px my-0.5"
          style={{
            height: 20,
            backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0, ${color} 2px, transparent 2px, transparent 6px)`,
          }}
        />

        {/* ── EXACT COORDINATE DOT ── */}
        <div
          className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-md"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </MapMarker>
  );
};


/* ─────────────────────────────
   App
───────────────────────────── */
const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [origin, setOrigin] = useState('');
  const [stops, setStops] = useState(['']);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedStart, setSavedStart] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef();

  const mapStyle = theme === 'dark'
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('userDefaultStart');
    if (saved) { setSavedStart(saved); setIsSaved(true); }
  }, []);

  const addStop = () => stops.length < 10 ? setStops(s => [...s, '']) : toast.error('Maximum 10 stops');
  const removeStop = (i) => { const n = stops.filter((_, x) => x !== i); setStops(n.length ? n : ['']); };

  const handleSaveStart = () => {
    if (!origin.trim()) return toast.error('Enter an address first');
    localStorage.setItem('userDefaultStart', origin.trim());
    setSavedStart(origin.trim()); setIsSaved(true);
    toast.success('Starting point saved!');
  };
  const handleLoadSaved = () => savedStart && setOrigin(savedStart);
  const handleClearSaved = (e) => {
    e.stopPropagation();
    localStorage.removeItem('userDefaultStart');
    setSavedStart(''); setIsSaved(false);
    toast.success('Saved location cleared');
  };

  const handleOptimize = async () => {
    if (!origin.trim()) return toast.error('Please enter a starting point');
    if (!stops.some(s => s.trim())) return toast.error('Please add at least one stop');
    setLoading(true); setRouteData(null);
    const t0 = Date.now();
    try {
      const data = await RouteService.optimize(origin, stops, false);
      setRouteData(data);

      if (data.optimizedOrder?.length > 1) {
        const optimizedStops = data.optimizedOrder
          .filter(p => !p.isOrigin)
          .map(p => p.address || p.label || '');

        const filledCount = stops.filter(s => s.trim()).length;
        if (optimizedStops.length === filledCount && optimizedStops.every(s => s.trim())) {
          setStops(optimizedStops);
        }
      }

      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      toast.success(`Done in ${secs}s · ${(data.summary.totalDistance / 1000).toFixed(1)} km · ${Math.round(data.summary.totalDuration / 60)} min`, { duration: 4000 });
      if (data.route?.bbox) mapRef.current?.fitBounds(data.route.bbox, { padding: 70, duration: 900 });
    } catch (err) {
      console.error(err);
      toast.error('Optimization failed — check your addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setOrigin(''); setStops(['']); setRouteData(null); };
  const filledStops = stops.filter(s => s.trim()).length;

  return (
    <div data-theme={theme} className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!rounded-2xl !text-sm !font-medium !bg-base-200 !text-base-content !border !border-base-300 shadow-lg'
        }}
      />
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <main
        className={`flex-grow justify-center p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-3
          transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* ── SIDEBAR ── */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="card bg-base-100 shadow-xl border border-base-300 rounded-3xl overflow-visible h-full">
            <div className="card-body p-4 lg:p-5 space-y-4 h-full flex flex-col justify-between bg-base-200/40">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5">
                    <img
                      src="/app-logo.png"
                      alt="SmartNav Logo"
                      className={`relative w-9 h-9 object-contain`}
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-black tracking-tight text-base-content uppercase">Smart<span className="text-primary">Nav</span></h1>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-base-content/35">Route Optimizer</p>
                  </div>
                </div>
                {(routeData || origin || filledStops > 0) && (
                  <button onClick={handleReset} className="btn btn-ghost btn-circle btn-sm text-base-content/25 hover:text-error hover:bg-error/10">
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-base-content/40">
                    <Home size={9} className="text-success" /> Starting Point
                  </label>
                  <div className="flex items-center gap-1">
                    {isSaved && (
                      <button onClick={handleLoadSaved} className="btn btn-ghost btn-xs gap-1 text-primary font-bold h-6 min-h-0 rounded-xl">
                        <Navigation size={9} /> Load
                      </button>
                    )}
                    <button onClick={handleSaveStart} className={`btn btn-ghost btn-xs gap-1 font-bold h-6 min-h-0 rounded-xl ${isSaved ? 'text-success' : 'text-primary'}`}>
                      {isSaved ? <CheckCircle2 size={9} /> : <Save size={9} />}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                    {isSaved && (
                      <button onClick={handleClearSaved} className="btn btn-ghost btn-xs h-6 min-h-0 rounded-xl text-base-content/20 hover:text-error">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>

                <AddressInput value={origin} onChange={setOrigin} placeholder="Starting address…" />

                {isSaved && savedStart && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-success/5 border border-success/20 text-success/70 text-[11px] font-medium">
                    <CheckCircle2 size={10} className="shrink-0" />
                    <span className="truncate">{savedStart}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-base-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-base-content/30 flex items-center gap-1.5">
                  Destinations
                  {filledStops > 0 && <span className="badge badge-primary badge-xs font-black px-1.5">{filledStops}</span>}
                </span>
                <div className="flex-1 h-px bg-base-300" />
              </div>

              <div className="space-y-2 overflow-visible">
                {stops.map((stop, i) => (
                  <div key={i} className="group/stop flex items-center gap-2 animate-in fade-in duration-200">
                    <div
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black select-none"
                      style={{
                        background: `${SEG_COLORS[i % SEG_COLORS.length]}18`,
                        color: SEG_COLORS[i % SEG_COLORS.length],
                        boxShadow: `0 0 0 1.5px ${SEG_COLORS[i % SEG_COLORS.length]}35`,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <AddressInput
                        value={stop}
                        onChange={(v) => { const n = [...stops]; n[i] = v; setStops(n); }}
                        placeholder={`Stop #${i + 1}`}
                      />
                    </div>
                    {stops.length > 1 && (
                      <button
                        onClick={() => removeStop(i)}
                        className="shrink-0 btn btn-ghost btn-circle btn-xs opacity-0 group-hover/stop:opacity-100 text-base-content/20 hover:text-error hover:bg-error/10 transition-all"
                      >
                        <Trash2 size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addStop}
                className="btn btn-ghost btn-block btn-sm border-2 border-dashed border-base-300 hover:border-primary hover:bg-primary/5 text-base-content/30 hover:text-primary gap-2 rounded-2xl"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span className="text-xs font-bold uppercase tracking-wider">Add Stop</span>
              </button>

              <button
                onClick={handleOptimize}
                disabled={loading}
                className={`btn btn-primary btn-block gap-2 shadow-lg shadow-primary/25 rounded-2xl font-bold ${theme === 'dark' ? 'text-black' : 'text-white'}`}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} strokeWidth={2.5} />}
                {loading ? 'Optimizing…' : 'Optimize Route'}
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAP ── */}
        <section className="lg:col-span-8 xl:col-span-9">
          <div
            className="rounded-2xl border border-base-300 bg-base-100 shadow-xl relative overflow-hidden"
            style={{ height: 540 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-base-100/90 border border-base-300 shadow backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-warning animate-pulse' : routeData ? 'bg-success animate-pulse' : 'bg-base-content/20'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-base-content/40">
                {loading ? 'Processing…' : routeData ? 'Route Active' : 'Live Map'}
              </span>
            </div>

            <Map
              ref={mapRef}
              center={[23.3219, 42.6977]}
              zoom={12}
              maxZoom={20}
              mapStyle={mapStyle}
              className="w-full h-full"
            >
              <MapControls />

              {/* ── ROUTE SEGMENTS ── */}
              {routeData?.segments?.map((seg, i) => {
                if (seg.isReturn) {
                  return (
                    <MapSource key={`ret-${i}`} id={`ret-${i}`} type="geojson" data={{ type: 'Feature', geometry: seg.geometry }}>
                      <MapLayer id={`ret-line-${i}`} type="line"
                        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                        paint={{ 'line-color': (theme === 'dark') ? '#ffffff' : '#000000', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [4, 4] }}
                      />
                    </MapSource>
                  );
                }

                return (
                  <MapSource key={`seg-${i}`} id={`seg-${i}`} type="geojson" data={{ type: 'Feature', geometry: seg.geometry }}>
                    <MapLayer id={`glow-${i}`} type="line"
                      paint={{ 'line-color': seg.color ?? SEG_COLORS[i % SEG_COLORS.length], 'line-width': 30, 'line-opacity': 0.08, 'line-blur': 12 }}
                    />
                    <MapLayer id={`out-${i}`} type="line"
                      layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                      paint={{ 'line-color': '#ffffff', 'line-width': 12, 'line-opacity': 0.7 }}
                    />
                    <MapLayer id={`line-${i}`} type="line"
                      layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                      paint={{ 'line-color': seg.color ?? SEG_COLORS[i % SEG_COLORS.length], 'line-width': 10, 'line-opacity': 0.95 }}
                    />
                  </MapSource>
                );
              })}

              {/* ── MARKER LEADERS (route end → pin) ── */}
              {routeData?.segments?.map((seg, i) => {
                if (seg.isReturn) return null;
                const dest = routeData.optimizedOrder[seg.toIndex];
                if (!dest?.point) return null;
                return (
                  <MarkerLeader
                    key={`leader-${i}`}
                    id={`leader-${i}`}
                    from={seg.geometry.coordinates.at(-1)}
                    to={[dest.point.lng, dest.point.lat]}
                    color={seg.color ?? SEG_COLORS[i % SEG_COLORS.length]}
                  />
                );
              })}

              {/* ── ORIGIN LEADER (start of first segment → origin pin) ── */}
              {routeData?.segments?.[0] && routeData?.optimizedOrder?.[0]?.point && (
                <MarkerLeader
                  id="leader-origin"
                  from={routeData.segments[0].geometry.coordinates[0]}
                  to={[routeData.optimizedOrder[0].point.lng, routeData.optimizedOrder[0].point.lat]}
                  color="#ef4444"
                />
              )}

              {/* ── MARKERS (Using new StopMarker component) ── */}
              {routeData?.optimizedOrder?.map((point, i) => {
                if (point.isOrigin && i !== 0) return null;

                const color = point.isOrigin ? '#ef4444' : SEG_COLORS[(i - 1 + SEG_COLORS.length) % SEG_COLORS.length];

                return (
                  <StopMarker
                    key={i}
                    point={point}
                    index={i}
                    color={color}
                    isOrigin={point.isOrigin}
                  />
                );
              })}
            </Map>

            {!routeData && !loading && (
              <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                <div className="text-center space-y-2 animate-in fade-in zoom-in duration-700 delay-300">
                  <div className="flex items-center justify-center mx-auto rounded-2xl bg-base-100/90 border border-base-300 shadow backdrop-blur-sm" style={{ width: 50, height: 50 }}>
                    <Waypoints size={22} strokeWidth={1.2} className="text-base-content/25" />
                  </div>
                  <p className="text-sm font-semibold text-base-content/30 bg-base-100/80 backdrop-blur-sm px-3 py-1 rounded-xl border border-base-200">
                    Add stops to see your optimized route
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-base-100/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="text-sm font-bold text-base-content">
                    Finding optimal route…
                  </p>
                  <p className="text-xs text-base-content/40">
                    Analysing {stops.filter(s => s.trim()).length + 1} locations
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div className={`lg:col-span-12 transition-all duration-500 ${routeData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {routeData && <RouteSummary data={routeData} />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;