/**
 * Tests Unitaires - Géométrie
 */

import { describe, it, expect } from 'vitest';
import {
  distance2D,
  distance3D,
  azimuth,
  slopePercent,
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  rotatePoint,
  translatePoint,
  lineIntersection,
} from '../src/core/geometry';

describe('Distance', () => {
  it('distance 2D', () => {
    const d = distance2D({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(d).toBe(5);
  });
  
  it('distance 3D', () => {
    const d = distance3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 2 });
    expect(d).toBeCloseTo(3);
  });
});

describe('Azimut', () => {
  it('azimut Est', () => {
    const az = azimuth({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(az).toBeCloseTo(90);
  });
  
  it('azimut Nord', () => {
    const az = azimuth({ x: 0, y: 0 }, { x: 0, y: 1 });
    expect(az).toBeCloseTo(0);
  });
  
  it('azimut Ouest', () => {
    const az = azimuth({ x: 0, y: 0 }, { x: -1, y: 0 });
    expect(az).toBeCloseTo(270);
  });
});

describe('Pente', () => {
  it('pente 100%', () => {
    const p = slopePercent({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 10 });
    expect(p).toBe(100);
  });
});

describe('Surface', () => {
  it('surface carré unitaire', () => {
    const area = polygonArea([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(area).toBe(1);
  });
  
  it('périmètre carré', () => {
    const p = polygonPerimeter([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    expect(p).toBe(4);
  });
});

describe('Centroïde', () => {
  it('centroïde carré', () => {
    const c = polygonCentroid([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    expect(c.x).toBe(1);
    expect(c.y).toBe(1);
  });
});

describe('Transformation', () => {
  it('translation', () => {
    const p = translatePoint({ x: 1, y: 1 }, 2, 3);
    expect(p.x).toBe(3);
    expect(p.y).toBe(4);
  });
  
  it('rotation 90°', () => {
    const p = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, 90);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });
});

describe('Intersection', () => {
  it('intersection perpendiculaire', () => {
    const i = lineIntersection(
      { x: 0, y: 0 }, { x: 2, y: 2 },
      { x: 2, y: 0 }, { x: 0, y: 2 }
    );
    expect(i?.x).toBeCloseTo(1);
    expect(i?.y).toBeCloseTo(1);
  });
});