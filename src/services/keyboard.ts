/**
 * Keyboard Shortcuts Service
 * Gestion des raccourcis clavier
 */

import { useEffect, useCallback } from 'react';
import { DrawingTool } from '../types';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

/**
 * Liste des raccourcis par défaut
 */
export function getDefaultShortcuts(
  tools: {
    setTool: (tool: DrawingTool) => void;
    undo: () => void;
    redo: () => void;
    save: () => void;
    open: () => void;
    newProject: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    zoomFit: () => void;
    toggleGrid: () => void;
    delete: () => void;
    selectAll: () => void;
    copy: () => void;
    paste: () => void;
  }
): ShortcutCategory[] {
  return [
    {
      name: 'Fichier',
      shortcuts: [
        { key: 'n', ctrl: true, ...tools.newProject, description: 'Nouveau projet' },
        { key: 'o', ctrl: true, ...tools.open, description: 'Ouvrir' },
        { key: 's', ctrl: true, ...tools.save, description: 'Enregistrer' },
        { key: 's', ctrl: true, shift: true, action: tools.save, description: 'Enregistrer sous' },
      ],
    },
    {
      name: 'Éditions',
      shortcuts: [
        { key: 'z', ctrl: true, ...tools.undo, description: 'Annuler' },
        { key: 'y', ctrl: true, ...tools.redo, description: 'Refaire' },
        { key: 'c', ctrl: true, ...tools.copy, description: 'Copier' },
        { key: 'v', ctrl: true, ...tools.paste, description: 'Coller' },
        { key: 'a', ctrl: true, ...tools.selectAll, description: 'Tout sélectionner' },
        { key: 'Delete', action: tools.delete, description: 'Supprimer' },
      ],
    },
    {
      name: 'Affichage',
      shortcuts: [
        { key: '=', ctrl: true, ...tools.zoomIn, description: 'Zoom avant' },
        { key: '-', ctrl: true, ...tools.zoomOut, description: 'Zoom arrière' },
        { key: '0', ctrl: true, ...tools.zoomFit, description: 'Zoom étendue' },
        { key: 'g', ctrl: true, ...tools.toggleGrid, description: 'Afficher grille' },
      ],
    },
    {
      name: 'Outils',
      shortcuts: [
        { key: 'l', action: () => tools.setTool('line'), description: 'Outil ligne' },
        { key: 'p', action: () => tools.setTool('polyline'), description: 'Outil polyligne' },
        { key: 'c', action: () => tools.setTool('circle'), description: 'Outil cercle' },
        { key: 'r', action: () => tools.setTool('rectangle'), description: 'Outil rectangle' },
        { key: 'a', action: () => tools.setTool('arc'), description: 'Outil arc' },
        { key: 't', action: () => tools.setTool('text'), description: 'Outil texte' },
        { key: 's', action: () => tools.setTool('select'), description: 'Outil sélection' },
        { key: 'm', action: () => tools.setTool('measure'), description: 'Outil mesure' },
      ],
    },
  ];
}

/**
 * Hook pour gérer les raccourcis clavier
 */
export function useKeyboardShortcuts(shortcuts: ShortcutCategory[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ne pas activer si dans un input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    for (const category of shortcuts) {
      for (const shortcut of category.shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Raccourcis sous forme de Map pour recherche rapide
 */
export function createShortcutMap(shortcuts: ShortcutCategory[]): Map<string, Shortcut> {
  const map = new Map<string, Shortcut>();
  
  for (const category of shortcuts) {
    for (const shortcut of category.shortcuts) {
      const key = [
        shortcut.ctrl ? 'ctrl+' : '',
        shortcut.shift ? 'shift+' : '',
        shortcut.alt ? 'alt+' : '',
        shortcut.key,
      ].join('');
      
      map.set(key.toLowerCase(), shortcut);
    }
  }
  
  return map;
}