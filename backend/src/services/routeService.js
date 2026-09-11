import axios from "axios";

const SEGMENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#f97316', '#84cc16', '#ec4899',
  '#14b8a6', '#06b6d4',
];

export const getSegmentColor = (index, isReturn) => {
  if (isReturn) return "#6b7280";
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
};

/**
 * Nearest Neighbor heuristic - produces the initial upper bound for B&B.
 * Returns the tour as an array of point indices (origin -> ... -> origin).
 */
const nearestNeighborTour = (matrix, numPoints, optimizeFor) => {
  const order = [0];
  const unvisited = new Set(Array.from({ length: numPoints - 1 }, (_, i) => i + 1));
  let current = 0;

  while (unvisited.size > 0) {
    let nearest = -1;
    let minVal = Infinity;
    for (const next of unvisited) {
      const val = matrix[current][next][optimizeFor];
      if (val < minVal) { minVal = val; nearest = next; }
    }
    order.push(nearest);
    unvisited.delete(nearest);
    current = nearest;
  }

  order.push(0);
  return order;
}

/**
 * Lower-bound estimator for B&B.
 * For each unvisited node (+ the current node), adds the cheapest edge
 * leaving it. This is admissible (never overestimates the true cost).
 */
const lowerBound = (matrix, partialCost, visited, currentNode, optimizeFor) => {
  let bound = partialCost;
  const numPoints = matrix.length;

  // Min outgoing edge from current node to any unvisited node
  let minFromCurrent = Infinity;
  for (let j = 0; j < numPoints; j++) {
    if (!visited.has(j)) {
      minFromCurrent = Math.min(minFromCurrent, matrix[currentNode][j][optimizeFor]);
    }
  }
  if (minFromCurrent === Infinity) minFromCurrent = 0;
  bound += minFromCurrent;

  // Min outgoing edge from each remaining unvisited node
  for (let i = 0; i < numPoints; i++) {
    if (visited.has(i) || i === currentNode) continue;
    let minEdge = Infinity;
    for (let j = 0; j < numPoints; j++) {
      if (i !== j && (!visited.has(j) || j === 0)) {
        minEdge = Math.min(minEdge, matrix[i][j][optimizeFor]);
      }
    }
    if (minEdge !== Infinity) bound += minEdge;
  }

  return bound;
}

/**
 * Branch and Bound TSP — exact solver with NN as the initial upper bound.
 * Falls back gracefully to NN result for large inputs (> 10 stops).
 */
function branchAndBound(matrix, optimizeFor) {
  const numPoints = matrix.length;

  // NN gives us a strong initial upper bound immediately
  const nnTour = nearestNeighborTour(matrix, numPoints, optimizeFor);
  let bestCost = nnTour
    .slice(0, -1)
    .reduce((sum, node, i) => sum + matrix[node][nnTour[i + 1]][optimizeFor], 0);
  let bestTour = [...nnTour];

  // B&B only pays off up to ~10 stops; beyond that NN is already fast and accurate
  if (numPoints > 11) return bestTour;

  // Stack-based DFS branch and bound
  const stack = [{
    path: [0],
    visited: new Set([0]),
    currentCost: 0,
    currentNode: 0,
  }];

  while (stack.length > 0) {
    const { path, visited, currentCost, currentNode } = stack.pop();

    // All nodes visited - close the tour back to origin
    if (visited.size === numPoints) {
      const totalCost = currentCost + matrix[currentNode][0][optimizeFor];
      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestTour = [...path, 0];
      }
      continue;
    }

    // Expand children in NN order (visit most-promising branches first)
    const children = [];
    for (let next = 0; next < numPoints; next++) {
      if (visited.has(next)) continue;
      const edgeCost = matrix[currentNode][next][optimizeFor];
      const newCost = currentCost + edgeCost;
      const newVisited = new Set(visited);
      newVisited.add(next);
      const lb = lowerBound(matrix, newCost, newVisited, next, optimizeFor);
      if (lb < bestCost) {
        children.push({ next, newCost, newVisited, lb });
      }
    }

    // Push in reverse-NN order so stack pops the nearest neighbor first
    children.sort((a, b) => b.lb - a.lb);
    for (const { next, newCost, newVisited } of children) {
      stack.push({
        path: [...path, next],
        visited: newVisited,
        currentCost: newCost,
        currentNode: next,
      });
    }
  }

  return bestTour;
}

/**
 * Optimized Route Calculation
 */
export const optimizeRoute = async (origin, stops, options = {}) => {
  const { optimizeFor = "duration" } = options;
  const allPoints = [origin, ...stops];
  const numPoints = allPoints.length;

  // Build Distance Matrix via OSRM
  const matrix = await buildDistanceMatrix(allPoints);

  // Branch and Bound TSP (NN-seeded, exact up to 10 stops)
  const optimizedOrder = branchAndBound(matrix, optimizeFor);

  // Get Geometry for segments
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

const getBBox = (coords) => {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}
