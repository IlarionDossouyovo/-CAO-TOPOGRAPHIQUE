import { FC, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Point, Entity } from '../types';

// Terrain mesh component
function TerrainMesh({ points, triangles }: { points: Point[]; triangles: number[][] }) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    
    // Create vertices from points
    for (const point of points) {
      vertices.push(point.x, point.y, point.z || 0);
      
      // Color based on elevation
      const z = point.z || 0;
      const normalizedZ = Math.max(0, Math.min(1, (z + 10) / 30));
      colors.push(
        0.2 + normalizedZ * 0.3,
        0.5 + normalizedZ * 0.3,
        0.2
      );
    }
    
    // Create indices from triangles
    const indices: number[] = [];
    for (const tri of triangles) {
      indices.push(tri[0], tri[1], tri[2]);
    }
    
    if (vertices.length > 0) {
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
    }
    
    return geo;
  }, [points, triangles]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// Contour line component
function ContourLines({ points, interval }: { points: Point[]; interval: number }) {
  const lines = useMemo(() => {
    if (points.length < 2) return [];
    
    const elevations = [...new Set(points.map(p => Math.round((p.z || 0) / interval) * interval))].sort((a, b) => a - b);
    
    return elevations.map(elevation => {
      const levelPoints = points.filter(p => Math.abs((p.z || 0) - elevation) < interval / 2);
      if (levelPoints.length < 2) return null;
      
      const isMajor = elevation % (interval * 5) === 0;
      
      return {
        points: levelPoints,
        elevation,
        isMajor,
      };
    }).filter(Boolean);
  }, [points, interval]);
  
  return (
    <>
      {lines.map((line: any, i: number) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={line.points.length}
              array={new Float32Array(line.points.flatMap(p => [p.x, p.y, (p.z || 0) + 0.05]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={line.isMajor ? '#475569' : '#94a3b8'} 
            linewidth={line.isMajor ? 2 : 1}
          />
        </line>
      ))}
    </>
  );
}

// Entity 3D component
function Entity3D({ entity }: { entity: Entity }) {
  if (entity.type === 'line' && entity.points.length >= 2) {
    return (
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={entity.points.length}
            array={new Float32Array(entity.points.flatMap(p => [p.x, p.y, p.z || 0]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={entity.style.color} linewidth={entity.style.lineWidth} />
      </line>
    );
  }
  
  if (entity.type === 'circle' && entity.points.length >= 2) {
    const center = entity.points[0];
    const radius = entity.points[1] ? 
      Math.sqrt((entity.points[1].x - center.x) ** 2 + (entity.points[1].y - center.y) ** 2) : 1;
    
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, center.y, center.z || 0]}>
        <ringGeometry args={[radius - 0.1, radius, 32]} />
        <meshBasicMaterial color={entity.style.color} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  
  return null;
}

// Point marker component
function PointMarker({ point, color = '#ef4444' }: { point: Point; color?: string }) {
  return (
    <mesh position={[point.x, point.y, point.z || 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Scene component
function Scene({ 
  points, 
  entities, 
  triangles,
  showGrid = true,
  showContours = true,
  contourInterval = 1,
}: {
  points: Point[];
  entities: Entity[];
  triangles?: number[][];
  showGrid?: boolean;
  showContours?: boolean;
  contourInterval?: number;
}) {
  const { camera } = useThree();
  
  // Calculate bounds
  const bounds = useMemo(() => {
    if (points.length === 0) {
      return { minX: -50, maxX: 50, minY: -50, maxY: 50, minZ: 0, maxZ: 10 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z || 0);
      maxZ = Math.max(maxZ, p.z || 0);
    }
    
    // Add padding
    const padding = Math.max(maxX - minX, maxY - minY) * 0.1;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
      minZ,
      maxZ: maxZ + 5,
    };
  }, [points]);
  
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera 
        makeDefault 
        position={[
          (bounds.minX + bounds.maxX) / 2,
          (bounds.minY + bounds.maxY) / 2 - 50,
          30
        ]} 
        fov={60}
      />
      
      {/* Controls */}
      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={200}
      />
      
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -10]} intensity={0.3} />
      
      {/* Grid */}
      {showGrid && (
        <Grid
          position={[(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, bounds.minZ]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#e2e8f0"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#94a3b8"
          fadeDistance={200}
          fadeStrength={1}
          followCamera={false}
        />
      )}
      
      {/* Terrain mesh */}
      {triangles && triangles.length > 0 && (
        <TerrainMesh points={points} triangles={triangles} />
      )}
      
      {/* Contour lines */}
      {showContours && points.length > 0 && (
        <ContourLines points={points} interval={contourInterval} />
      )}
      
      {/* Points */}
      {points.map((point, i) => (
        <PointMarker key={i} point={point} />
      ))}
      
      {/* Entities */}
      {entities.map((entity) => (
        <Entity3D key={entity.id} entity={entity} />
      ))}
    </>
  );
}

// Main 3D View component
interface View3DProps {
  points: Point[];
  entities: Entity[];
  triangles?: number[][];
  showGrid?: boolean;
  showContours?: boolean;
  contourInterval?: number;
}

export const View3D: FC<View3DProps> = ({
  points,
  entities,
  triangles,
  showGrid = true,
  showContours = true,
  contourInterval = 1,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }}>
      <Canvas shadows>
        <Scene
          points={points}
          entities={entities}
          triangles={triangles}
          showGrid={showGrid}
          showContours={showContours}
          contourInterval={contourInterval}
        />
      </Canvas>
    </div>
  );
};

export default View3D;