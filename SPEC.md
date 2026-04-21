# Spécifications Techniques Détaillées

## 1. Architecture Logicielle

### 1.1 Structure des Modules

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION                              │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React Components)                               │
│  ├── Header, Toolbar, Sidebar                             │
│  ├── Canvas 2D, View3D                                 │
│  └── Modals, Dialogs                                    │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                     │
│  ├── ProjectManager         (gestion projets)           │
│  ├── DrawingEngine        (rendu, outils)              │
│  ├── LayerManager        (calques)                     │
│  └── SelectionManager     (sélection, édition)         │
├─────────────────────────────────────────────────────────────┤
│  Core Layer                                          │
│  ├── Geometry              (algorithmes 2D/3D)       │
│  ├── Topography           (calculs topo)               │
│  ├── Calculation         (topométrie)                 │
│  └── Triangulation       (TIN, MNT)                 │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                     │
│  ├── ImportExport        (fichiers)                  │
│  ├── CoordinateService  (transformations)             │
│  ├── StorageService    (persistance)                │
│  └── CADService        (AutoCAD/DXF)                 │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                        │
│  ├── IndexedDB          (stockage local)               │
│  ├── FileSystem        (export fichiers)            │
│  └── Cache            (performances)              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Patterns de Conception

```
- MVC/ MVVM pour l'architecture globale
- Observer pour mise à jour temps réel
- Command pour undo/redo
- Factory pour création d'entités
- Strategy pour algorithmes interchangeables
- Composite pour hiérarchies d'objets
```

## 2. Structure de Données

### 2.1 Schéma de Base de Données

```typescript
// Projet
interface Project {
  id: string;
  name: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  layers: Layer[];
  entities: Entity[];
  points: TopographicPoint[];
  terrain?: TerrainModel;
  createdAt: Date;
  updatedAt: Date;
}

// Calque
interface Layer {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
  color: string;
  lineType: LineType;
  lineWidth: number;
  printEnabled: boolean;
  transparency: number;
  filter?: LayerFilter;
}

// Entité
interface Entity {
  id: string;
  type: EntityType;
  layerId: string;
  points: Point[];
  style: EntityStyle;
  attributes: Record<string, any>;
  metadata: EntityMetadata;
}

// Point topographique
interface TopographicPoint {
  id: string;
  number: string;
  x: number;
  y: number;
  z: number;
  code: string;
  description: string;
  precision?: number;
  dateLeve?: Date;
  method?: 'ts' | 'gps' | 'station' | 'nivelle';
}
```

### 2.2 Formats de Stockage

```
Format natif (.topo) :
{
  "version": "1.0",
  "type": "CAO-TOPO",
  "project": { ... },
  "layers": [ ... ],
  "entities": [ ... ],
  "points": [ ... ]
}

IndexedDB : 
- projets : IDBObjectStore
- entités : IDBObjectStore  
- cache : IDBObjectStore
```

## 3. Import/Export

### 3.1 Formats Supportés

| Format | Extension | Lecture | Écriture | Priorité |
|-------|-----------|---------|----------|---------|
| CSV | .csv | ✅ | ✅ | Haute |
| GeoJSON | .geojson | ✅ | ✅ | Haute |
| KML | .kml/.kmz | ✅ | ✅ | Haute |
| DXF | .dxf | ✅ | ✅ | Haute |
| DWG | .dwg | ⏳ | ❌ | Moyenne |
| JSON | .json | ✅ | ✅ | Haute |
| XML | .xml | ✅ | ✅ | Moyenne |
| Shapefile | .shp | ⏳ | ⏳ | Moyenne |
| LandXML | .xml | ⏳ | ⏳ | Basse |
| SVG | .svg | ❌ | ✅ | Basse |

### 3.2 Parsers à Implémenter

```typescript
// Interface pour parsers
interface Parser<T> {
  parse(content: string): Promise<T>;
  parseSync(content: string): T;
}

interface Writer<T> {
  write(data: T): string;
  writeAsync(data: T): Promise<Blob>;
}

// Formats avec parsers personnalisés
const PARSERS = {
  csv: new CSVParser(),
  geojson: new GeoJSONParser(),
  kml: new KMLParser(),
  dxf: new DXFParser(),
  shapefile: new ShapefileParser(),
};

const WRITERS = {
  csv: new CSVWriter(),
  geojson: new GeoJSONWriter(),
  kml: new KMLWriter(),
  dxf: new DXFWriter(),
  json: new JSONWriter(),
};
```

## 4. Algorithmes

### 4.1 Géométrie

```typescript
// Fonctions'à implémenter
const Geometry = {
  // Distance
  distance2D(p1: Point, p2: Point): number;
  distance3D(p1: Point, p2: Point): number;
  
  // Angles
  azimuth(p1: Point, p2: Point): number;
  gisement(p1: Point, p2: Point): number;
  bearing(p1: Point, p2: Point): number;
  
  // Intersections
  lineLine(p1: p2, p3: p4): Point | null;
  circleCircle(c1, r1, c2, r2): Point[];
  lineCircle(line, circle): Point[];
  lineArc(line, arc): Point[];
  
  // Transformation
  rotate(point, center, angle): Point;
  scale(point, center, factor): Point;
  translate(point, dx, dy): Point;
  
  // Surface
  polygonArea(points: Point[]): number;
  polygonPerimeter(points: Point[]): number;
  polygonCentroid(points: Point[]): Point;
  pointInPolygon(point, polygon): boolean;
  
  // Simplification
  simplifyDouglasPeucker(points, tolerance): Point[];
  simplifyVisvalingam(points, area): Point[];
};
```

### 4.2 Topographie

```typescript
const Topography = {
  // MNT
  triangulateDelaunay(points: Point[], constraints?): Triangle[];
  generateContourLines(terrain: Point[], interval: number): ContourLine[];
  interpolateGrid(terrain: Point[], resolution: number): Grid;
  
  // Profils
  extractLongProfile(axis: Point[], terrain: Point[]): ProfilePoint[];
  extractCrossSections(axis: Point[], spacing: number, width: number): CrossSection[];
  
  // Volumes
  crossSectionVolumes(sections: CrossSection[], projectZ: number): VolumeResult;
  tinVolumes(natural: Point[], project: Point[], triangles: Triangle[]): VolumeResult;
  balanceLine(points: Point[]): BalanceResult;
};
```

### 4.3 Triangulation

```typescript
// Algorithme de Delaunay (Bowyer-Watson)
function delaunay(points: Point[], constraints?: Point[][]): Triangle[] {
  // 1. Créer supertriangle
  // 2. Ajouter chaque point
  // 3. Supprimer mauvais triangles
  // 4. Retirer supertriangle
  // 5. Retourner triangles
}

// Gestion des breaklines
function addConstraints(triangles: Triangle[], breaklines: Point[][]): Triangle[] {
  // Force les arêtes à suivre les breaklines
}
```

## 5. Performance

### 5.1 Optimisations

```
- Rendering : LOD (Level of Detail), Viewport culling
- Calculs : Web Workers pour opérations lourdes
- Données : Virtualisation listes, Lazy loading
- Mémoire : Pagination, Streaming gros fichiers
```

### 5.2 Benchmarks Cibles

| Opération | Cible | Status |
|-----------|---------|---------|
| Chargement 10 000 points | < 2s | ⏳ |
| Génération courbes (5000 pts) | < 5s | ⏳ |
| Affichage 2D | 60 FPS | ⏳ |
| Affichage 3D | 30 FPS | ⏳ |
| Temps de réponse UI | < 100ms | ⏳ |

## 6. Sécurité

### 6.1 Protection des Données

```
- Chiffrement AES-256 pour projets sensibles
- Gestion des droits (RBAC)
- Audit trail des modifications
- Validation des entrées
- Protection XSS, injections
```

### 6.2 Authentification (Future)

```
- OAuth 2.0 / SSO
- JWT tokens
- 2FA optionnel
- Sessions sécurisées
```

---

## 7. Tests

### 7.1 Couverture Visée

```
Unitaires : > 80%
Intégration : > 60%
E2E : Scénarios principaux
```

### 7.2 Framework de Tests

```
- Unitaires : Vitest / Jest
- Intégration : Vitest
- E2E : Playwright
- Performance : k6 / Lighthouse
```

---

## 8. Déploiement

### 8.1 CI/CD

```
GitHub Actions :
- Test : npm run test
- Build : npm run build
- Deploy : npm run preview
```

### 8.2 Environnements

```
- Développement : localhost:5173
- Staging : (à configurer)
- Production : (à configurer)
```

---

*Document généré automatiquement - CAO Topographique v1.0*