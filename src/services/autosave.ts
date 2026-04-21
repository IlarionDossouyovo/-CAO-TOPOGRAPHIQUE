/**
 * Autosave Service - Sauvegarde automatique
 */

import { Project, TopographicPoint, Entity, Layer } from '../types';

/**
 * Configuration de sauvegarde automatique
 */
export interface AutosaveConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxBackups: number;
  storageKey: string;
}

/**
 * Résultatal de sauvegarde
 */
export interface AutosaveResult {
  success: boolean;
  timestamp: number;
  size: number;
  error?: string;
}

/**
 * Métadonnées d'une sauvegarde
 */
export interface BackupMetadata {
  id: string;
  timestamp: number;
  projectName: string;
  size: number;
  entityCount: number;
  pointCount: number;
}

/**
 * Service de sauvegarde automatique
 */
class AutosaveService {
  private config: AutosaveConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: ((result: AutosaveResult) => void)[] = [];
  
  constructor() {
    this.config = {
      enabled: true,
      intervalMinutes: 5,
      maxBackups: 10,
      storageKey: 'cao-topographique-autosave',
    };
    
    // Charger la config
    this.loadConfig();
  }
  
  /**
   * Configure le service
   */
  configure(config: Partial<AutosaveConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    
    if (this.timer) {
      this.stop();
    }
    
    if (this.config.enabled) {
      this.start();
    }
  }
  
  /**
   * Démarre la sauvegarde automatique
   */
  start(): void {
    if (this.timer) return;
    
    this.timer = setInterval(() => {
      this.save();
    }, this.config.intervalMinutes * 60 * 1000);
  }
  
  /**
   * Arrête la sauvegarde automatique
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * Sauvegarde le projet
   */
  async save(project: Project): Promise<AutosaveResult> {
    try {
      const data = JSON.stringify(project);
      const timestamp = Date.now();
      
      // Créer la sauvegarde
      const backup: BackupMetadata & { data: string } = {
        id: `backup-${timestamp}`,
        timestamp,
        projectName: project.name,
        size: data.length,
        entityCount: project.entities.length,
        pointCount: project.points.length,
        data,
      };
      
      // Stocker
      const key = `${this.config.storageKey}-${timestamp}`;
      localStorage.setItem(key, JSON.stringify(backup));
      
      // Nettoyer les anciennes sauvegardes
      this.cleanupOldBackups();
      
      // Notifier les listeners
      const result: AutosaveResult = {
        success: true,
        timestamp,
        size: data.length,
      };
      
      for (const listener of this.listeners) {
        listener(result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        timestamp: Date.now(),
        size: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
  
  /**
   * Charge la dernière sauvegarde
   */
  loadLastBackup(): Project | null {
    const backups = this.listBackups();
    
    if (backups.length === 0) return null;
    
    const lastBackup = backups[0];
    const data = localStorage.getItem(lastBackup.id);
    
    if (!data) return null;
    
    try {
      const backup = JSON.parse(data);
      return JSON.parse(backup.data);
    } catch {
      return null;
    }
  }
  
  /**
   * Liste les sauvegardes disponibles
   */
  listBackups(): BackupMetadata[] {
    const backups: BackupMetadata[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith(this.config.storageKey)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const backup = JSON.parse(data);
            backups.push({
              id: backup.id,
              timestamp: backup.timestamp,
              projectName: backup.projectName,
              size: backup.size,
              entityCount: backup.entityCount,
              pointCount: backup.pointCount,
            });
          }
        } catch {
          // Ignorer
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Charge une sauvegarde spécifique
   */
  loadBackup(id: string): Project | null {
    const data = localStorage.getItem(id);
    
    if (!data) return null;
    
    try {
      const backup = JSON.parse(data);
      return JSON.parse(backup.data);
    } catch {
      return null;
    }
  }
  
  /**
   * Supprime une sauvegarde
   */
  deleteBackup(id: string): void {
    localStorage.removeItem(id);
  }
  
  /**
   * Nettoie les anciennes sauvegardes
   */
  private cleanupOldBackups(): void {
    const backups = this.listBackups();
    
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups);
      
      for (const backup of toDelete) {
        this.deleteBackup(backup.id);
      }
    }
  }
  
  /**
   * Sauvegarde la configuration
   */
  private saveConfig(): void {
    const configKey = `${this.config.storageKey}-config`;
    localStorage.setItem(configKey, JSON.stringify(this.config));
  }
  
  /**
   * Charge la configuration
   */
  private loadConfig(): void {
    const configKey = `${this.config.storageKey}-config`;
    const data = localStorage.getItem(configKey);
    
    if (data) {
      try {
        this.config = { ...this.config, ...JSON.parse(data) };
      } catch {
        // Garder la config par défaut
      }
    }
  }
  
  /**
   * Ajoute un listener
   */
  onSave(listener: (result: AutosaveResult) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Singleton
export const autosave = new AutosaveService();

/**
 * Hook React pour l'autosave
 */
export function useAutosave(project: Project) {
  return {
    save: () => autosave.save(project),
    loadLast: () => autosave.loadLastBackup(),
    listBackups: () => autosave.listBackups(),
    loadBackup: (id: string) => autosave.loadBackup(id),
    configure: (config: Partial<AutosaveConfig>) => autosave.configure(config),
  };
}