import * as React from "react";
import MapLibre, { NavigationControl, Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const Map = React.forwardRef(({ className, children, ...props }, ref) => (
  <MapLibre
    ref={ref}
    // Using free CARTO tiles (Voyager)
    mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    {...props}
    style={{ width: "100%", height: "100%", ...props.style }}
  >
    {children}
  </MapLibre>
));
Map.displayName = "Map";

const MapControls = () => (
  <div className="absolute top-4 right-4 z-10">
    <NavigationControl showCompass={false} />
  </div>
);

const MapMarker = Marker;
const MapSource = Source;
const MapLayer = Layer;

export { Map, MapControls, MapMarker, MapSource, MapLayer };