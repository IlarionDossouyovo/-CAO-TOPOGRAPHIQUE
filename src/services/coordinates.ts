/**
 * Coordinate Service for CAO Topographique
 * Handles coordinate system transformations using Proj4.js
 */

import proj4 from 'proj4';

// Définitions des projections courantes
const PROJECTIONS: Record<string, string> = {
  // Lambert
  'lambert93': '+proj=lcc +lat_0=46 +lon_0=2 +lat_1=44 +lat_2=49 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  'lambert92': '+proj=lcc +lat_0=46 +lon_0=2 +lat_1=44 +lat_2=49 +x_0=600000 +y_0=200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  'lambert91': '+proj=lcc +lat_0=46 +lon_0=2 +lat_1=44 +lat_2=49 +x_0=600000 +y_0=2000000 +ellps=clrk80 +units=m +no_defs',
  
  // UTM
  'utm-nord': '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs',
  'utm31n': '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs',
  'utm32n': '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',
  'utm33n': '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
  
  // WGS84
  'wgs84': '+proj=longlat +datum=WGS84 +no_defs',
  'wgs84r': '+proj=longlat +datum=WGS84 +no_defs',
};

// Zone UTM automatique
export function getUtmZone(longitude: number, latitude: number): string {
  let zone = Math.floor((longitude + 180) / 6) + 1;
  let hemisphere = latitude >= 0 ? 'N' : 'S';
  return `utm${zone}${hemisphere.toLowerCase()}`;
}

// Convertir entre systèmes de coordonnées
export function transformCoordinates(
  x: number,
  y: number,
  fromSystem: string,
  toSystem: string
): [number, number, number] {
  try {
    const fromProj = PROJECTIONS[fromSystem] || PROJECTIONS['wgs84'];
    const toProj = PROJECTIONS[toSystem] || PROJECTIONS['wgs84'];
    
    const result = proj4(fromProj, toProj, [x, y]);
    return [result[0], result[1], 0];
  } catch (e) {
    console.error('Transform error:', e);
    return [x, y, 0];
  }
}

// Convertir un tableau de points
export function transformPoints<T extends { x: number; y: number }>(
  points: T[],
  fromSystem: string,
  toSystem: string
): T[] {
  return points.map((p, i) => {
    const [x, y, z] = transformCoordinates(p.x, p.y, fromSystem, toSystem);
    return { ...p, x, y } as T;
  });
}

// Obtenir la définition d'une projection
export function getProjectionDefinition(system: string): string | undefined {
  return PROJECTIONS[system];
}

// Liste des systèmes disponibles
export function getAvailableSystems(): { code: string; name: string; type: string }[] {
  return [
    { code: 'lambert93', name: 'Lambert 93', type: 'conique' },
    { code: 'lambert92', name: 'Lambert 92', type: 'conique' },
    { code: 'lambert91', name: 'Lambert 91', type: 'conique' },
    { code: 'utm31n', name: 'UTM Nord 31', type: 'utm' },
    { code: 'utm32n', name: 'UTM Nord 32', type: 'utm' },
    { code: 'utm33n', name: 'UTM Nord 33', type: 'utm' },
    { code: 'wgs84', name: 'WGS 84', type: 'geographique' },
    { code: 'local', name: 'Système local', type: 'local' },
  ];
}

// Convertir degrés/minutes/secondes en degrés décimaux
export function dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: 'N' | 'S' | 'E' | 'W'): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') decimal *= -1;
  return decimal;
}

// Convertir degrés décimaux en degrés/minutes/secondes
export function decimalToDMS(decimal: number): { degrees: number; minutes: number; seconds: number; direction: string } {
  let direction = 'E';
  if (decimal < 0) {
    direction = 'W';
    decimal = Math.abs(decimal);
  }
  
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;
  
  return { degrees, minutes, seconds, direction };
}

// Distance géodésique (Haversine)
export function geodesicDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Rayon terrestre en mètres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(deltaPhi / 2) ** 2 +
           Math.cos(phi1) * Math.cos(phi2) *
           Math.sin(deltaLambda / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Azimut géodésique
export function geodesicAzimuth(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  
  const x = Math.sin(deltaLambda) * Math.cos(phi2);
  const y = Math.cos(phi1) * Math.sin(phi2) -
           Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  
  let azimuth = Math.atan2(x, y) * 180 / Math.PI;
  if (azimuth < 0) azimuth += 360;
  
  return azimuth;
}

// Charger projection personnalisée
export function registerProjection(code: string, definition: string): void {
  PROJECTIONS[code] = definition;
}