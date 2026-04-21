/**
 * Triangulation Module - Delaunay TIN
 * Algorithme de Bowyer-Watson pour génération MNT
 */

import { Point } from '../../types';

export interface Triangle {
  a: number;
  b: number;
  c: number;
}

export interface TriangulationResult {
  triangles: Triangle[];
  points: Point[];
  statistics: {
    triangleCount: number;
    averageArea: number;
    minAngle: number;
  };
}

/** Créer le supertriangle pour l'algorithme */
function createSuperTriangle(points: Point[]): [Point, Point, Point] {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  const range = Math.max(maxX - minX, maxY - minY);
  
  return [
    { x: minX - range, y: minY - range },
    { x: minX + (maxX - minX) / 2, y: minY - range * 2 },
    { x: maxX + range, y: maxY + range },
  ];
}

/** Circumcercle d'un triangle */
function circumCircle(
  p1: Point, p2: Point, p3: Point
): { center: Point; radiusSquared: number } {
  const D = 2 * (
    p1.x * (p2.y - p3.y) +
    p2.x * (p3.y - p1.y) +
    p3.x * (p1.y - p2.y)
  );
  
  const center = {
    x: (
      (p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) +
      (p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) +
      (p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)
    ) / D,
    y: (
      (p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) +
      (p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) +
      (p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)
    ) / D,
  };
  
  const dx = p1.x - center.x;
  const dy = p1.y - center.y;
  
  return { center, radiusSquared: dx * dx + dy * dy };
}

/** Vérifie si un point est dans le circumcercle */
function inCircumcircle(point: Point, p1: Point, p2: Point, p3: Point): boolean {
  const { center, radiusSquared } = circumCircle(p1, p2, p3);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy < radiusSquared;
}

/** Algorithme de Bowyer-Watson - Delaunay */
export function delaunayTriangulation(
  points: Point[],
  constraints?: Point[][]
): TriangulationResult {
  if (points.length < 3) {
    return {
      triangles: [],
      points,
      statistics: { triangleCount: 0, averageArea: 0, minAngle: 0 },
    };
  }
  
  const superTri = createSuperTriangle(points);
  const allPoints = [...points, ...superTri];
  const n = points.length;
  const superIndices = [n, n + 1, n + 2];
  
  let triangles: Triangle[] = [{ a: n, b: n + 1, c: n + 2 }];
  
  for (let i = 0; i < n; i++) {
    const point = points[i];
    const badTriangles: number[] = [];
    
    for (let j = 0; j < triangles.length; j++) {
      const tri = triangles[j];
      if (inCircumcircle(point, allPoints[tri.a], allPoints[tri.b], allPoints[tri.c])) {
        badTriangles.push(j);
      }
    }
    
    const polygon: { a: number; b: number }[] = [];
    
    for (const triIndex of badTriangles) {
      const tri = triangles[triIndex];
      polygon.push({ a: tri.a, b: tri.b });
      polygon.push({ a: tri.b, b: tri.c });
      polygon.push({ a: tri.c, b: tri.a });
    }
    
    // Supprimer triangles invalides
    for (let j = badTriangles.length - 1; j >= 0; j--) {
      triangles.splice(badTriangles[j], 1);
    }
    
    // Retirer arêtes dupliquées
    const uniqueEdges: { a: number; b: number }[] = [];
    for (const edge of polygon) {
      const isDuplicate = uniqueEdges.some(
        e => (e.a === edge.a && e.b === edge.b) ||
             (e.a === edge.b && e.b === edge.a)
      );
      if (!isDuplicate) uniqueEdges.push(edge);
    }
    
    // Créer nouveaux triangles
    for (const edge of uniqueEdges) {
      triangles.push({ a: edge.a, b: edge.b, c: i });
    }
  }
  
  // Filtrer supertriangle
  const finalTriangles = triangles.filter(tri =>
    !superIndices.includes(tri.a) &&
    !superIndices.includes(tri.b) &&
    !superIndices.includes(tri.c)
  );
  
  // Statistiques
  let totalArea = 0;
  let minAngle = Infinity;
  
  for (const tri of finalTriangles) {
    const p1 = allPoints[tri.a];
    const p2 = allPoints[tri.b];
    const p3 = allPoints[tri.c];
    
    const a = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const b = Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2);
    const c = Math.sqrt((p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2);
    const s = (a + b + c) / 2;
    totalArea += Math.sqrt(s * (s - a) * (s - b) * (s - c));
    
    const angles = [
      Math.acos((a * a + b * b - c * c) / (2 * a * b)),
      Math.acos((b * b + c * c - a * a) / (2 * b * c)),
      Math.acos((c * c + a * a - b * b) / (2 * c * a)),
    ];
    minAngle = Math.min(minAngle, ...angles);
  }
  
  return {
    triangles: finalTriangles,
    points,
    statistics: {
      triangleCount: finalTriangles.length,
      averageArea: totalArea / finalTriangles.length,
      minAngle: minAngle * 180 / Math.PI,
    },
  };
}

/** Génère grille MNT (IDW) */
export function generateGrid(
  points: Point[],
  resolution: number
): { grid: number[][]; bounds: { minX: number; maxX: number; minY: number; maxY: number } } {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z || 0);
    maxZ = Math.max(maxZ, p.z || 0);
  }
  
  const cols = Math.ceil((maxX - minX) / resolution) + 1;
  const rows = Math.ceil((maxY - minY) / resolution) + 1;
  const grid: number[][] = [];
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const x = minX + col * resolution;
      const y = maxY - row * resolution;
      
      let z = 0, weight = 0;
      
      for (const p of points) {
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        if (dist < 0.001) {
          z = p.z || 0;
          weight = 1;
          break;
        }
        const w = 1 / dist ** 2;
        z += (p.z || 0) * w;
        weight += w;
      }
      
      grid[row][col] = weight > 0 ? z / weight : (minZ + maxZ) / 2;
    }
  }
  
  return { grid, bounds: { minX, maxX, minY, maxY } };
}

/** Extrait breaklines depuis des points codés */
export function extractBreaklines(
  points: Point[],
  breaklineCode: string
): Point[][] {
  const lines: Point[][] = [];
  let currentLine: Point[] = [];
  
  const filtered = points.filter(p => p.code === breaklineCode);
  
  for (const point of filtered) {
    if (currentLine.length === 0) {
      currentLine.push(point);
    } else {
      const last = currentLine[currentLine.length - 1];
      const dist = Math.sqrt((point.x - last.x) ** 2 + (point.y - last.y) ** 2);
      
      if (dist < 50) {
        currentLine.push(point);
      } else {
        if (currentLine.length > 1) lines.push(currentLine);
        currentLine = [point];
      }
    }
  }
  
  if (currentLine.length > 1) lines.push(currentLine);
  
  return lines;
}