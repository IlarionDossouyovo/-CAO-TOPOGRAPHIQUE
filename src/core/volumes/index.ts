/**
 * Volumes Module - Cubatures et calculs de volume
 */

import { Point } from '../../types';
import { distance2D, polygonArea } from '../geometry';
import { Triangle } from '../triangulation';

/**
 * Résultat de cubature
 */
export interface VolumeResult {
  cutVolume: number;
  fillVolume: number;
  netVolume: number;
  method: 'cross-sections' | 'tin' | 'prism';
  units: string;
}

/**
 * Résultatpar section
 */
export interface SectionVolume {
  station: number;
  cutArea: number;
  fillArea: number;
  cutVolume: number;
  fillVolume: number;
  cumulativeCut: number;
  cumulativeFill: number;
}

/**
 * Courbe des masses
 */
export interface MassCurvePoint {
  station: number;
  cumulativeVolume: number;
  type: 'cut' | 'fill' | 'balance';
}

/**
 * Méthode des profils en travers
 */
export function calculateCrossSectionVolumes(
  sections: {
    station: number;
    naturalProfile: number[];
    projectProfile: number[];
    offset: number[];
  }[],
  options: {
    foisonnement?: number;
    décapage?: number;
  } = {}
): { volumes: VolumeResult; sections: SectionVolume[] } {
  const foisonnement = options.foisonnement || 1.25;
  const décapage = options.décapage || 0.20;
  
  const sectionVolumes: SectionVolume[] = [];
  let totalCut = 0;
  let totalFill = 0;
  
  for (let i = 1; i < sections.length; i++) {
    const curr = sections[i];
    const prev = sections[i - 1];
    
    const dist = curr.station - prev.station;
    
    // Surfaces
    let currCut = 0, currFill = 0;
    
    for (let j = 1; j < curr.naturalProfile.length; j++) {
      const dz = curr.projectProfile[j - 1] - curr.naturalProfile[j - 1];
      const dOffset = curr.offset[j] - curr.offset[j - 1];
      const areaSlice = Math.abs(dz * dOffset / 2);
      
      if (dz > 0) currFill += areaSlice;
      else currCut += areaSlice;
    }
    
    // Volumes (moyenne des aires × distance)
    const avgCut = ((prev.cutArea || 0) + currCut) / 2 * dist;
    const avgFill = ((prev.fillArea || 0) + currFill) / 2 * dist;
    
    totalCut += avgCut;
    totalFill += avgFill * foisonnement;
    
    sectionVolumes.push({
      station: curr.station,
      cutArea: currCut,
      fillArea: currFill,
      cutVolume: avgCut,
      fillVolume: avgFill * foisonnement,
      cumulativeCut: totalCut,
      cumulativeFill: totalFill,
    });
  }
  
  return {
    volumes: {
      cutVolume: totalCut,
      fillVolume: totalFill,
      netVolume: totalCut - totalFill,
      method: 'cross-sections',
      units: 'm³',
    },
    sections: sectionVolumes,
  };
}

/**
 * Méthode TIN (différence de surfaces)
 */
export function calculateTINVolumes(
  naturalTerrain: Point[],
  projectTerrain: Point[],
  triangles: Triangle[],
  foisonnement: number = 1.25
): VolumeResult {
  let cutVolume = 0;
  let fillVolume = 0;
  
  for (const tri of triangles) {
    const p1n = naturalTerrain[tri.a];
    const p2n = naturalTerrain[tri.b];
    const p3n = naturalTerrain[tri.c];
    
    const p1p = projectTerrain[tri.a];
    const p2p = projectTerrain[tri.b];
    const p3p = projectTerrain[tri.c];
    
    // Hauteurs moyennes
    const avgNaturalZ = ((p1n.z || 0) + (p2n.z || 0) + (p3n.z || 0)) / 3;
    const avgProjectZ = ((p1p.z || 0) + (p2p.z || 0) + (p3p.z || 0)) / 3;
    const heightDiff = avgProjectZ - avgNaturalZ;
    
    // Aire du triangle (base)
    const baseArea = Math.abs(
      (p2n.x - p1n.x) * (p3n.y - p1n.y) -
      (p3n.x - p1n.x) * (p2n.y - p1n.y)
    ) / 2;
    
    // Volume du prisme
    const vol = heightDiff * baseArea;
    
    if (vol > 0) fillVolume += vol;
    else cutVolume += Math.abs(vol);
  }
  
  return {
    cutVolume,
    fillVolume: fillVolume * foisonnement,
    netVolume: cutVolume - fillVolume * foisonnement,
    method: 'tin',
    units: 'm³',
  };
}

/**
 * Méthode des prismes (grille)
 */
export function calculatePrismVolumes(
  naturalGrid: number[][],
  projectGrid: number[][],
  resolution: number,
  foisonnement: number = 1.25
): VolumeResult {
  let cutVolume = 0;
  let fillVolume = 0;
  
  const cellArea = resolution * resolution;
  
  for (let row = 0; row < naturalGrid.length; row++) {
    for (let col = 0; col < naturalGrid[row].length; col++) {
      const natZ = naturalGrid[row][col];
      const projZ = projectGrid[row][col];
      const heightDiff = projZ - natZ;
      
      const vol = heightDiff * cellArea;
      
      if (vol > 0) fillVolume += vol;
      else cutVolume += Math.abs(vol);
    }
  }
  
  return {
    cutVolume,
    fillVolume: fillVolume * foisonnement,
    netVolume: cutVolume - fillVolume * foisonnement,
    method: 'prism',
    units: 'm³',
  };
}

/**
 * Génère la courbe des masses
 */
export function generateMassCurve(
  sections: SectionVolume[]
): MassCurvePoint[] {
  const curve: MassCurvePoint[] = [];
  let cumulative = 0;
  
  curve.push({ station: 0, cumulativeVolume: 0, type: 'balance' });
  
  for (const section of sections) {
    // Remplir (+ = vers le haut, - = vers le bas)
    cumulative = section.cumulativeFill - section.cumulativeCut;
    
    curve.push({
      station: section.station,
      cumulativeVolume: cumulative,
      type: cumulative >= 0 ? 'fill' : 'cut',
    });
  }
  
  return curve;
}

/**
 * Trouve l'élévation d'équilibre (ôte optimale)
 */
export function findBalanceElevation(
  points: Point[],
  precision: number = 0.01
): { elevation: number; cutVolume: number; fillVolume: number } {
  // Extraire les altitudes
  const elevations = points.map(p => p.z || 0);
  const minZ = Math.min(...elevations);
  const maxZ = Math.max(...elevations);
  
  let bestZ = (minZ + maxZ) / 2;
  let minDiff = Infinity;
  
  // Recherche par pas
  for (let z = minZ; z <= maxZ; z += precision) {
    let cut = 0, fill = 0;
    
    for (const p of points) {
      const diff = (p.z || 0) - z;
      if (diff > 0) cut += diff;
      else fill += Math.abs(diff);
    }
    
    const diff = Math.abs(cut - fill);
    if (diff < minDiff) {
      minDiff = diff;
      bestZ = z;
    }
  }
  
  // Recalculer avec la meilleure élévation
  let finalCut = 0, finalFill = 0;
  for (const p of points) {
    const diff = (p.z || 0) - bestZ;
    if (diff > 0) finalCut += diff;
    else finalFill += Math.abs(diff);
  }
  
  return {
    elevation: bestZ,
    cutVolume: finalCut,
    fillVolume: finalFill,
  };
}

/**
 * Convertit les volumes en Camion (25 tonnes)
 */
export function volumesToTrucks(
  volume: number,
  truckCapacity: number = 25
): { trucks: number; trips: number } {
  const trucks = Math.ceil(volume / truckCapacity);
  const trips = Math.ceil(trucks / 2); //假设2 voyages/jour
  
  return { trucks, trips };
}

/**
 *Génère le tableau des cubatures en format textetabulé
 */
export function formatVolumeTable(
  sections: SectionVolume[]
): string {
  const lines: string[] = [
    'Station | Coupe (m³) | Remblai (m³) | Vol. Cum. Coupe | Vol. Cum. Remblai',
    '--------|------------|-------------|-----------------|------------------',
  ];
  
  for (const s of sections) {
    lines.push(
      `${s.station.toFixed(2).padStart(7)} | ` +
      `${s.cutVolume.toFixed(2).padStart(11)} | ` +
      `${s.fillVolume.toFixed(2).padStart(11)} | ` +
      `${s.cumulativeCut.toFixed(2).padStart(16)} | ` +
      `${s.cumulativeFill.toFixed(2).padStart(17)}`
    );
  }
  
  // Totaux
  const totalCut = sections.reduce((a, s) => a + s.cutVolume, 0);
  const totalFill = sections.reduce((a, s) => a + s.fillVolume, 0);
  
  lines.push(
    '--------|------------|-------------|-----------------|------------------'
  );
  lines.push(
    'TOTAL   | ' +
    `${totalCut.toFixed(2).padStart(11)} | ` +
    `${totalFill.toFixed(2).padStart(11)}`
  );
  
  return lines.join('\n');
}