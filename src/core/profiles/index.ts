/**
 * Profile Module - Profils en long et en travers
 */

import { Point, ProfilePoint } from '../../types';
import { distance2D } from '../geometry';

/**
 * Profil en long
 */
export interface LongProfile {
  station: number[];          // Chaînage cumulatif
  naturalTerrain: ProfilePoint[];
  projectProfile?: ProfilePoint[];
  cubatures: CubatureResult;
}

/**
 * Profil en travers
 */
export interface CrossProfile {
  station: number;            // Position sur l'axe
  offset: number[];          // Décalage gauche/droite
  naturalZ: number[];
  projectZ: number[];
  cutArea?: number;         // Surface de coupe
  fillArea?: number;       // Surface de remblai
}

/**
 * Résultat de cubature
 */
export interface CubatureResult {
  cutVolume: number;
  fillVolume: number;
  netVolume: number;
  totalDistance: number;
}

/**
 * Extrais le profil en long depuis un axe et un terrain
 */
export function extractLongProfile(
  axisPoints: Point[],     // Axe du profil
  terrainPoints: Point[], // Points du terrain naturel
  projectPoints?: Point[] // Projetsuperposé
): LongProfile {
  const naturalProfile: ProfilePoint[] = [];
  const projectProfile: ProfilePoint[] = [];
  const station: number[] = [0];
  
  // Calculer les stations (chaînage)
  let cumulative = 0;
  for (let i = 1; i < axisPoints.length; i++) {
    cumulative += distance2D(axisPoints[i - 1], axisPoints[i]);
    station.push(cumulative);
    cumulative = cumulative;
  }
  
  // Extraire les altitudes du terrain naturel
  for (let i = 0; i < axisPoints.length; i++) {
    const axisPoint = axisPoints[i];
    
    // Trouver le point terrain le plus proche
    let nearestZ = 0;
    let minDist = Infinity;
    
    for (const tp of terrainPoints) {
      const dist = distance2D(axisPoint, tp);
      if (dist < minDist) {
        minDist = dist;
        nearestZ = tp.z || 0;
      }
    }
    
    naturalProfile.push({
      station: station[i],
      elevation: nearestZ,
      distance: station[i],
    });
    
    // Profil projet si défini
    if (projectPoints && projectPoints.length > i) {
      const pp = projectPoints[i];
      projectProfile.push({
        station: station[i],
        elevation: pp.z || 0,
        distance: station[i],
      });
    }
  }
  
  // Calculer les cubatures
  const cubatures = calculateProfileCubatures(naturalProfile, projectProfile);
  
  return {
    station,
    naturalTerrain: naturalProfile,
    projectProfile,
    cubatures,
  };
}

/**
 * Calcule les cubatures d'un profil en long
 */
function calculateProfileCubatures(
  natural: ProfilePoint[],
  project?: ProfilePoint[]
): CubatureResult {
  if (!project || project.length === 0) {
    return {
      cutVolume: 0,
      fillVolume: 0,
      netVolume: 0,
      totalDistance: natural[natural.length - 1]?.station || 0,
    };
  }
  
  let cutVolume = 0;
  let fillVolume = 0;
  
  for (let i = 1; i < natural.length; i++) {
    const natZ = natural[i].elevation;
    const projZ = project[i].elevation;
    const dist = natural[i].station - natural[i - 1].station;
    
    // Hauteur moyenne de coupe/remblai
    const avgHeight = (projZ + project[i - 1].elevation) / 2 - (natZ + natural[i - 1].elevation) / 2;
    
    if (avgHeight > 0) {
      fillVolume += avgHeight * dist;
    } else {
      cutVolume += Math.abs(avgHeight) * dist;
    }
  }
  
  return {
    cutVolume,
    fillVolume,
    netVolume: cutVolume - fillVolume,
    totalDistance: natural[natural.length - 1]?.station || 0,
  };
}

/**
 * Génère les profils en travers
 */
export function generateCrossProfiles(
  axisPoints: Point[],      // Axe du profil long
  terrainPoints: Point[], // Terrain naturel
  projectProfile?: Point[], // Projet
  options: {
    spacing: number;       // Entre chaque profil (ex: 20m)
    width: number;        // Largeur totale (ex: 40m = 20m chaque côté)
    pointCount: number;  // Points par côté
  }
): CrossProfile[] {
  const { spacing, width, pointCount } = options;
  
  // Calculer la longueur totale de l'axe
  let totalLength = 0;
  for (let i = 1; i < axisPoints.length; i++) {
    totalLength += distance2D(axisPoints[i - 1], axisPoints[i]);
  }
  
  // Générer les stations
  const profiles: CrossProfile[] = [];
  
  for (let currentDist = 0; currentDist <= totalLength; currentDist += spacing) {
    // Trouver le point sur l'axe à cette distance
    let axisPoint = { x: 0, y: 0 };
    let accumDist = 0;
    
    for (let i = 1; i < axisPoints.length; i++) {
      const segDist = distance2D(axisPoints[i - 1], axisPoints[i]);
      if (accumDist + segDist >= currentDist) {
        const t = (currentDist - accumDist) / segDist;
        axisPoint = {
          x: axisPoints[i - 1].x + t * (axisPoints[i].x - axisPoints[i - 1].x),
          y: axisPoints[i - 1].y + t * (axisPoints[i].y - axisPoints[i - 1].y),
        };
        break;
      }
      accumDist += segDist;
    }
    
    // Calculer les offsets et altitudes
    const offset: number[] = [];
    const naturalZ: number[] = [];
    const projectZ: number[] = [];
    
    for (let side = -1; side <= 1; side += 2 / (pointCount - 1)) {
      for (let j = 0; j < pointCount; j++) {
        const dist = (width / 2) * (side > 0 ? j / (pointCount - 1) : -j / (pointCount - 1));
        offset.push(dist);
        
        // Point perpendiculaire
        const perpX = axisPoint.x - dist * 0; // Simplified
        const perpY = axisPoint.y + dist;
        
        // Trouver altitude terrain
        let z = 0;
        let minDist = Infinity;
        
        for (const tp of terrainPoints) {
          const d = Math.sqrt((tp.x - perpX) ** 2 + (tp.y - perpY) ** 2);
          if (d < minDist) {
            minDist = d;
            z = tp.z || 0;
          }
        }
        
        naturalZ.push(z);
        
        if (projectProfile) {
          // Projet simplification
          projectZ.push(projectProfile[0]?.z || z);
        }
      }
    }
    
    // Calculer les surfaces
    const { cutArea, fillArea } = calculateCrossSectionArea(naturalZ, projectZ, offset);
    
    profiles.push({
      station: currentDist,
      offset,
      naturalZ,
      projectZ,
      cutArea,
      fillArea,
    });
  }
  
  return profiles;
}

/**
 * Calcule la surface de coupe/remblai d'une section
 */
function calculateCrossSectionArea(
  naturalZ: number[],
  projectZ: number[],
  offset: number[]
): { cutArea: number; fillArea: number } {
  if (naturalZ.length < 2 || projectZ.length === 0) {
    return { cutArea: 0, fillArea: 0 };
  }
  
  let cutArea = 0;
  let fillArea = 0;
  
  for (let i = 1; i < naturalZ.length; i++) {
    const dz = (projectZ[i] || 0) - naturalZ[i];
    const dOffset = offset[i] - offset[i - 1];
    const height = Math.abs(dz);
    
    // Surface trapèze
    const area = height * dOffset;
    
    if (dz > 0) fillArea += area;
    else cutArea += area;
  }
  
  return { cutArea, fillArea };
}

/**
 * Calcule les volumes totaux depuis les profils en travers
 */
export function calculateTotalVolumes(
  crossProfiles: CrossProfile[]
): CubatureResult {
  let totalCut = 0;
  let totalFill = 0;
  
  for (let i = 1; i < crossProfiles.length; i++) {
    const curr = crossProfiles[i];
    const prev = crossProfiles[i - 1];
    
    const dist = curr.station - prev.station;
    const avgCut = ((curr.cutArea || 0) + (prev.cutArea || 0)) / 2;
    const avgFill = ((curr.fillArea || 0) + (prev.fillArea || 0)) / 2;
    
    totalCut += avgCut * dist;
    totalFill += avgFill * dist;
  }
  
  return {
    cutVolume: totalCut,
    fillVolume: totalFill,
    netVolume: totalCut - totalFill,
    totalDistance: crossProfiles[crossProfiles.length - 1]?.station || 0,
  };
}