/**
 * useHistory Hook - Gestion Undo/Redo avec Command Pattern
 */

import { useState, useCallback } from 'react';

/**
 * Interface Command
 */
export interface Command {
  id: string;
  type: string;
  execute: () => void;
  undo: () => void;
  description: string;
  timestamp: number;
}

/**
 * Hook pour gérer l'historique des actions
 */
export function useHistory<T = unknown>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  
  /**
   * Exécute une commande et l'ajoute à l'historique
   */
  const execute = useCallback((
    command: Omit<Command, 'id' | 'timestamp'>
  ) => {
    const newCommand: Command = {
      ...command,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    // Exécuter la commande
    newCommand.execute();
    
    // Ajouter à l'historique undo
    setUndoStack(prev => [...prev, newCommand]);
    
    // Vider le stack redo
    setRedoStack([]);
    
    return newCommand;
  }, []);
  
  /**
   * Annule la dernière commande
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return null;
    
    const lastCommand = undoStack[undoStack.length - 1];
    
    // Annuler la commande
    lastCommand.undo();
    
    // Déplacer vers redo
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastCommand]);
    
    return lastCommand;
  }, [undoStack]);
  
  /**
   * Rétablit la dernière commande annulée
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;
    
    const lastCommand = redoStack[redoStack.length - 1];
    
    // Ré-exécuter la commande
    lastCommand.execute();
    
    // Déplacer vers undo
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, lastCommand]);
    
    return lastCommand;
  }, [redoStack]);
  
  /**
   * Efface l'historique
   */
  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);
  
  return {
    state,
    setState,
    execute,
    undo,
    redo,
    clear,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    history: undoStack,
  };
}

/**
 * Commandes prêtes à l'emploi
 */

export function createAddPointCommand(
  point: { x: number; y: number; z?: number; id: string },
  onAdd: (p: typeof point) => void,
  onRemove: (id: string) => void
): Omit<Command, 'id' | 'timestamp'> {
  return {
    type: 'add-point',
    description: `Ajouter point ${point.id}`,
    execute: () => onAdd(point),
    undo: () => onRemove(point.id),
  };
}

export function createMoveCommand(
  entityId: string,
  oldPosition: { x: number; y: number },
  newPosition: { x: number; y: number },
  onMove: (id: string, pos: { x: number; y: number }) => void
): Omit<Command, 'id' | 'timestamp'> {
  return {
    type: 'move',
    description: `Déplacer entité ${entityId}`,
    execute: () => onMove(entityId, newPosition),
    undo: () => onMove(entityId, oldPosition),
  };
}

export function createDeleteCommand(
  deletedEntities: { id: string; data: unknown }[],
  onDelete: (ids: string[]) => void,
  onRestore: (entities: { id: string; data: unknown }[]) => void
): Omit<Command, 'id' | 'timestamp'> {
  return {
    type: 'delete',
    description: `Supprimer ${deletedEntities.length} entités`,
    execute: () => onDelete(deletedEntities.map(e => e.id)),
    undo: () => onRestore(deletedEntities),
  };
}

export function createLayerPropertyCommand(
  layerId: string,
  property: string,
  oldValue: unknown,
  newValue: unknown,
  onUpdate: (id: string, prop: string, value: unknown) => void
): Omit<Command, 'id' | 'timestamp'> {
  return {
    type: 'layer-property',
    description: `Modifier ${property} du calque`,
    execute: () => onUpdate(layerId, property, newValue),
    undo: () => onUpdate(layerId, property, oldValue),
  };
}