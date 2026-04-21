import { FC, useState } from 'react';
import { ProjectSettings, CoordinateSystem } from '../types';

interface ProjectModalProps {
  onClose: () => void;
}

export const ProjectModal: FC<ProjectModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<ProjectSettings>({
    name: 'Nouveau projet',
    client: '',
    coordinateSystem: 'lambert93',
    linearUnit: 'meters',
    angularUnit: 'degrees',
    defaultScale: 500,
    autoSaveInterval: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Créer le projet:', settings);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nouveau projet</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nom du projet</label>
              <input
                type="text"
                className="form-input"
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <input
                type="text"
                className="form-input"
                value={settings.client || ''}
                onChange={(e) =>
                  setSettings({ ...settings, client: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Système de coordonnées</label>
              <select
                className="form-select"
                value={settings.coordinateSystem}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    coordinateSystem: e.target.value as CoordinateSystem,
                  })
                }
              >
                <option value="lambert93">Lambert 93</option>
                <option value="lambert92">Lambert 92</option>
                <option value="lambert91">Lambert 91</option>
                <option value="utm">UTM</option>
                <option value="wgs84">WGS 84</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unité linéaire</label>
              <select
                className="form-select"
                value={settings.linearUnit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    linearUnit: e.target.value as 'meters' | 'feet',
                  })
                }
              >
                <option value="meters">Mètres</option>
                <option value="feet">Pieds</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unité angulaire</label>
              <select
                className="form-select"
                value={settings.angularUnit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    angularUnit: e.target.value as 'degrees' | 'gradians',
                  })
                }
              >
                <option value="degrees">Degrés</option>
                <option value="gradians">Grades</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Échelle par défaut</label>
              <select
                className="form-select"
                value={settings.defaultScale}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultScale: parseInt(e.target.value),
                  })
                }
              >
                <option value="100">1:100</option>
                <option value="200">1:200</option>
                <option value="500">1:500</option>
                <option value="1000">1:1000</option>
                <option value="2000">1:2000</option>
                <option value="5000">1:5000</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sauvegarde automatique (minutes)</label>
              <input
                type="number"
                className="form-input"
                value={settings.autoSaveInterval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoSaveInterval: parseInt(e.target.value),
                  })
                }
                min={1}
                max={60}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};