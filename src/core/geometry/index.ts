/**
 * Core Geometry Module for CAO Topographique
 * Algorithmes de géométrie 2D/3D utilisés par le logiciel
 */

import { Point } from '../types';

/**
 * Calcule la distance entre deux points 2D
 */
export function distance2D(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcule la distance entre deux points 3D (incluant Z)
 */
export function distance3D(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z || 0) - (p1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcule l'azimut (angle par rapport au nord) entre deux points
 * @returns Azimut en degrés (0-360)
 */
export function azimuth(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calcule le gisement (angle par rapport à l'axe Y)
 */
export function gisement(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 400; // Grade
  return angle;
}

/**
 * Calcule la pente entre deux points en pourcentage
 */
export function slopePercent(p1: Point, p2: Point): number {
  const dist = distance2D(p1, p2);
  const dz = (p2.z || 0) - (p1.z || 0);
  if (dist === 0) return 0;
  return (dz / dist) * 100;
}

/**
 * Calcule la pente entre deux points en degrés
 */
export function slopeDegrees(p1: Point, p2: Point): number {
  const dist = distance2D(p1, p2);
  const dz = (p2.z || 0) - (p1.z || 0);
  if (dist === 0) return 0;
  return Math.atan2(dz, dist) * (180 / Math.PI);
}

/**
 * Convertit des coordonnées polaires en cartésiennes
 */
export function polarToCartesian(origin: Point, distance: number, angle: number): Point {
  const radians = angle * (Math.PI / 180);
  return {
    x: origin.x + distance * Math.sin(radians),
    y: origin.y + distance * Math.cos(radians),
    z: origin.z,
  };
}

/**
 * Convertit des coordonnées cartésiennes en polaires
 */
export function cartesianToPolar(origin: Point, point: Point): { distance: number; angle: number } {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return { distance, angle };
}

/**
 * Calcule le milieu d'un segment
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: ((p1.z || 0) + (p2.z || 0)) / 2,
  };
}

/**
 * Point de projection perpendiculaire sur une droite
 */
export function perpendicularPoint(lineStart: Point, lineEnd: Point, point: Point): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
    z: point.z,
  };
}

/**
 * Intersection de deux droites
 */
export function lineIntersection(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): Point | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-10) return null;
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/**
 * Aire d'un polygone (formule de Gauss)
 */
export function polygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Périmètre d'un polygone
 */
export function polygonPerimeter(points: Point[]): number {
  let perimeter = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += distance2D(points[i], points[j]);
  }
  return perimeter;
}

/**
 * Centroïde d'un polygone
 */
export function polygonCentroid(points: Point[]): Point {
  let cx = 0, cy = 0, area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    area += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }
  
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    // Fallback: moyenne des sommets
    cx = points.reduce((s, p) => s + p.x, 0) / n;
    cy = points.reduce((s, p) => s + p.y, 0) / n;
  } else {
    cx /= 6 * area;
    cy /= 6 * area;
  }
  
  return { x: cx, y: cy };
}

/**
 * Rotation d'un point autour d'un centre
 */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const radians = angle * (Math.PI / 180);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
    z: point.z,
  };
}

/**
 * Translation d'un point
 */
export function translatePoint(point: Point, dx: number, dy: number): Point {
  return {
    x: point.x + dx,
    y: point.y + dy,
    z: point.z,
  };
}

/**
 * Homothétie (mise à l'échelle) d'un point
 */
export function scalePoint(point: Point, center: Point, scale: number): Point {
  return {
    x: center.x + scale * (point.x - center.x),
    y: center.y + scale * (point.y - center.y),
    z: point.z,
  };
}

/**
 * Vérifie si un point est dans un cercle
 */
export function pointInCircle(point: Point, center: Point, radius: number): boolean {
  return distance2D(point, center) <= radius;
}

/**
 * Vérifie si un point est dans un polygone
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Simplification de polyligne (Douglas-Peucker)
 */
export function simplifyPolyline(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  
  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolyline(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [points[0], points[end]];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return distance2D(point, lineStart);
  
  return Math.abs(
    ((lineEnd.y - lineStart.y) * point.x -
     (lineEnd.x - lineStart.x) * point.y +
     lineEnd.x * lineStart.y -
     lineEnd.y * lineStart.x) / length
  );
}