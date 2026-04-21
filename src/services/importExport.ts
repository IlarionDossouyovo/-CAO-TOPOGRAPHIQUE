/**
 * Import/Export Service for CAO Topographique
 * Handles various file formats for points and entities
 */

import { TopographicPoint, Entity, Layer, ImportOptions, ExportOptions } from '../types';
import { saveAs } from 'file-saver';

/**
 * Import points from CSV
 */
export function importCSV(content: string, options: ImportOptions): TopographicPoint[] {
  const lines = content.split('\n').filter(l => l.trim());
  const delimiter = options.delimiter || ',';
  const hasHeader = options.skipHeader || false;
  const startIndex = hasHeader ? 1 : 0;
  
  const points: TopographicPoint[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    
    if (cols.length < 2) continue;
    
    const x = parseFloat(cols[options.coordinateOrder === 'yx' ? 1 : 0]);
    const y = parseFloat(cols[options.coordinateOrder === 'yx' ? 0 : 1]);
    const z = options.hasZ ? parseFloat(cols[2]) : 0;
    
    if (isNaN(x) || isNaN(y)) continue;
    
    points.push({
      id: `point-${i}`,
      number: cols[3] || String(i),
      x, y, z,
      code: cols[4] || '',
      description: cols[5] || '',
    });
  }
  
  return points;
}

/**
 * Export points to CSV
 */
export function exportCSV(points: TopographicPoint[], options: ExportOptions): string {
  const precision = options.precision || 3;
  const lines: string[] = ['X,Y,Z,NUMERO,CODE,DESCRIPTION'];
  
  for (const point of points) {
    const x = point.x.toFixed(precision);
    const y = point.y.toFixed(precision);
    const z = (point.z || 0).toFixed(precision);
    lines.push(`${x},${y},${z},${point.number},${point.code},${point.description || ''}`);
  }
  
  return lines.join('\n');
}

/**
 * Import points from GeoJSON
 */
export function importGeoJSON(content: string): TopographicPoint[] {
  const data = JSON.parse(content);
  const points: TopographicPoint[] = [];
  
  if (data.type === 'FeatureCollection') {
    for (let i = 0; i < data.features.length; i++) {
      const feature = data.features[i];
      if (feature.geometry?.type === 'Point') {
        const [x, y, z] = feature.geometry.coordinates;
        points.push({
          id: `point-${i}`,
          number: feature.id?.toString() || String(i + 1),
          x, y, z: z || 0,
          code: feature.properties?.code || '',
          description: feature.properties?.description || '',
        });
      }
    }
  }
  
  return points;
}

/**
 * Export points to GeoJSON
 */
export function exportGeoJSON(points: TopographicPoint[], name: string = 'points'): string {
  const features = points.map(point => ({
    type: 'Feature' as const,
    id: point.number,
    geometry: {
      type: 'Point' as const,
      coordinates: [point.x, point.y, point.z || 0],
    },
    properties: {
      numero: point.number,
      code: point.code,
      description: point.description,
    },
  }));
  
  return JSON.stringify({
    type: 'FeatureCollection',
    name,
    features,
  }, null, 2);
}

/**
 * Convertit en KML (Google Earth)
 */
export function exportKML(
  points: TopographicPoint[],
  entities: Entity[],
  layers: Layer[],
  name: string = 'Topographic Data'
): string {
  const placemarks = points.map(point => {
    const color = layers.find(l => l.id === 'layer-1')?.color || 'ff0000ff';
    return `
    <Placemark>
      <name>${point.number}</name>
      <description>${point.description || point.code}</description>
      <Point>
        <coordinates>${point.x},${point.y},${point.z || 0}</coordinates>
      </Point>
      <Style>
        <IconStyle>
          <color>${color}</color>
        </IconStyle>
      </Style>
    </Placemark>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    ${placemarks}
  </Document>
</kml>`;
}

/**
 * Format DXF simple (AutoCAD)
 */
export function exportDXF(
  entities: Entity[],
  layers: Layer[]
): string {
  const lines: string[] = [
    '0',
    'SECTION',
    '2',
    'ENTITIES',
  ];
  
  for (const entity of entities) {
    const layer = layers.find(l => l.id === entity.layerId);
    
    if (entity.type === 'line' && entity.points.length >= 2) {
      lines.push(
        '0', 'LINE',
        '8', layer?.name || '0',
        '10', String(entity.points[0].x),
        '20', String(entity.points[0].y),
        '30', String(entity.points[0].z || 0),
        '11', String(entity.points[1].x),
        '21', String(entity.points[1].y),
        '31', String(entity.points[1].z || 0),
      );
    } else if (entity.type === 'point' && entity.points.length >= 1) {
      lines.push(
        '0', 'POINT',
        '8', layer?.name || '0',
        '10', String(entity.points[0].x),
        '20', String(entity.points[0].y),
        '30', String(entity.points[0].z || 0),
      );
    }
  }
  
  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}

/**
 * Import depuis un fichier texte formaté
 */
export function importText(
  content: string,
  format: string
): TopographicPoint[] {
  const lines = content.split('\n').filter(l => l.trim());
  const points: TopographicPoint[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (format === 'xyz') {
      const cols = line.split(/\s+/);
      if (cols.length >= 3) {
        points.push({
          id: `point-${i}`,
          number: String(i + 1),
          x: parseFloat(cols[0]),
          y: parseFloat(cols[1]),
          z: parseFloat(cols[2]) || 0,
        });
      }
    } else if (format === 'numxyz') {
      const match = line.match(/(\d+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
      if (match) {
        points.push({
          id: `point-${i}`,
          number: match[1],
          x: parseFloat(match[2]),
          y: parseFloat(match[3]),
          z: parseFloat(match[4]) || 0,
        });
      }
    }
  }
  
  return points;
}

/**
 * Download helper
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, filename);
}

/**
 * Export JSON natif
 */
export function exportProject(
  points: TopographicPoint[],
  entities: Entity[],
  layers: Layer[],
  metadata: { name: string; coordinateSystem: string }
): string {
  return JSON.stringify({
    version: '1.0',
    type: 'CAO-TOPO',
    metadata: {
      name: metadata.name,
      coordinateSystem: metadata.coordinateSystem,
      exportDate: new Date().toISOString(),
    },
    points,
    layers,
    entities,
  }, null, 2);
}

/**
 * Import JSON natif
 */
export function importProject(content: string): {
  points: TopographicPoint[];
  entities: Entity[];
  layers: Layer[];
  metadata: { name: string; coordinateSystem: string };
} | null {
  try {
    const data = JSON.parse(content);
    if (data.type !== 'CAO-TOPO') return null;
    
    return {
      points: data.points || [],
      entities: data.entities || [],
      layers: data.layers || [],
      metadata: data.metadata || { name: '', coordinateSystem: 'local' },
    };
  } catch {
    return null;
  }
}

/**
 * Parseur DXF basique
 */
export function parseDXF(content: string): Entity[] {
  const entities: Entity[] = [];
  const lines = content.split('\n');
  let i = 0;
  let currentEntity: Partial<Entity> | null = null;
  
  while (i < lines.length) {
    const code = lines[i]?.trim();
    const value = lines[i + 1]?.trim();
    
    if (code === '0' && value) {
      if (currentEntity && currentEntity.type && currentEntity.points?.length) {
        entities.push(currentEntity as Entity);
      }
      
      if (value === 'LINE' || value === 'POINT' || value === 'CIRCLE') {
        currentEntity = {
          id: `entity-${entities.length}`,
          type: value.toLowerCase() as Entity['type'],
          layerId: 'layer-1',
          points: [],
          style: { color: '#000000', lineWidth: 1, lineType: 'solid' },
        };
      } else {
        currentEntity = null;
      }
    } else if (currentEntity && code === '10' && value) {
      if (!currentEntity.points) currentEntity.points = [];
      currentEntity.points[0] = { x: parseFloat(value), y: 0, z: 0 };
      if (lines[i + 1]?.trim() === '20') {
        currentEntity.points[0].y = parseFloat(lines[i + 1]);
        i++;
      }
      if (lines[i + 1]?.trim() === '30') {
        currentEntity.points[0].z = parseFloat(lines[i + 1]);
        i++;
      }
    } else if (currentEntity && code === '11' && value) {
      if (currentEntity.points!.length < 2) {
        currentEntity.points![1] = { x: parseFloat(value), y: 0, z: 0 };
        if (lines[i + 1]?.trim() === '21') {
          currentEntity.points![1].y = parseFloat(lines[i + 1]);
          i++;
        }
        if (lines[i + 1]?.trim() === '31') {
          currentEntity.points![1].z = parseFloat(lines[i + 1]);
          i++;
        }
      }
    } else if (currentEntity && code === '8' && value) {
      currentEntity.layerId = value;
    }
    
    i += 2;
  }
  
  if (currentEntity && currentEntity.type && currentEntity.points?.length) {
    entities.push(currentEntity as Entity);
  }
  
  return entities;
}