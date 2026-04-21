import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { StatusBar } from './components/StatusBar';
import { ProjectModal } from './components/ProjectModal';
import { AppState, DrawingTool, Layer, Project } from './types';
import './styles/app.css';

const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'layer-1',
    name: 'Points',
    order: 0,
    visible: true,
    locked: false,
    color: '#ef4444',
    lineType: 'solid',
    lineWidth: 1,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-2',
    name: 'Bâti',
    order: 1,
    visible: true,
    locked: false,
    color: '#3b82f6',
    lineType: 'solid',
    lineWidth: 2,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-3',
    name: 'Voirie',
    order: 2,
    visible: true,
    locked: false,
    color: '#64748b',
    lineType: 'solid',
    lineWidth: 2,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-4',
    name: 'Végétation',
    order: 3,
    visible: true,
    locked: false,
    color: '#10b981',
    lineType: 'solid',
    lineWidth: 1,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-5',
    name: 'Réseaux',
    order: 4,
    visible: true,
    locked: false,
    color: '#f59e0b',
    lineType: 'dashed',
    lineWidth: 1,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-6',
    name: 'Cours d\'eau',
    order: 5,
    visible: true,
    locked: false,
    color: '#3b82f6',
    lineType: 'solid',
    lineWidth: 2,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-7',
    name: 'Courbes de niveau',
    order: 6,
    visible: true,
    locked: false,
    color: '#94a3b8',
    lineType: 'solid',
    lineWidth: 1,
    printEnabled: true,
    transparency: 0,
  },
  {
    id: 'layer-8',
    name: 'Construction',
    order: 7,
    visible: true,
    locked: false,
    color: '#000000',
    lineType: 'solid',
    lineWidth: 2,
    printEnabled: true,
    transparency: 0,
  },
];

const DEMO_PROJECT: Project = {
  id: 'project-demo',
  name: 'Projet de démonstration',
  settings: {
    name: 'Projet de démonstration',
    coordinateSystem: 'lambert93',
    linearUnit: 'meters',
    angularUnit: 'degrees',
    defaultScale: 500,
    autoSaveInterval: 5,
  },
  points: [],
  layers: DEFAULT_LAYERS,
  entities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function App() {
  const [appState, setAppState] = useState<AppState>({
    project: DEMO_PROJECT,
    currentTool: 'select' as DrawingTool,
    currentLayer: 'layer-1',
    snapMode: 'end',
    gridEnabled: true,
    orthoMode: false,
    view: { x: 0, y: 0, zoom: 1, rotation: 0, tilt: 0 },
    isDrawing: false,
    selectedEntities: [],
    history: { undoStack: [], redoStack: [] },
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, z: 0 });

  const handleToolChange = useCallback((tool: DrawingTool) => {
    setAppState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  const handleLayerChange = useCallback((layerId: string | null) => {
    setAppState(prev => ({ ...prev, currentLayer: layerId }));
  }, []);

  const handleToggleGrid = useCallback(() => {
    setAppState(prev => ({ ...prev, gridEnabled: !prev.gridEnabled }));
  }, []);

  const handleToggleOrtho = useCallback(() => {
    setAppState(prev => ({ ...prev, orthoMode: !prev.orthoMode }));
  }, []);

  const handleMouseMove = useCallback((x: number, y: number, z: number) => {
    setMousePosition({ x, y, z });
  }, []);

  const handleNewProject = useCallback(() => {
    setShowProjectModal(true);
  }, []);

  return (
    <div className="app-container">
      <Header onNewProject={handleNewProject} />
      <Toolbar
        currentTool={appState.currentTool}
        onToolChange={handleToolChange}
        currentLayer={appState.currentLayer}
        gridEnabled={appState.gridEnabled}
        onToggleGrid={handleToggleGrid}
        orthoMode={appState.orthoMode}
        onToggleOrtho={handleToggleOrtho}
      />
      <div className="app-main">
        <Sidebar
          layers={appState.project?.layers || []}
          currentLayer={appState.currentLayer}
          onLayerChange={handleLayerChange}
        />
        <div className="app-content">
          <Canvas
            tool={appState.currentTool}
            layer={appState.currentLayer}
            gridEnabled={appState.gridEnabled}
            snapMode={appState.snapMode}
            onMouseMove={handleMouseMove}
          />
        </div>
      </div>
      <StatusBar
        position={mousePosition}
        scale={appState.view.zoom}
        currentTool={appState.currentTool}
        currentLayer={appState.currentLayer}
        project={appState.project}
      />
      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  );
}

export default App;