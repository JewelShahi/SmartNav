import * as React from "react";
import MapLibre, {
  NavigationControl,
  Marker,
  Source,
  Layer,
  useMap,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import SEG_COLORS from  "../colors/segColor";

/* ─────────────────────────────────────────────────────────────
   Segment colour palette — exported so App & RouteSummary share
   ───────────────────────────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────────
   Map
   ───────────────────────────────────────────────────────────── */
export const Map = React.forwardRef(
  (
    {
      className = "",
      center = [0, 0],
      zoom = 12,
      // mapStyle = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      mapStyle = "https://tiles.openfreemap.org/styles/bright",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef(null);

    React.useImperativeHandle(ref, () => ({
      fitBounds: (...args) => internalRef.current?.getMap()?.fitBounds(...args),
      flyTo: (...args) => internalRef.current?.getMap()?.flyTo(...args),
      getMap: () => internalRef.current?.getMap(),
    }));

    return (
      <MapLibre
        ref={internalRef}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom,
        }}
        mapStyle={mapStyle}
        scrollZoom
        doubleClickZoom
        touchZoomRotate
        dragPan
        dragRotate={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", ...style }}
        className={className}
        {...props}
      >
        {children}

        <div className="absolute bottom-2 right-2 z-10 text-[9px] text-black/30 dark:text-white/25 font-medium select-none pointer-events-none">
          © CARTO · © OpenStreetMap
        </div>
      </MapLibre>
    );
  }
);
Map.displayName = "Map";

/* ─────────────────────────────────────────────────────────────
   MapControls
   ───────────────────────────────────────────────────────────── */
export const MapControls = () => (
  <NavigationControl
    position="top-right"
    showCompass={false}
    style={{
      marginTop: "16px",
      marginRight: "16px",
    }}
  />
);

/* ─────────────────────────────────────────────────────────────
   RouteLayer
   ───────────────────────────────────────────────────────────── */
export const RouteLayer = ({
  id,
  geometry,
  color = "#3b82f6",
  width = 5,
  dashed = false,
  opacity = 0.95,
  isReturn = false,
}) => {
  if (!geometry) return null;

  const geojson = React.useMemo(() => ({ type: "Feature", geometry }), [geometry]);

  if (isReturn) {
    return (
      <Source id={id} type="geojson" data={geojson}>
        <Layer
          id={`${id}-line`}
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": "#1f2937",
            "line-width": 2.5,
            "line-opacity": 0.7,
            "line-dasharray": [4, 4],
          }}
        />
      </Source>
    );
  }

  return (
    <Source id={id} type="geojson" data={geojson}>
      <Layer
        id={`${id}-glow`}
        type="line"
        paint={{
          "line-color": color,
          "line-width": width * 4,
          "line-opacity": 0.07,
          "line-blur": 12,
        }}
      />
      <Layer
        id={`${id}-outline`}
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": "#ffffff",
          "line-width": dashed ? width + 1.5 : width + 2.5,
          "line-opacity": 0.75,
        }}
      />
      <Layer
        id={`${id}-line`}
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": color,
          "line-width": width,
          "line-opacity": opacity,
          ...(dashed ? { "line-dasharray": [6, 5] } : {}),
        }}
      />
    </Source>
  );
};

/* ─────────────────────────────────────────────────────────────
   RouteMarker — Google Maps style with FULL DETAILS on hover
   ───────────────────────────────────────────────────────────── */
export const RouteMarker = ({
  longitude,
  latitude,
  label,
  color = "#3b82f6",
  isOrigin = false,
  address = "",
}) => {
  const [hovered, setHovered] = React.useState(false);
  
  // Short address for the clean inline pill
  const short = address ? address.split(",")[0] : "";
  // FULL address for the detailed tooltip (nothing skipped)
  const full = address || "";

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <div
        className="relative flex flex-col items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── DETAILED TOOLTIP (Shows EVERYTHING) ── */}
        {hovered && full && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 w-max max-w-[300px]">
            <div
              className="text-white text-[11px] font-semibold px-3 py-2 rounded-xl shadow-2xl text-center break-words leading-relaxed"
              style={{ background: color }}
            >
              {full}
            </div>
            {/* Caret */}
            <div
              className="mx-auto mt-0.5"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `5px solid ${color}`,
              }}
            />
          </div>
        )}

        {/* ── FLOATING LABEL PILL ── */}
        <div
          className="relative flex items-center rounded-xl shadow-2xl border border-white/60 backdrop-blur-sm transition-all duration-200 overflow-hidden h-8"
          style={{
            background: isOrigin ? color : "white",
            boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
            transform: hovered ? "scale(1.05) translateY(-2px)" : "scale(1)",
          }}
        >
          {/* Number Circle */}
          <div
            className="flex items-center justify-center font-black text-white select-none shrink-0 h-full px-2"
            style={{
              background: isOrigin ? "white" : color,
              color: isOrigin ? color : "white",
              fontSize: 12,
            }}
          >
            {label}
          </div>

          {/* Short Address Text (Expands smoothly on hover) */}
          <span
            className="text-xs font-semibold whitespace-nowrap transition-all duration-200 overflow-hidden h-full flex items-center"
            style={{
              color: isOrigin ? "white" : "#374151",
              maxWidth: hovered ? 200 : 0,
              opacity: hovered ? 1 : 0,
              marginLeft: hovered ? 8 : 0,
              paddingRight: hovered ? 10 : 0,
            }}
          >
            {short}
          </span>
        </div>

        {/* ── DOTTED LINE TO GROUND ── */}
        <div
          className="w-px my-0.5"
          style={{
            height: 20,
            backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0, ${color} 2px, transparent 2px, transparent 6px)`,
          }}
        />

        {/* ── EXACT POINT DOT ── */}
        <div
          className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-md"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </Marker>
  );
};

/* ─────────────────────────────────────────────────────────────
   ResizableMapShell
   ───────────────────────────────────────────────────────────── */
export const ResizableMapShell = ({
  children,
  minH = 320,
  maxH = 900,
  defaultH = 520,
  className = "",
}) => {
  const [height, setHeight] = React.useState(defaultH);
  const drag = React.useRef({ active: false, startY: 0, startH: 0 });

  const onMouseDown = React.useCallback(
    (e) => {
      e.preventDefault();
      drag.current = { active: true, startY: e.clientY, startH: height };
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [height]
  );

  React.useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.active) return;
      const next = Math.max(minH, Math.min(maxH, drag.current.startH + e.clientY - drag.current.startY));
      setHeight(next);
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [minH, maxH]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl relative transition-shadow duration-200"
        style={{ height }}
      >
        {children}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="flex items-center justify-center h-6 cursor-ns-resize group select-none"
        title="Drag to resize"
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-300/50 group-hover:bg-primary/15 transition-colors duration-200">
          <svg width="16" height="6" viewBox="0 0 16 6" fill="none" className="text-base-content/30 group-hover:text-primary transition-colors">
            <rect x="0" y="0" width="16" height="1.5" rx="1" fill="currentColor" />
            <rect x="0" y="4" width="16" height="1.5" rx="1" fill="currentColor" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-widest text-base-content/25 group-hover:text-primary/60 transition-colors">
            resize
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Primitive pass-throughs
   ───────────────────────────────────────────────────────────── */
export const MapMarker = Marker;
export const MapSource = Source;
export const MapLayer = Layer;