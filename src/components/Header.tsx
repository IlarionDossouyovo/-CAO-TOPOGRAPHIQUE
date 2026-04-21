import { FC } from 'react';
import './Header.css';

interface HeaderProps {
  onNewProject: () => void;
}

export const Header: FC<HeaderProps> = ({ onNewProject }) => {
  return (
    <header className="app-header">
      <div className="app-logo">
        <div className="app-logo-icon">📐</div>
        <span>CAO Topographique</span>
      </div>
      <nav className="app-menu">
        <button className="app-menu-item" onClick={onNewProject}>
          Nouveau projet
        </button>
        <button className="app-menu-item" onClick={() => {}}>
          Ouvrir
        </button>
        <button className="app-menu-item" onClick={() => {}}>
          Enregistrer
        </button>
        <button className="app-menu-item" onClick={() => {}}>
          Exporter
        </button>
      </nav>
      <div className="app-actions">
        <button className="app-menu-item" onClick={() => {}}>
          Aide
        </button>
      </div>
    </header>
  );
};