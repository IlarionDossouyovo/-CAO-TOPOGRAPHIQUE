/**
 * Theme Service - Gestion des thèmes (sombre/clair)
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cao-topographique-theme';

/**
 * Hook pour gérer le thème
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Charger depuis localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });
  
  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);
  
  // Basculer le thème
  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);
  
  return { theme, setTheme, toggleTheme };
}

/**
 * Variables CSS du thème sombre
 */
export const darkTheme = `
  [data-theme='dark'] {
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-tertiary: #334155;
    --color-text-primary: #f8fafc;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #64748b;
    --color-border: #334155;
    --color-border-dark: #475569;
  }
`;

/**
 * Définitions de thèmes personnalisés
 */
export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const presetThemes: CustomTheme[] = [
  {
    id: 'default',
    name: 'Par défaut',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#0f172a',
    },
  },
  {
    id: 'blue',
    name: 'Bleu professionnel',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#f0f9ff',
      text: '#0c4a6e',
    },
  },
  {
    id: 'green',
    name: 'Vert topographe',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: '#ecfdf5',
      text: '#064e3b',
    },
  },
  {
    id: 'sepia',
    name: 'Sépia (papier)',
    colors: {
      primary: '#92400e',
      secondary: '#78350f',
      accent: '#d97706',
      background: '#fef3c7',
      text: '#451a03',
    },
  },
];