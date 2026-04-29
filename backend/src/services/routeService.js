import axios from "axios";

const SEGMENT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6"
];

export const getSegmentColor = (index, isReturn) => {
  if (isReturn) return "#6b7280";
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
};

export const optimizeRoute = async (origin, stops, options = {}) => {
  const { optimizeFor = "duration" } = options;
  const allPoints = [origin, ...stops];
  const numPoints = allPoints.length;

  const matrix = await buildDistanceMatrix(allPoints);

  const optimizedOrder = [0];
  const unvisited = new Set(Array.from({ length: numPoints - 1 }, (_, i) => i + 1));
  let currentIndex = 0;

  while (unvisited.size > 0) {
    let nearestIndex = -1;
    let minVal = Infinity;
    for (const nextIndex of unvisited) {
      const val = matrix[currentIndex][nextIndex][optimizeFor];
      if (val < minVal) { minVal = val; nearestIndex = nextIndex; }
    }
    optimizedOrder.push(nearestIndex);
    unvisited.delete(nearestIndex);
    currentIndex = nearestIndex;
  }

  optimizedOrder.push(0);

  const segments = [];
  for (let i = 0; i < optimizedOrder.length - 1; i++) {
    const from = allPoints[optimizedOrder[i]];
    const to = allPoints[optimizedOrder[i + 1]];
    const isReturn = i === optimizedOrder.length - 2;
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    segments.push({
      segmentIndex: i,
      fromIndex: optimizedOrder[i],
      toIndex: optimizedOrder[i + 1],
      isReturn,
      color: getSegmentColor(i, isReturn),
      geometry: res.data.routes[0].geometry,
      distance: res.data.routes[0].distance,
      duration: res.data.routes[0].duration,
    });
  }

  const allCoords = segments.flatMap(s => s.geometry.coordinates);

  return {
    optimizedOrder: optimizedOrder.map((idx, seq) => ({
      sequence: seq,
      index: idx,
      isOrigin: idx === 0,
      point: allPoints[idx]
    })),
    segments,
    route: {
      geometry: { type: "LineString", coordinates: allCoords },
      bbox: getBBox(allCoords)
    },
    summary: {
      totalDistance: segments.reduce((sum, s) => sum + s.distance, 0),
      totalDuration: segments.reduce((sum, s) => sum + s.duration, 0)
    }
  };
};

export const buildDistanceMatrix = async (points) => {
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`;
  const response = await axios.get(url);
  return response.data.distances.map((row, i) =>
    row.map((dist, j) => ({
      distance: dist,
      duration: response.data.durations[i][j]
    }))
  );
};

function getBBox(coords) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}