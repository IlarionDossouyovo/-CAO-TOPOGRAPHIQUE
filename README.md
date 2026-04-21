# CAO Topographique

Logiciel professionnel de Conception Assistée par Ordinateur dédié à la topographie.

## Fonctionnalités

### Phase 1 - MVP
- **Gestion de projets** avec systèmes de coordonnées (Lambert 93, UTM, WGS84)
- **Outils de dessin 2D** : point, ligne, polyligne, arc, cercle, rectangle, texte
- **Gestion des calques** avec visibilité et verrouillage
- **Zone de dessin interactive** avec grille paramétrable
- **Import/Export** : CSV, GeoJSON, KML, DXF, JSON natif
- **Calculs topométriques** : distances, surfaces, volumes, profils
- **Visualisation 3D** avec Three.js

### Phase 2 (en développement)
- Modélisation du terrain (MNT/TIN)
- Génération de courbes de niveau
- Profils en long et en travers
- Cubatures avancées
- Connexion aux instruments

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Compiler pour la production
npm run build
```

## Structure du projet

```
src/
├── components/        # Composants React
│   ├── Header.tsx   # Barre de menu
│   ├── Toolbar.tsx  # Outils de dessin
│   ├── Sidebar.tsx  # Calques & symboles
│   ├── Canvas.tsx   # Zone de dessin 2D
│   ├── View3D.tsx   # Visualisation 3D
│   └── ...
├── core/             # Algorithmes
│   ├── geometry/    # Géométrie 2D/3D
│   ├── topography/  # Calculs topo
│   └── calculation/ # Topométrie
├── services/         # Import/Export
├── types/           # Types TypeScript
└── styles/          # CSS
```

## Utilisation

1. **Créer un projet** : Fichier → Nouveau projet
2. **Sélectionner le système de coordonnées**
3. **Dessiner** : Utiliser les outils de la barre d'outils
4. **Gérer les calques** : Sidebar gauche
5. **Exporter** : Fichier → Exporter

## Technologies

- React 18 + TypeScript
- Three.js (3D)
- Vite (build)
- Proj4.js (projections)

## License

Propriétaire - Tous droits réservés
