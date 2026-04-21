# Roadmap du Projet CAO Topographique

## Résumé desÉtapes

### ✅ Phase 1 - MVP : COMPLETÉ

| Module | Fonctionnalité | Status |
|--------|--------------|--------|
| **1.1 Gestion de Projets** | | |
| | Création projet avec paramètres géodésiques | ✅ |
| | Systèmes de coordonnées (Lambert, UTM) | ✅ |
| | Unités (m, pieds, grades) | ✅ |
| | Échelle de travail | ✅ |
| | Métadonnées (client, date) | ✅ |
| | Enregistrement automatique | ⏳ |
| | Historique des versions | ⏳ |
| **1.2 Import/Export** | | |
| | Import CSV/TXT | ✅ |
| | Import GeoJSON | ✅ |
| | Export CSV | ✅ |
| | Export GeoJSON | ✅ |
| | Export KML | ✅ |
| | Export DXF | ✅ |
| | Export JSON natif | ✅ |
| **1.3 Points Topographiques** | | |
| | Création de points | ✅ |
| | Numrotation séquentielle | ✅ |
| | Codes descriptifs | ✅ |
| | Modification en masse | ⏳ |
| | Transformation coordonnées | ⏳ |
| **1.4 Outils de Dessin 2D** | | |
| | Ligne | ✅ |
| | Polyligne | ✅ |
| | Arc, Cercle | ✅ |
| | Rectangle, Polygone | ✅ |
| | Texte | ⏳ |
| | Symboles | ⏳ |
| **1.5 Gestion des Calques** | | |
| | Création calques | ✅ |
| | Visibilité on/off | ✅ |
| | Verrouillage | ✅ |
| | Couleur, type ligne | ✅ |
| | Ordre d'affichage | ✅ |
| **1.6 Visualisation 3D** | | |
| | Vue perspective | ✅ |
| | Navigation orbitale | ✅ |
| | Grille 3D | ✅ |
| | Courbes de niveau | ⏳ |
| **1.7 Calculs de Base** | | |
| | Distance 2D/3D | ✅ |
| | Azimut, gisement | ✅ |
| | Pente %/degrés | ✅ |
| | Surface, périmètre | ✅ |
| | Centroïde | ✅ |

### ⏳ Phase 2 - Extension (À développer)

| Module | Fonctionnalité | Priority |
|--------|--------------|----------|
| **2.1 Modélisation Terrain** | | |
| | Triangulation TIN (Delaunay) | Haute |
| | Génération MNT/GRID | Haute |
| | Breaklines | Moyenne |
| | Lignes de rupture | Moyenne |
| **2.2 Courbes de Niveau** | | |
| | Génération automatique | Haute |
| | Lissage | Haute |
| | Étiquetage automatique | Moyenne |
| | Style différencié | Moyenne |
| **2.3 Profils** | | |
| | Profil en long | Haute |
| | Profil en travers | Haute |
| | Superposition TN/projet | Haute |
| | Cubatures profils | Haute |
| **2.4 Volumes (Cubatures)** | | |
| | Méthode profils | Haute |
| | Méthode MNT | Haute |
| | Coef. foisonnement | Moyenne |
| | Courbe deks volumes | Moyenne |
| **2.5 Analyse** | | |
| | Analyse de pente | Moyenne |
| | Bassin versant | Moyenne |
| | Visibilité | Basse |

### ❌ Phase 3 - Optimisation (Non commencé)

| Module | Fonctionnalité |
|--------|---------------|
| **3.1 Intelligence Artificielle** | |
| | Détection automatique |
| | Classification |
| **3.2 Module Collaboratif** | |
| | Multi-utilisateurs |
| | Syncronisation temps réel |
| **3.3 Application Mobile** | |
| | iOS/Android |
| | Mode hors-ligne |

---

## Détails des Modules à Compléter

### Module Import/Export - Extension Formats

```
Fichiers à implémenter :
- DWG (AutoCAD) - lecture/écriture
- Shapefile (ESRI)
- LandXML
- SVG
- PDF (via jsPDF)
- Excel (xlsx)
- RINEX (GPS/GNSS)
- GSI (Leica)
- RW5 (Trimble)
- JOB/DC3 (Topcon)
```

### Module Connexion Instruments

```
Protocoles à implémenter :
- GeoCOM (Leica)
- SDK propriétaires
- Bluetooth/Wi-Fi
- NMEA-0183 (GPS)
- TCP/IP streamer
```

### Module TIN - Algorithmes

```typescript
// Delaunay triangulation à implémenter
- Algorithme Bowyer-Watson
- Gestion des contraintes
- Lignes de rupture
- Simplification
```

### Module Profils - Calculs

```
Profils en long :
- Extraction automatique TN
- Calcul проекта
- Cubatures cumulées
- Échelles H/V indépendantes

Profils en travers :
- Génération automatique
- Espacement paramétrable
- Largeurs configurables
```

### Module Cubatures - Méthodes

```
- Méthode des sections
- Méthode prisme
-Méthode TIN différentielle
- CourbeUsage(result)
- Export tableaux
```

---

## Calendrier Prévisionnel

### MVP (6 mois) - Phase 1
- [x] Mois 1-2 : Conception, architecture
- [x] Mois 2-5 : Développement core (en cours)
- [ ] Mois 5-6 : Tests, corrections

### Extension (12 mois) - Phase 2
- Mois 7-9 : MNT, courbes de niveau
- Mois 9-10 : Profils, cubatures
- Mois 10-12 : Analyse, optimisation

### Optimisation (18 mois) - Phase 3
- Mois 12-14 : Béta privée
- Mois 14-15 : Béta publique
- Mois 15 : Lancement

---

## Statut des Tests

| Catégorie | Couverture | Status |
|-----------|------------|--------|
| Unitaires | 0% | À écrire |
| Intégration | 0% | À écrire |
| Fonctionnels | 0% | À écrire |
| Performance | ⏳ | Non testé |

---

## Dependencies à Ajouter

```json
{
  "manquantes": [
    "dxf-writer",
    "shapefile",
    "xlsx",
    "delaunator"
  ]
}
```

---

## Documentation à Créer

- [x] README.md
- [ ] Manuel utilisateur (PDF)
- [ ] Aide en ligne HTML
- [ ] Tutoriels vidéo
- [ ] Documentation API
- [ ] Spécifications techniques