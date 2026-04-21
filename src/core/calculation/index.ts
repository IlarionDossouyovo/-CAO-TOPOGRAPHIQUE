/**
 * Calculation Module for CAO Topographique
 * Calculs topométriques avancés
 */

import { Point, TopographicPoint } from '../types';
import { distance2D, azimuth, lineIntersection } from '../geometry';

/**
 * Cheminement polygonal fermé
 */
export interface PolygonalResult {
  coordinates: Point[];
  closingError: number;
  precision: string;
  angularError: number;
  linearError: number;
}

/**
 * Calcule un cheminement polygonal fermé
 */
export function calculateClosedPolygonal(
  knownPoints: TopographicPoint[],
  measuredAngles: number[],
  measuredDistances: number[]
): PolygonalResult {
  const coordinates: Point[] = [];
  
  // Point de départ
  let current = { x: knownPoints[0].x, y: knownPoints[0].y };
  coordinates.push(current);
  
  // Calculer les coordonnées successives
  for (let i = 0; i < measuredAngles.length; i++) {
    const angle = measuredAngles[i];
    const dist = measuredDistances[i];
    
    current = {
      x: current.x + dist * Math.sin(angle * Math.PI / 180),
      y: current.y + dist * Math.cos(angle * Math.PI / 180),
    };
    coordinates.push(current);
  }
  
  // Erreur de fermeture
  const closingError = distance2D(
    coordinates[coordinates.length - 1],
    knownPoints[0]
  );
  
  // Précision du cheminement
  const totalDistance = measuredDistances.reduce((a, b) => a + b, 0);
  const precision = closingError / totalDistance;
  
  let angularError = 0;
  for (let i = 0; i < measuredAngles.length - 1; i++) {
    const expected = azimuth(coordinates[i], coordinates[i + 1]);
    angularError += Math.abs(measuredAngles[i] - expected);
  }
  
  return {
    coordinates,
    closingError,
    precision: `1/${Math.round(1 / precision)}`,
    angularError,
    linearError: closingError,
  };
}

/**
 * Compensationangulaire d'un cheminement
 */
export function compensateAngular(
  angles: number[],
  closingAngle: number
): number[] {
  const errorAngle = closingAngle - 200; // Somme théorique pour fermer
  const totalAngles = angles.reduce((a, b) => a + b, 0);
  const correction = (totalAngles - errorAngle) / angles.length;
  
  return angles.map((a, i) => a + correction * (i + 1) / angles.length);
}

/**
 * Compensation linéaire (moindres carrés)
 */
export function compensateLinear(
  points: Point[],
  observations: { from: number; to: number; distance: number }[]
): Point[] {
  // Système d'équations normales
  const n = points.length;
  const A: number[][] = [];
  const B: number[] = [];
  
  for (const obs of observations) {
    const p1 = points[obs.from];
    const p2 = points[obs.to];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = obs.distance / dist;
    
    A.push([
      dx / dist * (1 - ratio),
      dy / dist * (1 - ratio),
      -dx / dist * (1 - ratio),
      -dy / dist * (1 - ratio),
    ]);
    B.push(obs.distance - dist);
  }
  
  // Résoudre (simplifié - it'd need a proper matrix solver)
  // Pour l'instant, compensation proportionnelle
  const error = distance2D(points[0], points[n - 1]);
  const correction = error / (n - 1);
  
  return points.map((p, i) => ({
    x: p.x + correction * i,
    y: p.y + correction * i,
    z: p.z,
  }));
}

/**
 * Intersection de deux droites (droite-droite)
 */
export function intersectLineLine(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): Point | null {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;
  
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;
  
  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  
  return {
    x: p1.x + t * dx1,
    y: p1.y + t * dy1,
  };
}

/**
 * Intersection cercle-cercle
 */
export function intersectCircleCircle(
  c1: Point, r1: number,
  c2: Point, r2: number
): Point[] | null {
  const d = distance2D(c1, c2);
  
  // Casde겹침 ou远离
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  
  const px = c1.x + a * (c2.x - c1.x) / d;
  const py = c1.y + a * (c2.y - c1.y) / d;
  
  return [
    {
      x: px + h * (c2.y - c1.y) / d,
      y: py - h * (c2.x - c1.x) / d,
    },
    {
      x: px - h * (c2.y - c1.y) / d,
      y: py + h * (c2.x - c1.x) / d,
    },
  ];
}

/**
 * Intersection droite-cercle
 */
export function intersectLineCircle(
  p1: Point, p2: Point,
  center: Point, radius: number
): Point[] | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;
  
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return null;
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  
  const points: Point[] = [
    {
      x: p1.x + t1 * dx,
      y: p1.y + t1 * dy,
    },
  ];
  
  if (discriminant > 1e-10) {
    points.push({
      x: p1.x + t2 * dx,
      y: p1.y + t2 * dy,
    });
  }
  
  return points;
}

/**
 * Division de parcelle
 */
export function divideParcel(
  vertices: Point[],
  divisionLine: Point[],
  precision: number = 0.01
): { parcel1: Point[]; parcel2: Point[]; areas: number[] } {
  // Simpliste: divise按比例
  const totalArea = calculatePolygonArea(vertices);
  const splitRatio = 0.5;
  
  // Trouver les points d'intersection
  const newVertices: Point[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    newVertices.push(vertices[i]);
  }
  
  // Insérer les points de division
  const midIndex = Math.floor(vertices.length / 2);
  newVertices.splice(midIndex, 0, ...divisionLine);
  
  const area1 = calculatePolygonArea(newVertices.slice(0, midIndex + 2));
  const area2 = totalArea - area1;
  
  return {
    parcel1: newVertices.slice(0, midIndex + 2),
    parcel2: newVertices.slice(midIndex),
    areas: [area1, area2],
  };
}

function calculatePolygonArea(vertices: Point[]): number {
  let area = 0;
  const n = vertices.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Transformation de coordonnées (7 paramètres)
 */
export interface Transform7Params {
  tx: number; // Translation X
  ty: number; // Translation Y
  tz: number; // Translation Z
  rx: number; // Rotation X (secondes)
  ry: number; // Rotation Y (secondes)
  rz: number; // Rotation Z (secondes)
  scale: number; // Facteur d'échelle (ppm)
}

/**
 * Transformation Helmert (7 paramètres)
 */
export function helmertTransform(
  point: Point,
  params: Transform7Params,
  inverse: boolean = false
): Point {
  const dx = inverse ? -params.tx : params.tx;
  const dy = inverse ? -params.ty : params.ty;
  const dz = inverse ? -params.tz : params.tz;
  
  const rx = (inverse ? -params.rx : params.rx) * Math.PI / 648000; // secondes -> radians
  const ry = (inverse ? -params.ry : params.ry) * Math.PI / 648000;
  const rz = (inverse ? -params.rz : params.rz) * Math.PI / 648000;
  
  const scale = 1 + (inverse ? -params.scale : params.scale) / 1e6;
  
  const x = scale * (point.x + rz * point.y - ry * point.z) + dx;
  const y = scale * (-rz * point.x + point.y + rx * point.z) + dy;
  const z = scale * (ry * point.x - rx * point.y + point.z) + dz;
  
  return { x, y, z: point.z };
}

/**
 * Calcul de point inaccessible ( Stanton )
 */
export function stantonMethod(
  baseA: Point,
  baseB: Point,
  angleA: number, // Angle en A mesuré vers le point inaccessible
  angleB: number  // Angle en B mesuré vers le point inaccessible
): Point | null {
  // droites depuis A et B
  const tga = Math.tan(angleA * Math.PI / 180);
  const tgb = Math.tan(angleB * Math.PI / 180);
  
  if (Math.abs(tga - tgb) < 1e-10) return null;
  
  const dx = baseB.x - baseA.x;
  const dy = baseB.y - baseA.y;
  
  const x = (dx * tga * tgb - dy * (tga - tgb)) / (tga - tgb);
  const y = (dx * tga * tgb - dy * tgb) / (tga - tgb) * tga;
  
  return {
    x: baseA.x + x,
    y: baseA.y + y,
  };
}

/**
 * Résection (détermination de la position depuis 3 points connus)
 */
export function resection(
  p1: Point, p2: Point, p3: Point,
  angles: [number, number, number] // Angles P1-P2, P2-P3, P3-P1
): Point | null {
  const [a1, a2, a3] = angles;
  
  // Utiliser la formule de Snellius
  const k = Math.tan(a1 * Math.PI / 180);
  const l = Math.tan(a2 * Math.PI / 180);
  const m = Math.tan(a3 * Math.PI / 180);
  
  const d = k * l * m * (p1.x * p2.y - p2.x * p1.y) +
           l * m * (p2.x * p3.y - p3.x * p2.y) +
           m * k * (p3.x * p1.y - p1.x * p3.y);
  
  if (Math.abs(d) < 1e-10) return null;
  
  const pa = k * l * (p1.x * p2.y - p2.x * p1.y);
  const pb = l * m * (p2.x * p3.y - p3.x * p2.y);
  const pc = m * k * (p3.x * p1.y - p1.x * p3.y);
  
  return {
    x: (pa * p3.x + pb * p1.x + pc * p2.x) / (pa + pb + pc),
    y: (pa * p3.y + pb * p1.y + pc * p2.y) / (pa + pb + pc),
  };
}

/**
 * Compensation de cheminement par moindres carrés
 */
export function leastSquaresAdjustment(
  observations: {
    pointIndex: number;
    x?: number;
    y?: number;
    distanceTo?: number;
  }[],
  initialCoords: Point[],
  uncertainties: { distance: number; angle: number } = { distance: 0.01, angle: 0.001 }
): { adjustedCoords: Point[]; residuals: number[]; sigma0: number } {
  // Implementation simplifiée
  // Idéalement, utiliserait une bibliothèque d'algèbre linéaire
  
  const n = initialCoords.length;
  let totalResidual = 0;
  const residuals: number[] = [];
  
  const adjustedCoords = initialCoords.map((p, i) => {
    const obs = observations.find(o => o.pointIndex === i);
    if (obs) {
      const residual = (obs.x || p.x) - p.x;
      residuals.push(residual);
      totalResidual += residual * residual;
      return {
        x: p.x + residual,
        y: p.y + residual,
        z: p.z,
      };
    }
    return { ...p };
  });
  
  const sigma0 = Math.sqrt(totalResidual / n);
  
  return {
    adjustedCoords,
    residuals,
    sigma0,
  };
}