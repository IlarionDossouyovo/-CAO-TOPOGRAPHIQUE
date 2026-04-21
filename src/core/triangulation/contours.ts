/**
 * Contour Lines Module - Generation des courbes de niveau
 */

import { Point, ContourLine } from '../../types';
import { distance2D } from '../geometry';

/** Extrrait les isocontours depuis un MNT grille */
export interface ContourResult {
  contours: ContourLine[];
  statistics: {
    majorCount: number;
    minorCount: number;
    totalLength: number;
  };
}

/** Génère les courbes de niveau */
export function generateContours(
  grid: number[][],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  options: {
    interval: number;
    minorInterval?: number;
    smoothFactor?: number;
  }
): ContourResult {
  const { interval, minorInterval = interval / 5, smoothFactor = 0 } = options;
  
  // Calculer les altitudes min/max
  let minZ = Infinity, maxZ = -Infinity;
  for (const row of grid) {
    for (const z of row) {
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }
  
  // Générer les niveaux
  const levels: number[] = [];
  for (let z = Math.ceil(minZ / interval) * interval; z <= maxZ; z += interval) {
    levels.push(z);
    if (minorInterval < interval && z + minorInterval < maxZ) {
      // Ajouter intermédiaires après
    }
  }
  
  const contours: ContourLine[] = [];
  let majorLength = 0, minorLength = 0;
  
  for (const level of levels) {
    const isMajor = level % (interval * 5) === 0;
    const points = extractContourPoints(grid, bounds, level);
    
    if (points.length > 1) {
      // Lissage optionnel
      const smoothed = smoothFactor > 0 ? smoothLine(points, smoothFactor) : points;
      
      contours.push({
        elevation: level,
        isMajor,
        points: smoothed,
      });
      
      // Calculer longueur
      for (let i = 1; i < smoothed.length; i++) {
        const len = distance2D(smoothed[i - 1], smoothed[i]);
        if (isMajor) majorLength += len;
        else minorLength += len;
      }
    }
  }
  
  return {
    contours,
    statistics: {
      majorCount: contours.filter(c => c.isMajor).length,
      minorCount: contours.filter(c => !c.isMajor).length,
      totalLength: majorLength + minorLength,
    },
  };
}

/** Extrait les points d'un isocontour (marching squares) */
function extractContourPoints(
  grid: number[][],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  level: number
): Point[] {
  const points: Point[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  
  const resX = (bounds.maxX - bounds.minX) / (cols - 1);
  const resY = (bounds.maxY - bounds.minY) / (rows - 1);
  
  // Marching squares simplifié
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const v00 = grid[row][col];
      const v10 = grid[row][col + 1];
      const v01 = grid[row + 1][col];
      const v11 = grid[row + 1][col + 1];
      
      // Cas où le niveau traverse cette cellule
      if ((v00 >= level && v10 < level) || (v00 < level && v10 >= level) ||
          (v00 >= level && v01 < level) || (v00 < level && v01 >= level) ||
          (v10 >= level && v11 < level) || (v10 < level && v11 >= level) ||
          (v01 >= level && v11 < level) || (v01 < level && v11 >= level)) {
        
        const x = bounds.minX + col * resX + resX / 2;
        const y = bounds.maxY - row * resY - resY / 2;
        
        // Interpolation simple
        let z = level;
        if (v00 !== v10) {
          const t = (level - v00) / (v10 - v00);
          z = v00 + t * (v10 - v00);
        }
        
        points.push({ x, y, z });
      }
    }
  }
  
  return points;
}

/** Lissage de Chaikin pour les lignes */
function smoothLine(points: Point[], factor: number): Point[] {
  if (points.length < 3 || factor <= 0) return points;
  
  const smoothed: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Chaikin: 75% vers le suivant, 25% vers le précédent
    const q = {
      x: 0.75 * p1.x + 0.25 * p2.x,
      y: 0.75 * p1.y + 0.25 * p2.y,
      z: 0.75 * (p1.z || 0) + 0.25 * (p2.z || 0),
    };
    
    smoothed.push(q);
  }
  
  smoothed.push(points[points.length - 1]);
  
  return smoothed;
}

/** Place les étiquettes sur les courbes */
export function labelContours(
  contours: ContourLine[],
  spacing: number = 10
): { x: number; y: number; z: number; elevation: number }[] {
  const labels: { x: number; y: number; z: number; elevation: number }[] = [];
  
  for (const contour of contours) {
    let cumulativeDist = 0;
    
    for (let i = 1; i < contour.points.length; i++) {
      cumulativeDist += distance2D(contour.points[i - 1], contour.points[i]);
      
      if (cumulativeDist >= spacing) {
        const p = contour.points[i];
        labels.push({
          x: p.x,
          y: p.y,
          z: p.z || 0,
          elevation: contour.elevation,
        });
        cumulativeDist = 0;
      }
    }
  }
  
  return labels;
}

/** Génère le style des courbes selon élévation */
export function styleContour(
  contour: ContourLine,
  colorRamp: { min: string; max: string }
): { color: string; lineWidth: number; lineDash?: number[] } {
  if (contour.isMajor) {
    return {
      color: '#475569',
      lineWidth: 2,
      lineDash: [],
    };
  }
  
  // Couleur interpolée
  const z = contour.elevation;
  const normalizedZ = Math.min(1, Math.max(0, (z % 10) / 10));
  
  return {
    color: '#94a3b8',
    lineWidth: 1,
    lineDash: [5, 3],
  };
}