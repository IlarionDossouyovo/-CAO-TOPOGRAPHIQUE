/**
 * Types fondamentaux pour le logiciel de CAO Topographique
 */

// ============ SYSTÈMES DE COORDONNÉES ============

export type CoordinateSystem = 'lambert93' | 'lambert92' | 'lambert91' | 'utm' | 'wgs84' | 'local';

export interface ProjectSettings {
  name: string;
  client?: string;
  coordinateSystem: CoordinateSystem;
  projection?: string; // Pour Lambert/UTM
  linearUnit: 'meters' | 'feet';
  angularUnit: 'degrees' | 'gradians';
  defaultScale: number;
  autoSaveInterval: number; // en minutes
}

// ============ POINTS TOPOGRAPHIQUES ============

export interface TopographicPoint {
  id: string;
  number: string;
  x: number;
  y: number;
  z: number;
  code: string;
  description?: string;
  precision?: number;
  dateLeve?: Date;
  method?: 'ts' | 'gps' | 'station' | 'nivele';
}

export interface PointCode {
  code: string;
  label: string;
  category: string;
  symbol: string;
  color?: string;
}

// ============ ENTITÉS GÉOMÉTRIQUES ============

export type EntityType = 'point' | 'line' | 'polyline' | 'arc' | 'circle' | 'rectangle' | 'polygon' | 'text' | 'symbol';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  layerId: string;
  points: Point[];
  style: EntityStyle;
  attributes?: Record<string, unknown>;
  locked?: boolean;
  visible?: boolean;
}

export interface EntityStyle {
  color: string;
  lineWidth: number;
  lineType: 'solid' | 'dashed' | 'dotted';
  fill?: string;
  fillOpacity?: number;
}

// ============ CALQUES (LAYERS) ============

export interface Layer {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
  color: string;
  lineType: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
  printEnabled: boolean;
  transparency: number;
}

// ============ PROJET ============

export interface Project {
  id: string;
  name: string;
  settings: ProjectSettings;
  points: TopographicPoint[];
  layers: Layer[];
  entities: Entity[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ OUTILS DE DESSIN ============

export type DrawingTool = 
  | 'select'
  | 'point'
  | 'line'
  | 'polyline'
  | 'arc'
  | 'circle'
  | 'rectangle'
  | 'polygon'
  | 'text'
  | 'symbol'
  | 'measure'
  | 'pan'
  | 'zoom';

export type SnapMode = 
  | 'none' 
  | 'end' 
  | 'mid' 
  | 'center' 
  | 'node' 
  | 'intersection'
  | 'perpendicular'
  | 'extension';

// ============ VUE ET NAVIGATION ============

export interface ViewState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  tilt: number;
}

export interface ViewMode2D {
  type: '2d' | '3d';
  projection: 'top' | 'front' | 'side' | 'perspective';
}

// ============ IMPORT/EXPORT ============

export interface ImportOptions {
  format: string;
  delimiter?: string;
  skipHeader?: boolean;
  coordinateOrder?: 'xy' | 'yx';
  hasZ?: boolean;
}

export interface ExportOptions {
  format: string;
  layers?: string[];
  coordinateSystem?: CoordinateSystem;
  precision?: number;
  includeAttributes?: boolean;
}

export type ExportFormat = 'dxf' | 'dwg' | 'csv' | 'kml' | 'geojson' | 'shapefile' | 'json' | 'xml';

// ============ CALCULS TOPOMÉTRIQUES ============

export interface CalculationResult {
  type: string;
  value: number;
  unit: string;
  details?: Record<string, number>;
}

export interface SurfaceResult {
  area: number;
  perimeter: number;
  centroid: Point;
  units: string;
}

export interface VolumeResult {
  volume: number;
  cutVolume: number;
  fillVolume: number;
  method: 'cross-sections' | 'tin';
}

// ============ COURBES DE NIVEAU ============

export interface ContourLine {
  points: Point[];
  elevation: number;
  isMajor: boolean;
}

export interface ContourOptions {
  interval: number;
  minorInterval?: number;
  smoothFactor: number;
  showLabels: boolean;
}

// ============ PROFILS ============

export interface ProfilePoint {
  station: number;
  elevation: number;
  distance: number;
}

export interface Profile {
  axis: Point[];
  naturalProfile: ProfilePoint[];
  projectProfile?: ProfilePoint[];
}

// ============ ÉTAT DE L'APPLICATION ============

export interface AppState {
  project: Project | null;
  currentTool: DrawingTool;
  currentLayer: string | null;
  snapMode: SnapMode;
  gridEnabled: boolean;
  orthoMode: boolean;
  view: ViewState;
  isDrawing: boolean;
  selectedEntities: string[];
  history: HistoryState;
}

export interface HistoryState {
  undoStack: Action[];
  redoStack: Action[];
}

export interface Action {
  type: string;
  entityId: string;
  before: unknown;
  after: unknown;
}

// ============ MNT/MNE ============

export interface TerrainModel {
  id: string;
  points: Point[];
  triangles: [number, number, number][];
  breaklines: Point[][];
  resolution?: number;
}

export interface Breakline {
  points: Point[];
  type: 'soft' | 'hard';
}