/**
 * Analysis Module - Slope, Watershed, Visibility Analysis
 */

import { Point } from '../../types';
import { distance2D, azimuth } from '../geometry';

/**
 * Résultat d'analyse de pente
 */
export interface SlopeAnalysis {
  categories: {
    flat: number;     // < 5%
    gentle: number;   // 5-10%
    moderate: number; // 10-15%
    steep: number;    // 15-30%
    verySteep: number; // > 30%
  };
  averageSlope: number;
  maxSlope: number;
  slopeMap?: number[][];
}

/**
 * Résultat d'analyse de bassin versant
 */
export interface WatershedResult {
  catchmentArea: number;
  pourPoint: Point;
  flowDirection: number[][];
  flowAccumulation: number[][];
  streamNetwork: Point[];
}

/**
 * Résultat d'analyse de visibilité
 */
export interface VisibilityResult {
  visiblePoints: Point[];
  invisiblePoints: Point[];
  visibleArea: number;
  totalArea: number;
  visibilityPercentage: number;
}

/**
 * Analyse de pente depuis un MNT grille
 */
export function analyzeSlope(
  grid: number[][],
  resolution: number,
  thresholds: number[] = [5, 10, 15, 30]
): SlopeAnalysis {
  const rows = grid.length;
  const cols = grid[0].length;
  
  let totalSlope = 0;
  let maxSlope = 0;
  let cellCount = 0;
  
  const categories = {
    flat: 0,
    gentle: 0,
    moderate: 0,
    steep: 0,
    verySteep: 0,
  };
  
  const slopeMap: number[][] = [];
  
  for (let row = 0; row < rows; row++) {
    slopeMap[row] = [];
    
    for (let col = 0; col < cols; col++) {
      const z = grid[row][col];
      
      // Pente calculée dans les 2 directions
      let slopeX = 0, slopeY = 0;
      let count = 0;
      
      if (col > 0) {
        slopeX = Math.abs(z - grid[row][col - 1]) / resolution * 100;
        count++;
      }
      if (row > 0) {
        slopeY = Math.abs(z - grid[row - 1][col]) / resolution * 100;
        count++;
      }
      
      const slope = count > 0 ? (slopeX + slopeY) / count : 0;
      
      slopeMap[row][col] = slope;
      totalSlope += slope;
      maxSlope = Math.max(maxSlope, slope);
      cellCount++;
      
      // Catégoriser
      if (slope < thresholds[0]) categories.flat++;
      else if (slope < thresholds[1]) categories.gentle++;
      else if (slope < thresholds[2]) categories.moderate++;
      else if (slope < thresholds[3]) categories.steep++;
      else categories.verySteep++;
    }
  }
  
  return {
    categories,
    averageSlope: totalSlope / cellCount,
    maxSlope,
    slopeMap,
  };
}

/**
 * Calcule la direction d'écoulement (D8)
 */
export function calculateFlowDirection(
  grid: number[][],
  resolution: number
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const direction: number[][] = [];
  
  // 8 directions (N, NE, E, SE, S, SW, W, NW)
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
  const dist = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2];
  
  for (let row = 0; row < rows; row++) {
    direction[row] = [];
    
    for (let col = 0; col < cols; col++) {
      const z = grid[row][col];
      let maxDrop = 0;
      let dir = 0;
      
      for (let d = 0; d < 8; d++) {
        const nr = row + dy[d];
        const nc = col + dx[d];
        
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const drop = (z - grid[nr][nc]) / (dist[d] * resolution);
          if (drop > maxDrop) {
            maxDrop = drop;
            dir = d;
          }
        }
      }
      
      direction[row][col] = maxDrop > 0 ? dir : -1;
    }
  }
  
  return direction;
}

/**
 * Calcule l'accumulation de flux
 */
export function calculateFlowAccumulation(
  grid: number[][],
  direction: number[][]
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const accumulation: number[][] = [];
  
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
  
  // Initialiser à 1 (chaque cellule compte pour 1)
  for (let row = 0; row < rows; row++) {
    accumulation[row] = new Array(cols).fill(1);
  }
  
  // Ajouter les flux
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dir = direction[row][col];
      if (dir >= 0) {
        const nr = row + dy[dir];
        const nc = col + dx[dir];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          accumulation[nr][nc] += accumulation[row][col];
        }
      }
    }
  }
  
  return accumulation;
}

/**
 * Extrait le réseau hydrographique
 */
export function extractStreamNetwork(
  grid: number[][],
  direction: number[][],
  accumulation: number[][],
  threshold: number = 100
): Point[] {
  const streams: Point[] = [];
  const resolution = 1; // Simplifié
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (accumulation[row][col] >= threshold) {
        // C'est un cours d'eau
        const dir = direction[row][col];
        if (dir >= 0) {
          streams.push({
            x: col * resolution,
            y: (grid.length - row) * resolution,
            z: grid[row][col],
          });
        }
      }
    }
  }
  
  return streams;
}

/**
 * Extrait les talwegs (lignes de fond)
 */
export function extractTalwegs(
  grid: number[][],
  direction: number[][]
): { talwegs: Point[][]; pourPoints: Point[] } {
  const talwegs: Point[][] = [];
  const pourPoints: Point[] = [];
  
  // Trouver les cellules de sinks (pas de sortie)
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (direction[row][col] < 0) {
        // C'est un exutoire potentiel
        pourPoints.push({
          x: col,
          y: row,
          z: grid[row][col],
        });
        
        // Remonter le talweg
        const talweg: Point[] = [];
        let r = row, c = col;
        
        while (true) {
          talweg.push({ x: c, y: r, z: grid[r][c] });
          
          // Trouver la cellule qui écoule vers celle-ci
          let found = false;
          const dx = [0, 1, 1, 1, 0, -1, -1, -1];
          const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
          
          for (let d = 0; d < 8; d++) {
            const nr = r + dy[d];
            const nc = c + dx[d];
            
            if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
              const dir = direction[nr][nc];
              if (dir >= 0) {
                const tr = nr + dy[dir];
                const tc = nc + dx[dir];
                if (tr === r && tc === c) {
                  r = nr;
                  c = nc;
                  found = true;
                  break;
                }
              }
            }
          }
          
          if (!found) break;
        }
        
        if (talweg.length > 2) talwegs.push(talweg);
      }
    }
  }
  
  return { talwegs, pourPoints };
}

/**
 * Analyse de visibilité depuis un point
 */
export function analyzeVisibility(
  observerPoint: Point,
  terrainPoints: Point[],
  options: {
    observerHeight?: number;
    targetHeight?: number;
    maxDistance?: number;
    resolution?: number;
  } = {}
): VisibilityResult {
  const {
    observerHeight = 1.7,
    targetHeight = 1.7,
    maxDistance = 1000,
    resolution = 10,
  } = options;
  
  const observerZ = observerPoint.z || 0 + observerHeight;
  const visiblePoints: Point[] = [];
  const invisiblePoints: Point[] = [];
  
  // Tester différents azimuts
  for (let angle = 0; angle < 360; angle += resolution) {
    const rad = angle * Math.PI / 180;
    let maxSlope = -Infinity;
    let lastZ = observerZ;
    
    for (let dist = 0; dist <= maxDistance; dist += resolution) {
      const x = observerPoint.x + dist * Math.sin(rad);
      const y = observerPoint.y + dist * Math.cos(rad);
      
      // Trouver le point terrain le plus proche
      let terrainZ = 0;
      let minDist = Infinity;
      
      for (const tp of terrainPoints) {
        const d = Math.sqrt((tp.x - x) ** 2 + (tp.y - y) ** 2);
        if (d < minDist) {
          minDist = d;
          terrainZ = tp.z || 0;
        }
      }
      
      // Vérifier la visibilité
      const slope = dist > 0 ? (lastZ - terrainZ - targetHeight) / dist : -Infinity;
      
      if (slope <= maxSlope) {
        // Masqué
        if (!invisiblePoints.find(p => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5)) {
          invisiblePoints.push({ x, y, z: terrainZ });
        }
      } else {
        // Visible
        maxSlope = slope;
        if (!visiblePoints.find(p => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5)) {
          visiblePoints.push({ x, y, z: terrainZ });
        }
      }
      
      lastZ = terrainZ + targetHeight;
    }
  }
  
  const visibleArea = visiblePoints.length * maxDistance * resolution * 0.01; // Approximation
  const totalArea = (Math.PI * maxDistance * maxDistance) / 10000; // hectares
  
  return {
    visiblePoints,
    invisiblePoints,
    visibleArea,
    totalArea,
    visibilityPercentage: (visiblePoints.length / (visiblePoints.length + invisiblePoints.length)) * 100,
  };
}

/**
 * Calcule le bassin versant depuis un point de contrôle
 */
export function calculateWatershed(
  grid: number[][],
  pourPoint: Point,
  threshold: number = 100
): { area: number; points: Point[] } {
  const direction = calculateFlowDirection(grid, 1);
  const accumulation = calculateFlowAccumulation(grid, direction);
  
  const points: Point[] = [];
  let area = 0;
  
  // Collecter toutes les cellules qui s'écoulent vers le point de contrôle
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      // Vérifie si cette cellule s'écoule vers le point de contrôle
      let currentRow = row;
      let currentCol = col;
      let flowsToPour = false;
      
      for (let step = 0; step < 1000; step++) {
        const dir = direction[currentRow][currentCol];
        
        if (dir < 0) {
          // Sink
          if (Math.abs(currentRow - pourPoint.y) < 5 && Math.abs(currentCol - pourPoint.x) < 5) {
            flowsToPour = true;
          }
          break;
        }
        
        const dx = [0, 1, 1, 1, 0, -1, -1, -1];
        const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
        
        currentRow += dy[dir];
        currentCol += dx[dir];
        
        if (currentRow < 0 || currentRow >= grid.length || currentCol < 0 || currentCol >= grid[0].length) {
          break;
        }
      }
      
      if (flowsToPour) {
        points.push({ x: col, y: row, z: grid[row][col] });
        area += 1;
      }
    }
  }
  
  return { area, points };
}

/**
 * Analyse de vue en coupe (profil de visibilité)
 */
export function viewShedProfile(
  observerPoint: Point,
  targetPoint: Point,
  terrainPoints: Point[]
): { visible: boolean; profile: { distance: number; terrainZ: number; lineOfSight: number }[] } {
  const profile: { distance: number; terrainZ: number; lineOfSight: number }[] = [];
  
  const dx = targetPoint.x - observerPoint.x;
  const dy = targetPoint.y - observerPoint.y;
  const totalDist = Math.sqrt(dx * dx + dy * dy);
  
  const steps = Math.ceil(totalDist / 1); // 1m de résolution
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = observerPoint.x + t * dx;
    const y = observerPoint.y + t * dy;
    const distance = t * totalDist;
    
    // Ligne de vue (droit)
    const observerZ = observerPoint.z || 0;
    const targetZ = targetPoint.z || 0;
    const los = observerZ + t * (targetZ - observerZ);
    
    // Hauteur du terrain à cette position
    let terrainZ = 0;
    let minDist = Infinity;
    
    for (const tp of terrainPoints) {
      const d = Math.sqrt((tp.x - x) ** 2 + (tp.y - y) ** 2);
      if (d < minDist) {
        minDist = d;
        terrainZ = tp.z || 0;
      }
    }
    
    profile.push({ distance, terrainZ, lineOfSight: los });
  }
  
  // Vérifier si le ciblesn't pas masqué
  let visible = true;
  for (const p of profile) {
    if (p.terrainZ > p.lineOfSight + 0.1) {
      visible = false;
      break;
    }
  }
  
  return { visible, profile };
}