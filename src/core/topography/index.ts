/**
 * Topography Module for CAO Topographique
 * Algorithmes de calculs topométriques
 */

import { Point, TopographicPoint, ContourLine, ProfilePoint } from '../types';
import { distance2D, azimuth, polygonArea, polygonCentroid } from '../geometry';

/**
 * Calcule la surface d'un polygon en 2D (projectée)
 */
export function calculateSurface(points: Point[]): { area: number; perimeter: number; centroid: Point } {
  const area = polygonArea(points);
  const perimeter = points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length];
    return sum + distance2D(p, next);
  }, 0);
  const centroid = polygonCentroid(points);
  
  return {
    area,
    perimeter,
    centroid,
  };
}

/**
 * Calcule la surface 3D (réelle) d'un terrain
 * Utilise la méthode triangulation
 */
export function calculate3DSurface(points: Point[], triangles: number[][]): number {
  let totalArea = 0;
  
  for (const tri of triangles) {
    const p1 = points[tri[0]];
    const p2 = points[tri[1]];
    const p3 = points[tri[2]];
    
    // côté des triangles
    const a = distance2D(p1, p2);
    const b = distance2D(p2, p3);
    const c = distance2D(p3, p1);
    
    // Formule de Héron
    const s = (a + b + c) / 2;
    totalArea += Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }
  
  return totalArea;
}

/**
 * Génère les breaklines pour le MNT
 */
export function createBreaklines(points: Point[][]): { points: Point[]; type: 'soft' | 'hard' }[] {
  return points.map((pts) => ({
    points: pts,
    type: 'hard' as const,
  }));
}

/**
 * Génère les courbes de niveau
 */
export function generateContours(
  points: Point[],
  minElevation: number,
  interval: number,
  smoothFactor: number = 0.5
): ContourLine[] {
  const contours: ContourLine[] = [];
  const elevations: number[] = [];
  
  // Extraire toutes les altitudes uniques
  for (const point of points) {
    const z = point.z || 0;
    if (!elevations.includes(z)) {
      elevations.push(z);
    }
  }
  
  elevations.sort((a, b) => a - b);
  
  // Générer les courbes
  for (const z of elevations) {
    const isMajor = z % (interval * 5) === 0;
    contours.push({
      points: points.filter(p => Math.abs((p.z || 0) - z) < interval),
      elevation: z,
      isMajor,
    });
  }
  
  return contours;
}

/**
 * Calcule un profil en long
 */
export function calculateLongProfile(
  axisPoints: Point[],
  terrainPoints: Point[]
): ProfilePoint[] {
  const profile: ProfilePoint[] = [];
  let cumulativeDistance = 0;
  
  for (let i = 0; i < axisPoints.length; i++) {
    if (i > 0) {
      cumulativeDistance += distance2D(axisPoints[i - 1], axisPoints[i]);
    }
    
    // Trouver le point terrain le plus proche
    let nearestZ = 0;
    let minDist = Infinity;
    
    for (const tp of terrainPoints) {
      const dist = distance2D(axisPoints[i], tp);
      if (dist < minDist) {
        minDist = dist;
        nearestZ = tp.z || 0;
      }
    }
    
    profile.push({
      station: cumulativeDistance,
      elevation: nearestZ,
      distance: cumulativeDistance,
    });
  }
  
  return profile;
}

/**
 * Calcule les cubatures (volumes) par profils en travers
 */
export function calculateCrossSectionVolumes(
  crossSections: { axis: Point; left: Point; right: Point }[],
  projectElevations: number[]
): { cutVolume: number; fillVolume: number; totalVolume: number } {
  let cutVolume = 0;
  let fillVolume = 0;
  
  for (let i = 0; i < crossSections.length - 1; i++) {
    const current = crossSections[i];
    const next = crossSections[i + 1];
    const projectZ = projectElevations[i] || 0;
    
    // Surfaces des sections
    const currentArea = calculateSectionArea(current.left, current.right, projectZ);
    const nextArea = calculateSectionArea(next.left, next.right, projectZ);
    
    const distance = distance2D(current.axis, next.axis);
    const avgArea = (currentArea + nextArea) / 2;
    
    if (avgArea > 0) {
      cutVolume += avgArea * distance;
    } else {
      fillVolume += Math.abs(avgArea) * distance;
    }
  }
  
  return {
    cutVolume: cutVolume / 1000, // m3 -> millier
    fillVolume: fillVolume / 1000,
    totalVolume: (cutVolume - fillVolume) / 1000,
  };
}

function calculateSectionArea(left: Point, right: Point, projectZ: number): number {
  const base = distance2D(left, right);
  const avgTerrainZ = ((left.z || 0) + (right.z || 0)) / 2;
  const diffZ = projectZ - avgTerrainZ;
  return base * diffZ / 2;
}

/**
 * Calcule les cubatures par différence de MNT
 */
export function calculateTINVolumes(
  naturalTerrain: Point[],
  projectTerrain: Point[],
  triangles: number[][],
  foisonnement: number = 1.25
): { cutVolume: number; fillVolume: number; netVolume: number } {
  let cutVolume = 0;
  let fillVolume = 0;
  
  for (const tri of triangles) {
    const p1n = naturalTerrain[tri[0]];
    const p2n = naturalTerrain[tri[1]];
    const p3n = naturalTerrain[tri[2]];
    
    const p1p = projectTerrain[tri[0]];
    const p2p = projectTerrain[tri[1]];
    const p3p = projectTerrain[tri[2]];
    
    // Volume du prisme (moyenne des Z * aire de la base)
    const avgNaturalZ = ((p1n.z || 0) + (p2n.z || 0) + (p3n.z || 0)) / 3;
    const avgProjectZ = ((p1p.z || 0) + (p2p.z || 0) + (p3p.z || 0)) / 3;
    
    const diffZ = avgProjectZ - avgNaturalZ;
    const area = Math.abs(
      (p2n.x - p1n.x) * (p3n.y - p1n.y) -
      (p3n.x - p1n.x) * (p2n.y - p1n.y)
    ) / 2;
    
    const volume = diffZ * area;
    
    if (volume > 0) {
      fillVolume += volume;
    } else {
      cutVolume += Math.abs(volume);
    }
  }
  
  return {
    cutVolume,
    fillVolume: fillVolume * foisonnement,
    netVolume: cutVolume - fillVolume * foisonnement,
  };
}

/**
 * Analyse de pente
 */
export function analyzeSlope(
  point: Point,
  neighbors: Point[],
  thresholds: number[] = [5, 10, 15, 30]
): { slope: number; category: string } {
  let totalSlope = 0;
  let count = 0;
  
  for (const neighbor of neighbors) {
    const dist = distance2D(point, neighbor);
    if (dist > 0) {
      const dz = Math.abs((neighbor.z || 0) - (point.z || 0));
      const slopePercent = (dz / dist) * 100;
      totalSlope += slopePercent;
      count++;
    }
  }
  
  const avgSlope = count > 0 ? totalSlope / count : 0;
  
  let category = 'Plate';
  if (avgSlope > thresholds[3]) category = 'Très forte';
  else if (avgSlope > thresholds[2]) category = 'Forte';
  else if (avgSlope > thresholds[1]) category = 'Moyenne';
  else if (avgSlope > thresholds[0]) category = 'Faible';
  
  return { slope: avgSlope, category };
}

/**
 * Analyse d'exposition (orientation du versant)
 */
export function analyzeExposure(point: Point, neighbors: Point[]): string {
  if (point.z === undefined) return 'Inconnu';
  
  // Trouver les voisins pour calculer le gradient
  let maxNeighbor: Point | null = null;
  let maxDiff = -Infinity;
  
  for (const neighbor of neighbors) {
    const diff = (neighbor.z || 0) - point.z;
    if (diff > maxDiff) {
      maxDiff = diff;
      maxNeighbor = neighbor;
    }
  }
  
  if (!maxNeighbor) return 'Inconnu';
  
  const expos = azimuth(point, maxNeighbor);
  
  if (expos >= 315 || expos < 45) return 'Nord';
  if (expos >= 45 && expos < 135) return 'Est';
  if (expos >= 135 && expos < 225) return 'Sud';
  return 'Ouest';
}

/**
 * Génère la ligne d均衡 (optimisation du terrassement)
 */
export function calculateBalanceLine(
  points: Point[],
  targetElevation: number
): { balanceElevation: number; cutVolume: number; fillVolume: number } {
  let totalCut = 0;
  let totalFill = 0;
  
  for (const point of points) {
    const z = point.z || 0;
    const diff = z - targetElevation;
    if (diff > 0) {
      totalCut += diff;
    } else {
      totalFill += Math.abs(diff);
    }
  }
  
  // Trouver l'élévation d'équilibre
  const elevations = points.map(p => p.z || 0);
  const minZ = Math.min(...elevations);
  const maxZ = Math.max(...elevations);
  
  let bestZ = targetElevation;
  let minDiff = Math.abs(totalCut - totalFill);
  
  for (let z = minZ; z <= maxZ; z += 0.1) {
    let cut = 0, fill = 0;
    for (const point of points) {
      const diff = (point.z || 0) - z;
      if (diff > 0) cut += diff;
      else fill += Math.abs(diff);
    }
    const diff = Math.abs(cut - fill);
    if (diff < minDiff) {
      minDiff = diff;
      bestZ = z;
    }
  }
  
  return {
    balanceElevation: bestZ,
    cutVolume: totalCut,
    fillVolume: totalFill,
  };
}