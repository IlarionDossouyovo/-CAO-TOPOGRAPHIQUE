import { FC } from 'react';
import { Project, DrawingTool } from '../types';

interface StatusBarProps {
  position: { x: number; y: number; z: number };
  scale: number;
  currentTool: DrawingTool;
  currentLayer: string | null;
  project: Project | null;
}

export const StatusBar: FC<StatusBarProps> = ({
  position,
  scale,
  currentTool,
  currentLayer,
  project,
}) => {
  return (
    <div className="app-statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <span className="statusbar-label">X:</span>
          <span className="statusbar-value">{position.x.toFixed(3)}</span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-label">Y:</span>
          <span className="statusbar-value">{position.y.toFixed(3)}</span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-label">Z:</span>
          <span className="statusbar-value">{position.z.toFixed(3)}</span>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="statusbar-item">
          <span className="statusbar-label">Outil:</span>
          <span className="statusbar-value">{currentTool}</span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-label">Calque:</span>
          <span className="statusbar-value">
            {project?.layers.find((l) => l.id === currentLayer)?.name || '-'}
          </span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-label">Échelle:</span>
          <span className="statusbar-value">1:{Math.round(1 / scale)}</span>
        </div>
        <div className="statusbar-item">
          <span className="statusbar-label">Projet:</span>
          <span className="statusbar-value">{project?.name || 'Sans titre'}</span>
        </div>
      </div>
    </div>
  );
};