import { FC } from 'react';
import { Layer } from '../types';

interface SidebarProps {
  layers: Layer[];
  currentLayer: string | null;
  onLayerChange: (layerId: string | null) => void;
}

export const Sidebar: FC<SidebarProps> = ({ layers, currentLayer, onLayerChange }) => {
  return (
    <div className="app-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Calques</div>
        <div className="layer-list">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`layer-item ${currentLayer === layer.id ? 'selected' : ''}`}
              onClick={() => onLayerChange(layer.id)}
            >
              <div className={`layer-visibility ${layer.visible ? '' : 'hidden'}`}>
                {layer.visible ? '👁' : '👁‍🗨'}
              </div>
              <div
                className="layer-color"
                style={{ backgroundColor: layer.color }}
              />
              <div className="layer-name">{layer.name}</div>
              <div className="layer-lock">
                {layer.locked ? '🔒' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-title">Bibliothèque de symboles</div>
        <div className="symbol-grid">
          {[
            { label: 'Arbre', icon: '🌳' },
            { label: 'Maison', icon: '🏠' },
            { label: 'Bâtiment', icon: '🏢' },
            { label: 'Route', icon: '🛣' },
            { label: 'Eau', icon: '💧' },
            { label: 'Poteau', icon: '⚡' },
            { label: 'Bouche', icon: '⬡' },
            { label: 'Pont', icon: '🌉' },
          ].map((symbol) => (
            <div
              key={symbol.label}
              className="symbol-item"
              title={symbol.label}
            >
              <span className="symbol-icon">{symbol.icon}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-title">Outils topométriques</div>
        <div className="tools-list">
          <button className="tool-button">Calcul de superficie</button>
          <button className="tool-button">Cubatures</button>
          <button className="tool-button">Profils</button>
          <button className="tool-button">Courbes de niveau</button>
        </div>
      </div>
    </div>
  );
};