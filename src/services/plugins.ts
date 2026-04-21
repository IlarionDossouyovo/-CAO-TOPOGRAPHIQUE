/**
 * API and Plugin System
 * Extensibility framework for CAO Topographique
 */

import { TopographicPoint, Entity, Layer, Point } from '../types';

/**
 * Type de plugin
 */
export type PluginType = 'tool' | 'import' | 'export' | 'analysis' | 'render' | 'custom';

/**
 * Manifeste d'un plugin
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  type: PluginType;
  main: string;
  dependencies?: string[];
  permissions?: string[];
}

/**
 * Plugin chargé
 */
export interface Plugin {
  manifest: PluginManifest;
  instance: PluginInstance;
}

/**
 * Instance de plugin
 */
export interface PluginInstance {
  initialize: () => Promise<void>;
  terminate: () => Promise<void>;
  getName: () => string;
  getVersion: () => string;
  execute?: (context: PluginContext, ...args: unknown[]) => unknown;
}

/**
 * Contexte d'exécution du plugin
 */
export interface PluginContext {
  // Project data
  getProject: () => { name: string; id: string } | null;
  getPoints: () => TopographicPoint[];
  getEntities: () => Entity[];
  getLayers: () => Layer[];
  
  // Operations
  addPoint: (point: Omit<TopographicPoint, 'id'>) => TopographicPoint;
  addEntity: (entity: Omit<Entity, 'id'>) => Entity;
  updateEntity: (id: string, data: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  
  // Layers
  addLayer: (layer: Omit<Layer, 'id'>) => Layer;
  setActiveLayer: (id: string) => void;
  
  // UI
  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  registerTool: (tool: PluginTool) => void;
  addMenuItem: (item: PluginMenuItem) => void;
  
  // Events
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  
  // Utils
  getCoordinateSystem: () => string;
  transformCoordinates: (x: number, y: number, from: string, to: string) => [number, number];
}

/**
 * Outil personnalisé
 */
export interface PluginTool {
  id: string;
  name: string;
  icon: string;
  shortcut?: string;
  cursor?: string;
  onActivate: () => void;
  onDeactivate: () => void;
  onMouseDown: (event: PluginMouseEvent) => void;
  onMouseMove: (event: PluginMouseEvent) => void;
  onMouseUp: (event: PluginMouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export interface PluginMouseEvent {
  x: number;
  y: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

/**
 * Menu personnalisé
 */
export interface PluginMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  submenu?: PluginMenuItem[];
  action: () => void;
}

/**
 * API Core exposes aux plugins
 */
export class CAO_API {
  private points: TopographicPoint[] = [];
  private entities: Entity[] = [];
  private layers: Layer[] = [];
  private activeLayer: string | null = null;
  private project: { name: string; id: string } | null = null;
  private coordinateSystem = 'lambert93';
  
  private eventHandlers: Map<string, Set<() => void>> = new Map();
  private registeredTools: Map<string, PluginTool> = new Map();
  private menuItems: PluginMenuItem[] = [];
  
  // Setters for internal state
  setProject(project: { name: string; id: string } | null): void {
    this.project = project;
  }
  
  setPoints(points: TopographicPoint[]): void {
    this.points = points;
  }
  
  setEntities(entities: Entity[]): void {
    this.entities = entities;
  }
  
  setLayers(layers: Layer[]): void {
    this.layers = layers;
  }
  
  setActiveLayer(layerId: string | null): void {
    this.activeLayer = layerId;
  }
  
  setCoordinateSystem(system: string): void {
    this.coordinateSystem = system;
  }
  
  // Context for plugins
  getContext(): PluginContext {
    const self = this;
    
    return {
      getProject: () => self.project,
      getPoints: () => [...self.points],
      getEntities: () => [...self.entities],
      getLayers: () => [...self.layers],
      
      addPoint: (point) => {
        const newPoint: TopographicPoint = {
          ...point,
          id: 'point-' + Date.now(),
        };
        self.points.push(newPoint);
        self.emit('point:add', newPoint);
        return newPoint;
      },
      
      addEntity: (entity) => {
        const newEntity: Entity = {
          ...entity,
          id: 'entity-' + Date.now(),
        };
        self.entities.push(newEntity);
        self.emit('entity:add', newEntity);
        return newEntity;
      },
      
      updateEntity: (id, data) => {
        const index = self.entities.findIndex(e => e.id === id);
        if (index >= 0) {
          self.entities[index] = { ...self.entities[index], ...data };
          self.emit('entity:update', self.entities[index]);
        }
      },
      
      deleteEntity: (id) => {
        self.entities = self.entities.filter(e => e.id !== id);
        self.emit('entity:delete', id);
      },
      
      addLayer: (layer) => {
        const newLayer: Layer = {
          ...layer,
          id: 'layer-' + Date.now(),
        };
        self.layers.push(newLayer);
        self.emit('layer:add', newLayer);
        return newLayer;
      },
      
      setActiveLayer: (id) => {
        self.activeLayer = id;
        self.emit('layer:activate', id);
      },
      
      showNotification: (message, type) => {
        console.log(`[${type}] ${message}`);
        self.emit('notification', { message, type });
      },
      
      registerTool: (tool) => {
        self.registeredTools.set(tool.id, tool);
        self.emit('tool:register', tool);
      },
      
      addMenuItem: (item) => {
        self.menuItems.push(item);
        self.emit('menu:add', item);
      },
      
      on: (event, handler) => {
        if (!self.eventHandlers.has(event)) {
          self.eventHandlers.set(event, new Set());
        }
        self.eventHandlers.get(event)!.add(handler);
      },
      
      off: (event, handler) => {
        self.eventHandlers.get(event)?.delete(handler);
      },
      
      getCoordinateSystem: () => self.coordinateSystem,
      
      transformCoordinates: (x, y, from, to) => {
        // Basic passthrough - real implementation would use proj4
        return [x, y];
      },
    };
  }
  
  // Events
  private emit(event: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler());
    }
    
    // Also emit to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler());
    }
  }
  
  // Get registered tools
  getTools(): Map<string, PluginTool> {
    return this.registeredTools;
  }
  
  // Get menu items
  getMenuItems(): PluginMenuItem[] {
    return this.menuItems;
  }
}

// Singleton API
export const caoAPI = new CAO_API();

/**
 * Plugin Manager
 */
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private api: CAO_API = caoAPI;
  
  /**
   * Charge un plugin
   */
  async loadPlugin(manifest: PluginManifest, code: string): Promise<boolean> {
    try {
      // Create plugin instance from code
      // In real implementation, this would use a sandboxed environment
      const pluginFactory = new Function('api', 'return ' + code);
      const instance = pluginFactory(this.api.getContext());
      
      await instance.initialize();
      
      const plugin: Plugin = {
        manifest,
        instance,
      };
      
      this.plugins.set(manifest.id, plugin);
      
      console.log(`Plugin loaded: ${manifest.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to load plugin ${manifest.id}:`, error);
      return false;
    }
  }
  
  /**
   * Décharge un plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    try {
      await plugin.instance.terminate();
      this.plugins.delete(pluginId);
      console.log(`Plugin unloaded: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      return false;
    }
  }
  
  /**
   * Liste les plugins chargés
   */
  getLoadedPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }
  
  /**
   * Exécute un plugin
   */
  execute(pluginId: string, ...args: unknown[]): unknown {
    const plugin = this.plugins.get(pluginId);
    if (!plugin?.instance.execute) return null;
    
    return plugin.instance.execute(this.api.getContext(), ...args);
  }
}

export const pluginManager = new PluginManager();

/**
 * Exemple de plugin simple
 */
export const EXAMPLE_PLUGIN_CODE = `
{
  initialize: async function() {
    console.log('Plugin initialized');
  },
  terminate: async function() {
    console.log('Plugin terminated');
  },
  getName: function() { return 'Example Plugin'; },
  getVersion: function() { return '1.0.0'; },
  execute: function(api, args) {
    api.showNotification('Plugin executed!', 'success');
    return { success: true };
  }
}
`;