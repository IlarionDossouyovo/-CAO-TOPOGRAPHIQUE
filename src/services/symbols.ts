/**
 * Symbols Library - NF P 98-332 normalized symbols
 */

export type SymbolCategory = 
  | 'building'
  | 'road'
  | 'vegetation'
  | 'water'
  | 'network'
  | 'boundary'
  | 'relief'
  | 'other';

export interface TopoSymbol {
  id: string;
  code: string;
  name: string;
  category: SymbolCategory;
  icon: string;
  color?: string;
  size?: number;
  rotation?: boolean;
  scale?: boolean;
  description?: string;
}

export const SYMBOLS: TopoSymbol[] = [
  // Building
  { id: 'bat-001', code: 'MAI', name: 'Maison', category: 'building', icon: '🏠', description: 'Maison individuelle' },
  { id: 'bat-002', code: 'HAN', name: 'Hangar', category: 'building', icon: '🏚', description: 'Hangar' },
  { id: 'bat-003', code: 'BAT', name: 'Batiment', category: 'building', icon: '🏢', description: 'Batiment collectif' },
  { id: 'bat-004', code: 'MUR', name: 'Mur', category: 'building', icon: '🧱', description: 'Mur de cloture' },
  { id: 'bat-005', code: 'CLT', name: 'Cloture', category: 'building', icon: '🚧', description: 'Cloture' },
  
  // Road
  { id: 'voi-001', code: 'ROU', name: 'Route', category: 'road', icon: '🛣', color: '#64748b', size: 2 },
  { id: 'voi-002', code: 'CHE', name: 'Chemin', category: 'road', icon: '🛤', color: '#94a3b8', size: 1.5 },
  { id: 'voi-003', code: 'SEN', name: 'Sentier', category: 'road', icon: '🥾', color: '#cbd5e1', size: 1 },
  
  // Vegetation
  { id: 'veg-001', code: 'ARB', name: 'Arbre', category: 'vegetation', icon: '🌳', color: '#10b981', rotation: true },
  { id: 'veg-002', code: 'HAI', name: 'Haie', category: 'vegetation', icon: '🌿', color: '#10b981', scale: true },
  { id: 'veg-003', code: 'RAP', name: 'Rapace', category: 'vegetation', icon: '🎋', color: '#10b981' },
  
  // Water
  { id: 'eau-001', code: 'RIV', name: 'Riviere', category: 'water', icon: '🌊', color: '#3b82f6', scale: true },
  { id: 'eau-002', code: 'FOS', name: 'Fosse', category: 'water', icon: '~~', color: '#3b82f6' },
  { id: 'eau-003', code: 'BAS', name: 'Bassin', category: 'water', icon: '⬭', color: '#3b82f6' },
  
  // Networks
  { id: 'res-001', code: 'ELEC', name: 'Ligne electrique', category: 'network', icon: '⚡', color: '#f59e0b', scale: true },
  { id: 'res-002', code: 'POT', name: 'Poteau', category: 'network', icon: '🗼', color: '#f59e0b', rotation: true },
  { id: 'res-003', code: 'BOI', name: 'Bouche incendie', category: 'network', icon: '🧯', color: '#ef4444' },
  { id: 'res-004', code: 'REG', name: 'Regard', category: 'network', icon: '⬡', color: '#64748b' },
  
  // Boundaries
  { id: 'lim-001', code: 'LIM', name: 'Limite commune', category: 'boundary', icon: '—', color: '#ef4444' },
  { id: 'lim-002', code: 'PRO', name: 'Propriete', category: 'boundary', icon: '—', color: '#ef4444' },
  
  // Relief
  { id: 'rel-001', code: 'CNC', name: 'Cone', category: 'relief', icon: '△', color: '#78716c' },
  { id: 'rel-002', code: 'ROCHE', name: 'Rocher', category: 'relief', icon: '⛰', color: '#78716c' },
  
  // Other
  { id: 'div-001', code: 'BEN', name: 'Banc', category: 'other', icon: '🪑' },
  { id: 'div-002', code: 'LAM', name: 'Lampadaire', category: 'other', icon: '💡' },
  { id: 'div-003', code: 'PON', name: 'Pont', category: 'other', icon: '🌉' },
  { id: 'div-004', code: 'PASS', name: 'Passage pieton', category: 'other', icon: '🚶' },
];

export function findSymbolByCode(code: string): TopoSymbol | undefined {
  return SYMBOLS.find(s => s.code === code);
}

export function getSymbolsByCategory(category: SymbolCategory): TopoSymbol[] {
  return SYMBOLS.filter(s => s.category === category);
}

export function searchSymbols(query: string): TopoSymbol[] {
  const q = query.toLowerCase();
  return SYMBOLS.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
}

export function getCategories(): { id: SymbolCategory; name: string; icon: string }[] {
  return [
    { id: 'building', name: 'Bati', icon: '🏠' },
    { id: 'road', name: 'Voirie', icon: '🛣' },
    { id: 'vegetation', name: 'Vegetation', icon: '🌳' },
    { id: 'water', name: 'Hydrographie', icon: '💧' },
    { id: 'network', name: 'Reseaux', icon: '⚡' },
    { id: 'boundary', name: 'Limites', icon: '🚧' },
    { id: 'relief', name: 'Relief', icon: '⛰' },
    { id: 'other', name: 'Divers', icon: '📍' },
  ];
}
