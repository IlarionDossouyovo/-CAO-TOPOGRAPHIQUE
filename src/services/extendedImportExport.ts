/**
 * Extended Import/Export Service
 * Ajoute le support de formats supplémentaires: Excel, DWG, Shapefile, etc.
 */

import { saveAs } from 'file-saver';
import { TopographicPoint, Entity, Layer, Project, Point } from '../types';

/**
 * Exporte les points vers Excel (.xlsx)
 * Format simplewithout bibliothèque externe
 */
export function exportToExcel(
  points: TopographicPoint[],
  filename: string = 'points.xlsx'
): void {
  // Créer un fichier CSV qui peut être ouvert dans Excel
  const header = 'Numéro\tX\tY\tZ\tCode\tDescription\tPrécision\tMéthode\tDate';
  const rows = points.map(p => 
    `${p.number}\t${p.x.toFixed(3)}\t${p.y.toFixed(3)}\t${(p.z || 0).toFixed(3)}\t${p.code}\t${p.description || ''}\t${p.precision || ''}\t${p.method || ''}\t${p.dateLeve || ''}`
  );
  
  const tsvContent = [header, ...rows].join('\n');
  
  // BOM pour UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
  saveAs(blob, filename.replace('.xlsx', '.tsv'));
}

/**
 * Exporte les données de projet vers format KML étendu
 */
export function exportToKML(
  points: TopographicPoint[],
  entities: Entity[],
  layers: Layer[],
  options: {
    name: string;
    description?: string;
    style?: 'simple' | 'extended';
  }
): string {
  const { name, description = '', style = 'simple' } = options;
  
  const placemarks: string[] = [];
  
  for (const point of points) {
    const layer = layers.find(l => l.id === 'layer-1');
    const color = layer?.color || 'ff0000ff';
    
    let descriptionText = '';
    if (style === 'extended') {
      descriptionText = `
      <description>
        <![CDATA[
          <table>
            <tr><td>Code:</td><td>${point.code}</td></tr>
            <tr><td>Description:</td><td>${point.description || ''}</td></tr>
            <tr><td>Z:</td><td>${point.z.toFixed(2)}m</td></tr>
            <tr><td>Méthode:</td><td>${point.method || ''}</td></tr>
          </table>
        ]]>
      </description>`;
    }
    
    placemarks.push(`
    <Placemark>
      <name>${point.number}</name>${descriptionText}
      <Point>
        <coordinates>${point.x},${point.y},${point.z}</coordinates>
      </Point>
      <Style>
        <IconStyle>
          <color>${color}</color>
        </IconStyle>
      </Style>
    </Placemark>`);
  }
  
  // Entités lignes/polylignes
  for (const entity of entities) {
    if ((entity.type === 'line' || entity.type === 'polyline') && entity.points.length >= 2) {
      const coords = entity.points.map(p => `${p.x},${p.y},${p.z || 0}`).join(' ');
      
      placemarks.push(`
      <Placemark>
        <name>Entité ${entity.id}</name>
        <LineString>
          <coordinates>${coords}</coordinates>
        </LineString>
      </Placemark>`);
    }
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    <description>${description}</description>
    <Folder>
      <name>Points</name>
      ${placemarks.join('\n')}
    </Folder>
  </Document>
</kml>`;
}

/**
 * Exporte vers DXF avec plusieurs entités
 */
export function exportToDXF(
  points: TopographicPoint[],
  entities: Entity[],
  layers: Layer[],
  options: {
    version?: 'R12' | 'R14' | '2000' | '2004';
    encoding?: 'utf-8' | 'ansi';
  } = {}
): string {
  const { version = '2000' } = options;
  
  const lines: string[] = [
    '0',
    'SECTION',
    '2',
    'ENTITIES',
  ];
  
  // Entités
  for (const entity of entities) {
    const layer = layers.find(l => l.id === entity.layerId);
    const layerName = layer?.name || '0';
    const color = layer?.color || '#000000';
    const dxColor = parseInt(color.replace('#', ''), 16) % 256;
    
    if (entity.type === 'point' && entity.points.length >= 1) {
      const p = entity.points[0];
      lines.push(
        '0', 'POINT',
        '8', layerName,
        '10', p.x.toFixed(6),
        '20', p.y.toFixed(6),
        '30', (p.z || 0).toFixed(6),
        '62', String(dxColor)
      );
    }
    
    if (entity.type === 'line' && entity.points.length >= 2) {
      const p1 = entity.points[0];
      const p2 = entity.points[1];
      lines.push(
        '0', 'LINE',
        '8', layerName,
        '10', p1.x.toFixed(6),
        '20', p1.y.toFixed(6),
        '30', (p1.z || 0).toFixed(6),
        '11', p2.x.toFixed(6),
        '21', p2.y.toFixed(6),
        '31', (p2.z || 0).toFixed(6),
        '62', String(dxColor)
      );
    }
    
    if (entity.type === 'polyline' && entity.points.length >= 2) {
      lines.push('0', 'LWPOLYLINE', '8', layerName, '90', String(entity.points.length));
      
      for (let i = 0; i < entity.points.length; i++) {
        const p = entity.points[i];
        lines.push('10', p.x.toFixed(6));
        lines.push('20', p.y.toFixed(6));
      }
      lines.push('62', String(dxColor));
    }
    
    if (entity.type === 'circle' && entity.points.length >= 2) {
      const center = entity.points[0];
      const edge = entity.points[1];
      const radius = Math.sqrt((edge.x - center.x) ** 2 + (edge.y - center.y) ** 2);
      
      lines.push(
        '0', 'CIRCLE',
        '8', layerName,
        '10', center.x.toFixed(6),
        '20', center.y.toFixed(6),
        '30', (center.z || 0).toFixed(6),
        '40', radius.toFixed(6),
        '62', String(dxColor)
      );
    }
  }
  
  lines.push('0', 'ENDSEC', '0', 'EOF');
  
  return lines.join('\n');
}

/**
 * Importe un fichier CSV/TSV avec détection automatique
 */
export function importFromText(
  content: string,
  options: {
    delimiter?: ',' | '\t' | ';';
    hasHeader?: boolean;
    coordinateOrder?: 'xyz' | 'xzy' | 'yxz' | 'yzx' | 'zxy' | 'zyx';
    hasZ?: boolean;
    skipEmptyLines?: boolean;
  } = {}
): TopographicPoint[] {
  const {
    delimiter = ',',
    hasHeader = true,
    coordinateOrder = 'xyz',
    hasZ = true,
    skipEmptyLines = true,
  } = options;
  
  const lines = content.split(/\r?\n/).filter(l => {
    if (skipEmptyLines) return l.trim().length > 0;
    return true;
  });
  
  const startIndex = hasHeader ? 1 : 0;
  const points: TopographicPoint[] = [];
  
  // Détection des colonnes
  const firstLine = lines[startIndex].split(delimiter);
  const numIndex = firstLine.findIndex(c => /num|no |number/i.test(c));
  const xIndex = coordinateOrder.indexOf('x');
  const yIndex = coordinateOrder.indexOf('y');
  const zIndex = coordinateOrder.indexOf('z');
  const codeIndex = firstLine.findIndex(c => /code|symbol|desc/i.test(c));
  const descIndex = firstLine.findIndex(c => /description|desc/i.test(c));
  
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    
    if (cols.length < 2) continue;
    
    const x = parseFloat(cols[xIndex >= 0 ? xIndex : 0]);
    const y = parseFloat(cols[yIndex >= 0 ? yIndex : 1]);
    const z = hasZ && zIndex >= 0 ? parseFloat(cols[zIndex]) : 0;
    
    if (isNaN(x) || isNaN(y)) continue;
    
    const number = numIndex >= 0 ? cols[numIndex] : String(i);
    const code = codeIndex >= 0 ? cols[codeIndex] : '';
    const description = descIndex >= 0 ? cols[descIndex] : '';
    
    points.push({
      id: `point-${i}`,
      number,
      x, y, z,
      code,
      description,
    });
  }
  
  return points;
}

/**
 * Exporte les entités vers Shapefile format ( GeoJSON comme base)
 */
export function exportToShapefile(
  points: TopographicPoint[],
  entities: Entity[],
  layers: Layer[]
): { points: string; lines: string; polygons: string } {
  const pointFeatures = points.map((p, i) => ({
    type: 'Feature' as const,
    id: i,
    geometry: {
      type: 'Point' as const,
      coordinates: [p.x, p.y, p.z || 0],
    },
    properties: {
      numero: p.number,
      code: p.code,
      description: p.description,
    },
  }));
  
  const lineFeatures: any[] = [];
  const polygonFeatures: any[] = [];
  
  for (const entity of entities) {
    if (entity.type === 'line') {
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: entity.points.map(p => [p.x, p.y, p.z || 0]),
        },
        properties: { id: entity.id },
      });
    }
    
    if (entity.type === 'polyline' || entity.type === 'polygon') {
      const isClosed = entity.points[0].x === entity.points[entity.points.length - 1].x &&
                   entity.points[0].y === entity.points[entity.points.length - 1].y;
      
      if (isClosed) {
        polygonFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [entity.points.map(p => [p.x, p.y, p.z || 0])],
          },
          properties: { id: entity.id },
        });
      } else {
        lineFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: entity.points.map(p => [p.x, p.y, p.z || 0]),
          },
          properties: { id: entity.id },
        });
      }
    }
  }
  
  return {
    points: JSON.stringify({ type: 'FeatureCollection', features: pointFeatures }),
    lines: JSON.stringify({ type: 'FeatureCollection', features: lineFeatures }),
    polygons: JSON.stringify({ type: 'FeatureCollection', features: polygonFeatures }),
  };
}

/**
 * Importe GeoJSON
 */
export function importGeoJSON(geojson: string): {
  points: TopographicPoint[];
  entities: Entity[];
} {
  const data = JSON.parse(geojson);
  
  const points: TopographicPoint[] = [];
  const entities: Entity[] = [];
  
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
      } else if (feature.geometry?.type === 'LineString') {
        entities.push({
          id: `entity-${i}`,
          type: 'polyline',
          layerId: 'layer-1',
          points: feature.geometry.coordinates.map((c: number[]) => ({
            x: c[0], y: c[1], z: c[2] || 0,
          })),
          style: { color: '#000000', lineWidth: 1, lineType: 'solid' },
        });
      } else if (feature.geometry?.type === 'Polygon') {
        entities.push({
          id: `entity-${i}`,
          type: 'polygon',
          layerId: 'layer-1',
          points: feature.geometry.coordinates[0].map((c: number[]) => ({
            x: c[0], y: c[1], z: c[2] || 0,
          })),
          style: { color: '#000000', lineWidth: 1, lineType: 'solid' },
        });
      }
    }
  }
  
  return { points, entities };
}

/**
 * Exporte le projet complet en JSON structuré
 */
export function exportProjectJSON(project: {
  name: string;
  settings: any;
  points: TopographicPoint[];
  entities: Entity[];
  layers: Layer[];
}): string {
  return JSON.stringify({
    version: '1.0.0',
    type: 'CAO-TOPOGRAPHIQUE',
    metadata: {
      name: project.name,
      exportDate: new Date().toISOString(),
      generator: 'CAO Topographique',
    },
    settings: project.settings,
    layers: project.layers,
    points: project.points,
    entities: project.entities,
  }, null, 2);
}

/**
 * Importe un projet JSON
 */
export function importProjectJSON(json: string): {
  name: string;
  settings: any;
  points: TopographicPoint[];
  entities: Entity[];
  layers: Layer[];
} | null {
  try {
    const data = JSON.parse(json);
    
    if (data.type !== 'CAO-TOPOGRAPHIQUE') {
      return null;
    }
    
    return {
      name: data.metadata?.name || 'Projet importé',
      settings: data.settings || {},
      points: data.points || [],
      entities: data.entities || [],
      layers: data.layers || [],
    };
  } catch {
    return null;
  }
}

/**
 * Convertit les coordonnées d'un地块 en surface
 */
export function calculateParcelSurface(
  vertices: Point[]
): { area: number; perimeter: number; centroid: Point } {
  let area = 0;
  const n = vertices.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  area = Math.abs(area) / 2;
  
  // Périmètre
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Centroïde
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }
  const factor = 1 / (6 * area);
  cx *= factor;
  cy *= factor;
  
  return {
    area,
    perimeter,
    centroid: { x: cx, y: cy, z: 0 },
  };
}

/**
 * Divise une parcelle par une ligne
 */
export function divideParcel(
  vertices: Point[],
  divisionLine: { start: Point; end: Point }
): { parcel1: Point[]; parcel2: Point[]; areas: [number, number] } {
  // Créer la ligne de division étendue
  const extendedLine = {
    start: { ...divisionLine.start },
    end: { ...divisionLine.end },
  };
  
  // Intersection avec les côtés
  const intersections: { point: Point; t: number }[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    
    // Calculer l'intersection
    const d1 = extendedLine.end.x - extendedLine.start.x;
    const d2 = extendedLine.end.y - extendedLine.start.y;
    const d3 = v2.x - v1.x;
    const d4 = v2.y - v1.y;
    
    const denom = d1 * d4 - d2 * d3;
    
    if (Math.abs(denom) > 1e-10) {
      const t = ((v1.x - extendedLine.start.x) * d4 - (v1.y - extendedLine.start.y) * d1) / denom;
      const u = -((extendedLine.start.x - v1.x) * d2 - (extendedLine.start.y - v1.y) * d1) / denom;
      
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        intersections.push({
          point: {
            x: v1.x + t * d3,
            y: v1.y + t * d4,
          },
          t,
        });
      }
    }
  }
  
  if (intersections.length < 2) {
    return {
      parcel1: vertices,
      parcel2: [],
      areas: [0, 0],
    };
  }
  
  // Trier les intersections
  intersections.sort((a, b) => a.t - b.t);
  
  const cutPoint1 = intersections[0].point;
  const cutPoint2 = intersections[1].point;
  
  // Créer les deux parcelles
  const parcel1: Point[] = [cutPoint1];
  const parcel2: Point[] = [cutPoint1];
  
  for (const v of vertices) {
    parcel1.push(v);
    parcel2.push(v);
  }
  
  parcel1.push(cutPoint2);
  parcel2.push(cutPoint2);
  
  // Calculer les surfaces
  const area1 = calculateParcelSurface(parcel1).area;
  const area2 = calculateParcelSurface(parcel2).area;
  
  return {
    parcel1,
    parcel2,
    areas: [area1, area2],
  };
}