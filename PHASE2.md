# CAO Topographique - Cahier des Charges

## 1. PRÉSENTATION DU PROJET

**Nom** : CAO Topographique  
**Version** : 1.0.0  
**Type** : Application Desktop/Web - Logiciel professionnel de CAO topographique

### 1.1 Périmètre MVP (Phase 1)

| # | Module | Status | Détails |
|---|--------|--------|---------|
| 1.1.1 | Gestion de projets | ✅ 80% | Créer projet, coordonnées, unités |
| 1.1.2 | Import/Export | ✅ 60% | CSV, GeoJSON, KML, DXF |
| 1.1.3 | Points topo | ✅ 60% | Création, codification |
| 1.1.4 | Outils dessin 2D | ✅ 70% | Ligne, polyligne, arc, cercle |
| 1.1.5 | Calques | ✅ 80% | 8 layers, visibilité |
| 1.1.6 | Visualisation 3D | ✅ 50% | Three.js, navigation |
| 1.1.7 | Calculs base | ✅ 60% | Distance, azimut, surface |

---

## 2. MODULES À COMPLÉTER

### 2.1 Import/Export - Extension Formats

**Priorité : HAUTE**

| Format | Extension | Status | Complexité |
|-------|-----------|--------|-----------|
| DWG | .dwg | ⏳ | Moyenne |
| Shapefile | .shp | ⏳ | Moyenne |
| LandXML | .xml | ⏳ | Moyenne |
| SVG | .svg | ⏳ | Faible |
| Excel | .xlsx | ⏳ | Moyenne |
| RINEX | .rnx/.obs | ⏳ | Haute |
| GSI | .gsi | ⏳ | Haute |
| RW5 | .rw5 | ⏳ | Haute |
| JOB/DC3 | .job | ⏳ | Haute |

**Équipe requise** : 1 développeur, 2 semaines

---

### 2.2 Connexion Instruments

**Priorité : MOYENNE**

```
Équipements à supporter :
- Leica TS16/TS13 (GeoCOM)
- Trimble S7/S9 (RW5)
- Topcon GPT-9000 (JOB/DC3)
- Sokkia FX/FY (propriétaire)
- GPS/GNSS (NMEA-0183, RINEX)

Protocoles :
- USB série
- Bluetooth SPP
- Wi-Fi TCP/IP
- WebSocket temps réel
```

**Équipe requise** : 1 développeur, 1 instrument, 3 semaines

---

### 2.3 Module TIN/Triangulation

**Priorité : HAUTE**

```
Algorithmes à implémenter :

1. Delaunay (Bowyer-Watson)
   ├── Triangulation automatique
   ├── Gestion contraintes
   └── Optimisation

2. Breaklines
   ├── Lignes dures (routes, murs)
   └── Lignes meubles (fossés)

3. Simplification
   └── Réduction sommets (50-70%)
```

**Formule Héron** :
```
A = √(s(s-a)(s-b)(s-c))
où s = (a+b+c)/2 (demi-périmètre)
```

**Équipe requise** : 1 développeur, 3 semaines

---

### 2.4 Courbes de Niveau

**Priorité : HAUTE**

```
Paramètres :
- Équidistance (ex: 0.5m, 1m, 2m)
- Intervalles majeurs (5x équidistance)
- Lissage (factor 0.1-1.0)
- Style (couleur, épaisseur)

Algorithme :
1. Extraction isocontours
2. Lissage Chaikin/Spline
3. Classification majeur/intermédiaire
4. Placement étiquettes
```

**Équipe requise** : 1 développeur, 2 semaines

---

### 2.5 Profils en Long

**Priorité : HAUTE**

```
Fonctionnalités :
- Axe (polyligne)
- Extraction TN automatique
- Projet (TN + projet superposé)
- Cubatures cumulées par section
- Échelles H/V indépendantes

Calculs :
- Volume = Σ (Ai + Ai+1)/2 × d
- Déblai = section sous projet
- Remblai = section au-dessus projet
```

**Sortie** :
- Tableau Excel
- PDF profil
- Vue 3D

**Équipe requise** : 1 développeur, 2 semaines

---

### 2.6 Profils en Travers

**Priorité : HAUTE**

```
Paramètres :
- Axe mère (profil long)
- Espacement (ex: 10m, 20m)
- Largeur (ex: 2×20m = 40m)
- Nombre de points (ex: 5 par côté)

Génération :
1. Droites perpendiculaires à axe
2. Extraction altitudes TN
3. Intersection projet
4. Calcul surfaces
```

**Équipe requise** : 1 développeur, 2 semaines

---

### 2.7 Cubatures (Volumes)

**Priorité : HAUTE**

```
Méthodes :

1. Profils en travers
   V = Σ (Si + Si+1)/2 × d
    
2. MNT (différence)
   V = Σ ((Zi - Pi) × Ai)
   où Zi = altitude naturelle
         Pi = altitude projet
         Ai = aire элемента

3. TIN
   V = Σ (h × aire)

Paramètres :
- Coef. foisonnement (ex: 1.25)
- Décapage (ex: 0.20m)
```

**Sortie** :
- Tableau volumes
- Courbe des masses
- Export Excel

**Équipe requise** : 1 développeur, 2 semaines

---

### 2.8 Analyse Topographique

**Priorité : MOYENNE**

```
Analyse de pente :
- Classification (<5%, 5-10%, 10-15%, >15%)
- Carte couleurs
- Zones risque

Bassins versants :
- Direction écoulement (D8)
- Accumulation flux
- Extraction talwegs

Visibilité :
- Ligne de vue
- Zone visible (rayon R, hauteur H)
- Cône visuel 360°
```

**Équipe requise** : 1 développeur, 3 semaines

---

## 3. FONCTIONNALITÉS COMPLÉMENTAIRES

### 3.1 Symboles & Bibliothèque

```
Symboles normalisés (NF P 98-332) :
- Bâti : maison, hangar, mur
- Voirie : route, chemin, trottoir
- Végétation : arbre, haie
- Réseaux : poteau, regard, bouche
- Hydrographie : eau, fossé
- Mobilier : banc, lampadaire

Personnalisation :
- Création SVG interne
- Import SVG/DXF
- Bibliothèque utilisateur
```

### 3.2 Enregistrement Auto

```
Configuration :
- Intervalle (1-60 min, défaut 5)
- Nombre de备份 (1-100)
- Emplacement (local/cloud)

Historique :
- Timeline visuelle
- Restauration-point
- Comparaison versions
```

### 3.3 Undo/Redo

```
Implémentation :
- Command Pattern
- Pile illimitée
- Regroupement actions

Types d'actions :
- Création entité
- Modification point
- Propriétés calque
- Transformation
- Suppression
```

---

## 4. TESTS & QUALITÉ

### 4.1 Couverture Cible

| Type | Cible | Actuel |
|------|------|-------|
| Unitaires | > 80% | 0% |
| Intégration | > 60% | 0% |
| E2E | Scénarios principaux | - |

### 4.2 Benchmarks Performance

| Opération | Cible | Status |
|----------|------|-------|
| Chargement 10k points | < 2s | ⏳ |
| Génération courbes | < 5s | ⏳ |
| Affichage 2D | 60 FPS | ⏳ |
| Affichage 3D | 30 FPS | ⏳ |
|Réponse UI | < 100ms | ⏳ |

---

## 5. INFORMATIONS TECHNIQUES

### 5.1 Stack Technique

```
Frontend :
- React 18 + TypeScript
- Three.js (3D)
- Vite (build)

Calculs :
- Proj4.js (géodésie)
- Math.js (maths)

Styles :
- CSS Design System
- Responsive

Tests :
- Vitest (unitaires)
- Playwright (E2E)
```

### 5.2 Structure Projet

```
src/
├── components/       # UI (8 fichiers)
├── core/          # Algorithmes (3 dossiers)
│   ├── geometry/
│   ├── topography/
│   └── calculation/
├── services/      # Services (2 fichiers)
├── types/        # Définitions
└── styles/       # CSS
```

---

## 6. PLANNING

### Phase 1 (MVP) - Complété
- [x] Semaines 1-4 : Architecture, base
- [x] Semaines 5-8 : Composants core
- [x] Semaine 9 : Build, tests initiaux

### Phase 2 (Extension) - À faire
- Semaines 10-12 : TIN, Courbes, Profils
- Semaines 13-15 : Cubatures, Analyse
- Semaine 16 : Tests, optimisations

### Phase 3 (Lancement)
- Semaine 17 : Béta privée
- Semaine 18 : Béta publique
- Semaine 19 : Lancement

---

## 7. ÉQUIPE & RESSOURCES

### Équipe Requise
- Développeur Full Stack : 1
- Designer UI : 0.5 (optionnel)
- Expert Topographe : 0.5 (consultant)

### Outils
- GitHub Actions (CI/CD)
- Figma (UI)
- Jira/Linear (gestion)

---

*Document généré automatiquement - CAO Topographique*