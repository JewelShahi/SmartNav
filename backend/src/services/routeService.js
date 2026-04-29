import axios from "axios";
import http from "http";
import https from "https";
import NodeCache from "node-cache";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration & Singletons
// ─────────────────────────────────────────────────────────────────────────────

const routeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const pendingRequests = new Map();

// Pre-compute environment checks once
const HAS_ORS_KEY = Boolean(process.env.ORS_API_KEY);
const ORS_HEADERS = HAS_ORS_KEY
  ? {
      Authorization: process.env.ORS_API_KEY,
      "Content-Type": "application/json",
    }
  : null;

// Reusable axios instance with optimized defaults
const httpClient = axios.create({
  timeout: 15000,
  maxRedirects: 3,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

// OSRM instruction templates (pre-compiled)
const OSRM_INSTRUCTIONS = {
  depart: (mod, name) => `Head ${mod || ""} ${name}`.trim(),
  arrive: () => "Arrive at your destination",
  turn: (mod, name) => `Turn ${mod || ""} ${name}`.trim(),
  "new name": (mod, name) => `Continue ${mod || ""} ${name}`.trim(),
  merge: (mod, name) => `Merge ${mod || ""} ${name}`.trim(),
  "on ramp": (mod, name) => `Take the ramp on the ${mod} ${name}`.trim(),
  "off ramp": (mod, name) => `Take the exit on the ${mod} ${name}`.trim(),
  fork: (mod, name) => `Keep ${mod || ""} at the fork ${name}`.trim(),
  roundabout: (_, name) => `Enter the roundabout ${name}`.trim(),
  "exit roundabout": () => "Exit the roundabout",
  rotary: (_, name) => `Enter the rotary ${name}`.trim(),
  "exit rotary": () => "Exit the rotary",
};

// ─────────────────────────────────────────────────────────────────────────────
// Request Deduplication & Caching
// ─────────────────────────────────────────────────────────────────────────────

const deduplicatedRequest = async (key, requestFn) => {
  // Check cache first
  const cached = routeCache.get(key);
  if (cached) {
    console.log(`[Cache] Hit for ${key}`);
    return cached;
  }

  // Deduplicate concurrent identical requests
  if (pendingRequests.has(key)) {
    console.log(`[Dedup] Waiting for pending request: ${key}`);
    return pendingRequests.get(key);
  }

  const promise = requestFn()
    .then((result) => {
      routeCache.set(key, result);
      pendingRequests.delete(key);
      return result;
    })
    .catch((err) => {
      pendingRequests.delete(key);
      throw err;
    });

  pendingRequests.set(key, promise);
  return promise;
};

// ─────────────────────────────────────────────────────────────────────────────
// Distance Matrix (Optimized)
// ─────────────────────────────────────────────────────────────────────────────

const buildDistanceMatrix = async (points) => {
  const cacheKey = `matrix:${points.map((p) => `${p.lat},${p.lng}`).join("|")}`;

  return deduplicatedRequest(cacheKey, async () => {
    if (HAS_ORS_KEY) {
      try {
        return await buildMatrixWithORS(points);
      } catch (err) {
        console.warn("[Matrix] ORS failed, falling back to OSRM:", err.message);
      }
    }
    return await buildMatrixWithOSRM(points);
  });
};

const buildMatrixWithORS = async (points) => {
  const locations = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    locations[i] = [points[i].lng, points[i].lat];
  }

  const { data } = await httpClient.post(
    "https://api.openrouteservice.org/v2/matrix/driving-car",
    { locations, metrics: ["distance", "duration"], units: "km" },
    { headers: ORS_HEADERS },
  );

  const { distances, durations } = data;
  const n = points.length;
  const matrix = new Array(n);

  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n);
    const distRow = distances[i];
    const durRow = durations[i];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = {
        distance: distRow[j] * 1000, // km → meters
        duration: durRow[j],
      };
    }
  }

  console.log(`[Matrix] ORS built ${n}×${n} matrix`);
  return matrix;
};

const buildMatrixWithOSRM = async (points) => {
  // Build coord string efficiently
  const parts = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    parts[i] = `${points[i].lng},${points[i].lat}`;
  }
  const coords = parts.join(";");

  const { data } = await httpClient.get(
    `https://router.project-osrm.org/table/v1/driving/${coords}`,
    { params: { annotations: "distance,duration" } },
  );

  const { durations, distances } = data;
  const n = points.length;
  const hasDistances = Boolean(distances);
  const matrix = new Array(n);

  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n);
    const durRow = durations[i];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = {
        distance: hasDistances ? distances[i][j] : 0,
        duration: durRow[j],
      };
    }
  }

  console.log(`[Matrix] OSRM built ${n}×${n} matrix`);
  return matrix;
};

// ─────────────────────────────────────────────────────────────────────────────
// TSP Solver (Heavily Optimized)
// ─────────────────────────────────────────────────────────────────────────────

const solveTSP = (matrix, optimizeFor = "duration") => {
  const n = matrix.length;

  // Base cases
  if (n <= 1) return [0];
  if (n === 2) return [0, 1];
  if (n === 3) return [0, 1, 2];

  // Pre-extract cost into flat array for faster access
  const useDuration = optimizeFor === "duration";
  const costFlat = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      costFlat[i * n + j] = useDuration
        ? matrix[i][j].duration
        : matrix[i][j].distance;
    }
  }

  const cost = (i, j) => costFlat[i * n + j];

  const totalCost = (tour) => {
    let total = 0;
    for (let i = 0, len = tour.length; i < len; i++) {
      total += cost(tour[i], tour[(i + 1) % len]);
    }
    return total;
  };

  // ── Phase 1: Nearest Neighbor with multiple starts ────────────────────────
  const nearestNeighborTour = (startIdx) => {
    const visited = new Uint8Array(n);
    const tour = new Int32Array(n);
    tour[0] = startIdx;
    visited[startIdx] = 1;

    for (let step = 1; step < n; step++) {
      const current = tour[step - 1];
      const currentOffset = current * n;
      let nearestNode = -1;
      let nearestCost = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const c = costFlat[currentOffset + j];
          if (c < nearestCost) {
            nearestCost = c;
            nearestNode = j;
          }
        }
      }

      tour[step] = nearestNode;
      visited[nearestNode] = 1;
    }
    return Array.from(tour);
  };

  // Try multiple starts (adaptive based on problem size)
  const maxStarts = n <= 10 ? n : n <= 20 ? 5 : 1;
  let bestTour = nearestNeighborTour(0);
  let bestCost = totalCost(bestTour);

  for (let start = 1; start < maxStarts; start++) {
    const tour = nearestNeighborTour(start);
    const c = totalCost(tour);
    if (c < bestCost) {
      bestCost = c;
      bestTour = tour;
    }
  }

  // ── Phase 2: 2-opt with incremental evaluation ───────────────────────────
  const twoOpt = (tour) => {
    const len = tour.length;
    let improved = true;
    let current = tour;
    let currentCost = totalCost(current);

    while (improved) {
      improved = false;

      for (let i = 0; i < len - 1 && !improved; i++) {
        const a = current[i];
        const b = current[i + 1];

        for (let j = i + 2; j < len; j++) {
          // Skip wrap-around edge
          if (i === 0 && j === len - 1) continue;

          const c = current[j];
          const d = current[(j + 1) % len];

          // Incremental cost calculation (avoid full tour recalc)
          const delta = cost(a, c) + cost(b, d) - cost(a, b) - cost(c, d);

          if (delta < -1e-10) {
            // In-place reverse
            let left = i + 1;
            let right = j;
            while (left < right) {
              const tmp = current[left];
              current[left] = current[right];
              current[right] = tmp;
              left++;
              right--;
            }
            currentCost += delta;
            improved = true;
            break;
          }
        }
      }
    }

    return current;
  };

  bestTour = twoOpt(bestTour);
  bestCost = totalCost(bestTour);

  // ── Phase 3: Or-opt with incremental evaluation ──────────────────────────
  const orOpt = (tour) => {
    const len = tour.length;
    let improved = true;

    while (improved) {
      improved = false;

      for (let i = 1; i < len && !improved; i++) {
        const node = tour[i];
        const prev = tour[i - 1];
        const next = tour[(i + 1) % len];

        // Cost of removing node from current position
        const removeCost =
          cost(prev, node) + cost(node, next) - cost(prev, next);

        for (let j = 0; j < len && !improved; j++) {
          // Skip re-insertion at same position
          if (j === i - 1 || j === i) continue;

          const insertAfter = tour[j];
          const insertBefore = tour[(j + 1) % len];

          // Cost of inserting node at new position
          const insertCost =
            cost(insertAfter, node) +
            cost(node, insertBefore) -
            cost(insertAfter, insertBefore);

          const delta = insertCost - removeCost;

          if (delta < -1e-10) {
            // Remove node from position i
            const newTour = new Array(len - 1);
            for (let k = 0; k < i; k++) newTour[k] = tour[k];
            for (let k = i; k < len - 1; k++) newTour[k] = tour[k + 1];

            // Insert at position j+1 (adjusted for removal)
            const insertPos = j >= i ? j : j + 1;
            const result = new Array(len);
            for (let k = 0; k <= insertPos; k++) result[k] = newTour[k];
            result[insertPos + 1] = node;
            for (let k = insertPos + 1; k < len - 1; k++)
              result[k + 1] = newTour[k];

            tour = result;
            improved = true;
          }
        }
      }
    }

    return tour;
  };

  bestTour = orOpt(bestTour);

  // ── Ensure tour starts at index 0 ────────────────────────────────────────
  const originIdx = bestTour.indexOf(0);
  if (originIdx > 0) {
    bestTour = [...bestTour.slice(originIdx), ...bestTour.slice(0, originIdx)];
  }

  console.log(
    `[TSP] n=${n}, cost=${totalCost(bestTour).toFixed(1)} (${optimizeFor})`,
  );
  return bestTour;
};

// ─────────────────────────────────────────────────────────────────────────────
// Detailed Route (Optimized)
// ─────────────────────────────────────────────────────────────────────────────

const getDetailedRoute = async (waypoints) => {
  const cacheKey = `route:${waypoints.map((p) => `${p.lat},${p.lng}`).join("|")}`;

  return deduplicatedRequest(cacheKey, async () => {
    if (HAS_ORS_KEY) {
      try {
        return await getRouteWithORS(waypoints);
      } catch (err) {
        console.warn("[Route] ORS failed, falling back to OSRM:", err.message);
      }
    }
    return await getRouteWithOSRM(waypoints);
  });
};

const getRouteWithORS = async (waypoints) => {
  const coordinates = new Array(waypoints.length);
  for (let i = 0; i < waypoints.length; i++) {
    coordinates[i] = [waypoints[i].lng, waypoints[i].lat];
  }

  const { data } = await httpClient.post(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      coordinates,
      instructions: true,
      geometry_simplify: false,
      units: "km",
    },
    { headers: ORS_HEADERS, timeout: 20000 },
  );

  const feature = data.features[0];
  const { summary, segments } = feature.properties;

  // Pre-allocate steps array with known size
  let stepCount = 0;
  for (let i = 0; i < segments.length; i++) {
    stepCount += segments[i].steps.length;
  }

  const steps = new Array(stepCount);
  let stepIdx = 0;

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segSteps = segments[segIdx].steps;
    for (let s = 0; s < segSteps.length; s++) {
      const step = segSteps[s];
      steps[stepIdx++] = {
        instruction: step.instruction,
        distance: step.distance * 1000,
        duration: step.duration,
        type: step.type,
        name: step.name || "",
        waypointIndex: segIdx,
      };
    }
  }

  return {
    geometry: feature.geometry,
    totalDistance: summary.distance * 1000,
    totalDuration: summary.duration,
    steps,
    provider: "ors",
  };
};

const getRouteWithOSRM = async (waypoints) => {
  const parts = new Array(waypoints.length);
  for (let i = 0; i < waypoints.length; i++) {
    parts[i] = `${waypoints[i].lng},${waypoints[i].lat}`;
  }

  const { data } = await httpClient.get(
    `https://router.project-osrm.org/route/v1/driving/${parts.join(";")}`,
    {
      params: {
        overview: "full",
        geometries: "geojson",
        steps: true,
        annotations: false,
      },
      timeout: 20000,
    },
  );

  const route = data.routes[0];
  const legs = route.legs;

  // Pre-allocate steps
  let stepCount = 0;
  for (let i = 0; i < legs.length; i++) {
    stepCount += legs[i].steps.length;
  }

  const steps = new Array(stepCount);
  let stepIdx = 0;

  for (let legIdx = 0; legIdx < legs.length; legIdx++) {
    const legSteps = legs[legIdx].steps;
    for (let s = 0; s < legSteps.length; s++) {
      const step = legSteps[s];
      const { type, modifier } = step.maneuver;
      const builder = OSRM_INSTRUCTIONS[type];
      const name = step.name ? `onto ${step.name}` : "";

      steps[stepIdx++] = {
        instruction:
          step.maneuver.instruction ||
          (builder
            ? builder(modifier, name)
            : `${type} ${modifier || ""} ${name}`.trim()),
        distance: step.distance,
        duration: step.duration,
        type,
        modifier,
        name: step.name || "",
        waypointIndex: legIdx,
      };
    }
  }

  return {
    geometry: route.geometry,
    totalDistance: route.distance,
    totalDuration: route.duration,
    steps,
    provider: "osrm",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Orchestrator (Optimized)
// ─────────────────────────────────────────────────────────────────────────────

const optimizeRoute = async (origin, stops, options = {}) => {
  const { optimizeFor = "duration", roundTrip = true } = options;

  // Early validation
  if (!origin?.lat || !origin?.lng) {
    throw new Error("Origin coordinates are required");
  }
  if (!stops?.length) {
    throw new Error("At least one stop is required");
  }

  const startTime = Date.now();
  const stopCount = stops.length;
  console.log(`[Optimize] Starting: 1 origin + ${stopCount} stops`);

  // Build all points array efficiently
  const allPoints = new Array(stopCount + 1);
  allPoints[0] = origin;
  for (let i = 0; i < stopCount; i++) {
    allPoints[i + 1] = stops[i];
  }

  // Build distance matrix
  const matrix = await buildDistanceMatrix(allPoints);

  // Solve TSP
  const optimizedOrder = solveTSP(matrix, optimizeFor);

  // Build ordered points
  const orderedPoints = new Array(optimizedOrder.length);
  for (let i = 0; i < optimizedOrder.length; i++) {
    orderedPoints[i] = allPoints[optimizedOrder[i]];
  }

  // Build route waypoints
  const routeWaypoints = roundTrip ? [...orderedPoints, origin] : orderedPoints;

  // Get detailed route
  const detailedRoute = await getDetailedRoute(routeWaypoints);

  // Build legs summary
  const legs = [];
  const orderLen = optimizedOrder.length;

  for (let i = 0; i < orderLen - 1; i++) {
    const fromIdx = optimizedOrder[i];
    const toIdx = optimizedOrder[i + 1];
    legs.push({
      from: fromIdx === 0 ? "origin" : `stop_${fromIdx - 1}`,
      to: toIdx === 0 ? "origin" : `stop_${toIdx - 1}`,
      distance: matrix[fromIdx][toIdx].distance,
      duration: matrix[fromIdx][toIdx].duration,
    });
  }

  if (roundTrip) {
    const lastIdx = optimizedOrder[orderLen - 1];
    legs.push({
      from: lastIdx === 0 ? "origin" : `stop_${lastIdx - 1}`,
      to: "origin",
      distance: matrix[lastIdx][0].distance,
      duration: matrix[lastIdx][0].duration,
    });
  }

  // Build optimized order result
  const optimizedOrderResult = new Array(orderLen);
  for (let i = 0; i < orderLen; i++) {
    const idx = optimizedOrder[i];
    optimizedOrderResult[i] = {
      index: idx,
      isOrigin: idx === 0,
      stopIndex: idx === 0 ? null : idx - 1,
      point: allPoints[idx],
    };
  }

  const elapsed = Date.now() - startTime;
  console.log(`[Optimize] Done in ${elapsed}ms`);

  return {
    optimizedOrder: optimizedOrderResult,
    route: detailedRoute,
    legs,
    summary: {
      totalDistance: detailedRoute.totalDistance,
      totalDuration: detailedRoute.totalDuration,
      stopCount,
      roundTrip,
      optimizedFor: optimizeFor,
      processingTimeMs: elapsed,
    },
  };
};

export { optimizeRoute, buildDistanceMatrix, solveTSP };
