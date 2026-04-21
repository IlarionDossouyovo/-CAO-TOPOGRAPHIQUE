/**
 * Tests Unitaires - Topographie
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSurface,
  analyzeSlope,
  calculate3DSurface,
  generateContours,
} from '../src/core/topography';
import { Point } from '../src/types';

describe('Surface', () => {
  it('surface carré', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const result = calculateSurface(points);
    expect(result.area).toBe(100);
  });
});

describe('Pente', () => {
  it('classification pente', () => {
    const point = { x: 0, y: 0, z: 0 };
    const neighbors: Point[] = [
      { x: 1, y: 0, z: 0.05 }, // 5%
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
    ];
    
    const result = analyzeSlope(point, neighbors, [5, 10, 15, 30]);
    expect(result.category).toBe('Faible');
  });
});

describe('Surface 3D', () => {
  it('surface triangle 3D', () => {
    const points: Point[] = [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 4, z: 0 },
    ];
    
    const area = calculate3DSurface(points, [[0, 1, 2]]);
    expect(area).toBeCloseTo(6);
  });
});

describe('Contours', () => {
  it('génération contours grille', () => {
    const points: Point[] = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 10 },
      { x: 10, y: 10, z: 20 },
      { x: 0, y: 10, z: 10 },
    ];
    
    const contours = generateContours(points, 0, 5);
    expect(contours.length).toBeGreaterThan(0);
  });
});