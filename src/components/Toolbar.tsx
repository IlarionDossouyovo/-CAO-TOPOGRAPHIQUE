import { FC } from 'react';
import { DrawingTool } from '../types';

interface ToolbarProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  currentLayer: string | null;
  gridEnabled: boolean;
  onToggleGrid: () => void;
  orthoMode: boolean;
  onToggleOrtho: () => void;
}

const TOOLS: { id: DrawingTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Sélection', icon: '⬚' },
  { id: 'point', label: 'Point', icon: '•' },
  { id: 'line', label: 'Ligne', icon: '/' },
  { id: 'polyline', label: 'Polyligne', icon: '⤭' },
  { id: 'arc', label: 'Arc', icon: '⌒' },
  { id: 'circle', label: 'Cercle', icon: '○' },
  { id: 'rectangle', label: 'Rectangle', icon: '▢' },
  { id: 'polygon', label: 'Polygone', icon: '⬠' },
  { id: 'text', label: 'Texte', icon: 'T' },
  { id: 'symbol', label: 'Symbole', icon: '◈' },
  { id: 'measure', label: 'Mesure', icon: '📏' },
  { id: 'pan', label: 'Panoramique', icon: '✋' },
  { id: 'zoom', label: 'Zoom', icon: '🔍' },
];

export const Toolbar: FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentLayer,
  gridEnabled,
  onToggleGrid,
  orthoMode,
  onToggleOrtho,
}) => {
  return (
    <div className="app-toolbar">
      <div className="toolbar-group">
        {TOOLS.slice(0, 4).map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <span>{tool.icon}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        {TOOLS.slice(4, 8).map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <span>{tool.icon}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        {TOOLS.slice(8, 12).map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <span>{tool.icon}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        <button
          className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
          onClick={onToggleGrid}
          title="Grille"
        >
          <span>#</span>
        </button>
        <button
          className={`toolbar-button ${orthoMode ? 'active' : ''}`}
          onClick={onToggleOrtho}
          title="Mode orthogonal"
        >
          <span>◫</span>
        </button>
      </div>
    </div>
  );
};