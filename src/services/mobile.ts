/**
 * Mobile App Service
 * React Native mobile app support and offline capabilities
 */

import { Project, TopographicPoint, Entity, Layer } from '../types';

/**
 * Configuration mobile
 */
export interface MobileConfig {
  offlineMode: boolean;
  syncOnWifi: boolean;
  cacheSize: number; // MB
  maxOfflineProjects: number;
}

/**
 * État de synchronisation mobile
 */
export interface MobileSyncState {
  online: boolean;
  syncing: boolean;
  lastSync: number | null;
  pendingChanges: number;
  offlineQueue: PendingChange[];
}

/**
 * Changement en attente
 */
export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'point' | 'entity' | 'layer';
  data: unknown;
  timestamp: number;
}

/**
 * Données mises en cache
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Service mobile
 */
class MobileService {
  private config: MobileConfig = {
    offlineMode: false,
    syncOnWifi: true,
    cacheSize: 100,
    maxOfflineProjects: 5,
  };
  
  private syncState: MobileSyncState = {
    online: true,
    syncing: false,
    lastSync: null,
    pendingChanges: 0,
    offlineQueue: [],
  };
  
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  
  /**
   * Initialise le service mobile
   */
  initialize(config?: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Écouter les événements online/offline
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
    
    // Charger les données en cache
    this.loadCache();
    
    console.log('Mobile service initialized', this.config);
  }
  
  /**
   * Met à jour la configuration
   */
  configure(config: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }
  
  /**
   * Obtient l'état de synchronisation
   */
  getSyncState(): MobileSyncState {
    return { ...this.syncState };
  }
  
  /**
   * Met en cache un projet
   */
  cacheProject(project: Project): void {
    const key = `project-${project.id}`;
    const entry: CacheEntry<Project> = {
      data: project,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
    };
    
    this.cache.set(key, entry);
    this.saveCache();
  }
  
  /**
   * Charge un projet depuis le cache
   */
  getCachedProject(projectId: string): Project | null {
    const key = `project-${projectId}`;
    const entry = this.cache.get(key) as CacheEntry<Project> | undefined;
    
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Liste les projets en cache
   */
  getCachedProjects(): { id: string; name: string; updatedAt: number }[] {
    const projects: { id: string; name: string; updatedAt: number }[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith('project-')) {
        const project = entry.data as Project;
        projects.push({
          id: project.id,
          name: project.name,
          updatedAt: entry.timestamp,
        });
      }
    }
    
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Supprime un projet du cache
   */
  removeCachedProject(projectId: string): void {
    const key = `project-${projectId}`;
    this.cache.delete(key);
    this.saveCache();
  }
  
  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.saveCache();
  }
  
  /**
   * Ajoute un changement à la file d'attente offline
   */
  queueOfflineChange(change: Omit<PendingChange, 'id' | 'timestamp'>): void {
    const pending: PendingChange = {
      ...change,
      id: 'change-' + Date.now(),
      timestamp: Date.now(),
    };
    
    this.syncState.offlineQueue.push(pending);
    this.syncState.pendingChanges = this.syncState.offlineQueue.length;
    
    // Sauvegarder la queue
    this.saveOfflineQueue();
  }
  
  /**
   * Synchronise les changements en attente
   */
  async syncPendingChanges(): Promise<boolean> {
    if (!this.syncState.online || this.syncState.syncing) {
      return false;
    }
    
    if (this.syncState.offlineQueue.length === 0) {
      return true;
    }
    
    this.syncState.syncing = true;
    
    try {
      // Traiter chaque changement
      for (const change of this.syncState.offlineQueue) {
        await this.processChange(change);
      }
      
      // Vider la queue
      this.syncState.offlineQueue = [];
      this.syncState.pendingChanges = 0;
      this.syncState.lastSync = Date.now();
      this.saveOfflineQueue();
      
      this.syncState.syncing = false;
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncState.syncing = false;
      return false;
    }
  }
  
  /**
   * Exporte les données pour le transfert mobile
   */
  exportForMobile(project: Project): Blob {
    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      project: {
        ...project,
        // Exclure les données volumineuses si nécessaire
      },
    };
    
    return new Blob([JSON.stringify(exportData)], { type: 'application/json' });
  }
  
  /**
   * Importe les données depuis le mobile
   */
  async importFromMobile(file: File): Promise<Project | null> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.version !== '1.0' || !data.project) {
        throw new Error('Invalid format');
      }
      
      return data.project as Project;
    } catch (error) {
      console.error('Import failed:', error);
      return null;
    }
  }
  
  /**
   * Génère un QR code pour le transfert
   */
  generateTransferQR(projectId: string): string {
    // Génère un QR code avec l'URL de partage
    const url = `cao-topo://transfer/${projectId}`;
    // Utiliser une bibliothèque QR dans une vraie implémentation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  }
  
  // Méthodes privées
  
  private handleOnline(): void {
    this.syncState.online = true;
    console.log('Device online');
    
    // Synchroniser si configuré
    if (this.config.syncOnWifi) {
      this.syncPendingChanges();
    }
  }
  
  private handleOffline(): void {
    this.syncState.online = false;
    console.log('Device offline');
  }
  
  private async processChange(change: PendingChange): Promise<void> {
    // Simuler l'envoi au serveur
    console.log('Processing change:', change);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  private loadCache(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const cached = localStorage.getItem('cao-mobile-cache');
      if (cached) {
        const entries = JSON.parse(cached) as [string, CacheEntry<unknown>][];
        this.cache = new Map(entries);
      }
      
      const queue = localStorage.getItem('cao-mobile-queue');
      if (queue) {
        this.syncState.offlineQueue = JSON.parse(queue);
        this.syncState.pendingChanges = this.syncState.offlineQueue.length;
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }
  
  private saveCache(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem('cao-mobile-cache', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }
  
  private saveOfflineQueue(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('cao-mobile-queue', JSON.stringify(this.syncState.offlineQueue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }
  
  private saveConfig(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('cao-mobile-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
}

// Singleton
export const mobileService = new MobileService();

/**
 * Hook React pour le service mobile
 */
export function useMobile() {
  return {
    initialize: (config?: Partial<MobileConfig>) => mobileService.initialize(config),
    configure: (config: Partial<MobileConfig>) => mobileService.configure(config),
    getSyncState: () => mobileService.getSyncState(),
    cacheProject: (project: Project) => mobileService.cacheProject(project),
    getCachedProject: (id: string) => mobileService.getCachedProject(id),
    getCachedProjects: () => mobileService.getCachedProjects(),
    removeCachedProject: (id: string) => mobileService.removeCachedProject(id),
    clearCache: () => mobileService.clearCache(),
    syncPendingChanges: () => mobileService.syncPendingChanges(),
    exportForMobile: (project: Project) => mobileService.exportForMobile(project),
    importFromMobile: (file: File) => mobileService.importFromMobile(file),
    generateTransferQR: (projectId: string) => mobileService.generateTransferQR(projectId),
  };
}