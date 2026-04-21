/**
 * Cloud Sync Service
 * Synchronisation multi-utilisateurs et stockage cloud
 */

import { Project, TopographicPoint, Entity, Layer } from '../types';

/**
 * Configuration du cloud
 */
export interface CloudConfig {
  provider: 'firebase' | 'supabase' | 'custom';
  apiKey?: string;
  projectId?: string;
  endpoint?: string;
  enableRealtime: boolean;
}

/**
 * Utilisateur connecté
 */
export interface CloudUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
}

/**
 * Verrouillage d'entité
 */
export interface EntityLock {
  entityId: string;
  userId: string;
  userName: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Événement de synchronisation
 */
export interface SyncEvent {
  type: 'create' | 'update' | 'delete' | 'lock' | 'unlock' | 'user_join' | 'user_leave';
  entityType: 'project' | 'entity' | 'layer' | 'point';
  entityId: string;
  userId: string;
  timestamp: number;
  data?: unknown;
}

/**
 * État de synchronisation
 */
export interface SyncState {
  connected: boolean;
  syncing: boolean;
  lastSync: number | null;
  pendingChanges: number;
  activeUsers: CloudUser[];
  locks: EntityLock[];
}

/**
 * Service de synchronisation cloud
 */
class CloudSyncService {
  private config: CloudConfig | null = null;
  private user: CloudUser | null = null;
  private state: SyncState = {
    connected: false,
    syncing: false,
    lastSync: null,
    pendingChanges: 0,
    activeUsers: [],
    locks: [],
  };
  
  private listeners: ((state: SyncState) => void)[] = [];
  private changeQueue: SyncEvent[] = [];
  private realtimeUnsubscribe: (() => void) | null = null;
  
  /**
   * Initialise le service
   */
  async initialize(config: CloudConfig): Promise<boolean> {
    this.config = config;
    
    try {
      // Simulation de connexion
      console.log('Cloud sync initializing...', config);
      
      this.updateState({ connected: true });
      
      // Charger les utilisateurs actifs
      await this.loadActiveUsers();
      
      // Setup realtime si activé
      if (config.enableRealtime) {
        this.setupRealtime();
      }
      
      return true;
    } catch (error) {
      console.error('Cloud sync init failed:', error);
      return false;
    }
  }
  
  /**
   * Connecte un utilisateur
   */
  async login(email: string, password: string): Promise<CloudUser | null> {
    // Simulation - en réel, utiliser Firebase/Supabase
    this.user = {
      id: 'user-' + Date.now(),
      email,
      name: email.split('@')[0],
      role: 'editor',
    };
    
    this.broadcastUserJoin();
    
    return this.user;
  }
  
  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    if (this.user) {
      this.broadcastUserLeave();
    }
    
    this.user = null;
    this.updateState({ connected: false });
    
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
  }
  
  /**
   * Sauvegarde le projet sur le cloud
   */
  async saveProject(project: Project): Promise<boolean> {
    if (!this.user || !this.config) {
      console.error('Not authenticated');
      return false;
    }
    
    this.updateState({ syncing: true });
    
    try {
      // Simuler la sauvegarde cloud
      const projectData = {
        ...project,
        lastModified: Date.now(),
        modifiedBy: this.user.id,
      };
      
      console.log('Saving to cloud:', project.name);
      
      // Émettre un événement de création
      this.queueChange({
        type: 'update',
        entityType: 'project',
        entityId: project.id,
        userId: this.user.id,
        timestamp: Date.now(),
        data: projectData,
      });
      
      this.updateState({ 
        syncing: false, 
        lastSync: Date.now() 
      });
      
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      this.updateState({ syncing: false });
      return false;
    }
  }
  
  /**
   * Charge un projet depuis le cloud
   */
  async loadProject(projectId: string): Promise<Project | null> {
    if (!this.user) return null;
    
    this.updateState({ syncing: true });
    
    try {
      // Simulation
      console.log('Loading from cloud:', projectId);
      
      this.updateState({ syncing: false, lastSync: Date.now() });
      
      return null; // Retournerait le vrai projet
    } catch (error) {
      console.error('Load failed:', error);
      this.updateState({ syncing: false });
      return null;
    }
  }
  
  /**
   * Liste les projets cloud
   */
  async listProjects(): Promise<{ id: string; name: string; updatedAt: number }[]> {
    if (!this.user) return [];
    
    // Simulation - retournerait la vraie liste
    return [
      { id: 'proj-1', name: 'Projet 1', updatedAt: Date.now() },
      { id: 'proj-2', name: 'Projet 2', updatedAt: Date.now() - 86400000 },
    ];
  }
  
  /**
   * Verrouille une entité pour édition
   */
  async lockEntity(entityId: string): Promise<boolean> {
    if (!this.user) return false;
    
    // Vérifier si déjà verrouillé
    const existingLock = this.state.locks.find(l => l.entityId === entityId);
    if (existingLock && existingLock.userId !== this.user.id) {
      console.warn('Entity already locked by', existingLock.userName);
      return false;
    }
    
    const lock: EntityLock = {
      entityId,
      userId: this.user.id,
      userName: this.user.name,
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
    };
    
    this.updateState({
      locks: [...this.state.locks.filter(l => l.entityId !== entityId), lock],
    });
    
    // Broadcast le verrouillage
    this.queueChange({
      type: 'lock',
      entityType: 'entity',
      entityId,
      userId: this.user.id,
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * Déverrouille une entité
   */
  async unlockEntity(entityId: string): Promise<boolean> {
    if (!this.user) return false;
    
    this.updateState({
      locks: this.state.locks.filter(l => l.entityId !== entityId),
    });
    
    // Broadcast le déverrouillage
    this.queueChange({
      type: 'unlock',
      entityType: 'entity',
      entityId,
      userId: this.user.id,
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * Vérifie si une entité est verrouillée
   */
  isLocked(entityId: string): boolean {
    const lock = this.state.locks.find(l => l.entityId === entityId);
    if (!lock) return false;
    
    // Vérifier si expiré
    if (lock.expiresAt < Date.now()) {
      this.updateState({
        locks: this.state.locks.filter(l => l.entityId !== entityId),
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtient l'état de synchronisation
   */
  getState(): SyncState {
    return { ...this.state };
  }
  
  /**
   * S'abonne aux changements d'état
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * S'abonne aux événements temps réel
   */
  onSyncEvent(handler: (event: SyncEvent) => void): () => void {
    // En réel,连接的WebSocket/Supabase Realtime
    console.log('Subscribed to sync events');
    
    return () => {
      console.log('Unsubscribed from sync events');
    };
  }
  
  // Méthodes privées
  
  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
  
  private queueChange(event: SyncEvent): void {
    this.changeQueue.push(event);
    this.updateState({ pendingChanges: this.changeQueue.length });
    
    // Traiter les changements
    this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    if (this.changeQueue.length === 0) return;
    
    // Traiter en batch
    const changes = [...this.changeQueue];
    this.changeQueue = [];
    
    // Envoyer au cloud
    console.log('Processing', changes.length, 'changes');
    
    this.updateState({ pendingChanges: this.changeQueue.length });
  }
  
  private async loadActiveUsers(): Promise<void> {
    // Simulation - charger les utilisateurs actifs
    this.updateState({
      activeUsers: this.user ? [this.user] : [],
    });
  }
  
  private setupRealtime(): void {
    console.log('Setting up realtime sync...');
    
    // En réel:连接 Firebase Realtime Database ou Supabase Realtime
    this.realtimeUnsubscribe = () => {
      console.log('Realtime disconnected');
    };
  }
  
  private broadcastUserJoin(): void {
    if (!this.user) return;
    
    this.updateState({
      activeUsers: [...this.state.activeUsers, this.user],
    });
    
    this.queueChange({
      type: 'user_join',
      entityType: 'project',
      entityId: '',
      userId: this.user.id,
      timestamp: Date.now(),
    });
  }
  
  private broadcastUserLeave(): void {
    if (!this.user) return;
    
    this.updateState({
      activeUsers: this.state.activeUsers.filter(u => u.id !== this.user!.id),
    });
    
    this.queueChange({
      type: 'user_leave',
      entityType: 'project',
      entityId: '',
      userId: this.user.id,
      timestamp: Date.now(),
    });
  }
}

// Singleton
export const cloudSync = new CloudSyncService();

/**
 * Hook React pour le cloud sync
 */
export function useCloudSync() {
  return {
    initialize: (config: CloudConfig) => cloudSync.initialize(config),
    login: (email: string, password: string) => cloudSync.login(email, password),
    logout: () => cloudSync.logout(),
    saveProject: (project: Project) => cloudSync.saveProject(project),
    loadProject: (id: string) => cloudSync.loadProject(id),
    listProjects: () => cloudSync.listProjects(),
    lockEntity: (id: string) => cloudSync.lockEntity(id),
    unlockEntity: (id: string) => cloudSync.unlockEntity(id),
    isLocked: (id: string) => cloudSync.isLocked(id),
    getState: () => cloudSync.getState(),
    subscribe: (listener: (state: SyncState) => void) => cloudSync.subscribe(listener),
    onSyncEvent: (handler: (event: SyncEvent) => void) => cloudSync.onSyncEvent(handler),
  };
}