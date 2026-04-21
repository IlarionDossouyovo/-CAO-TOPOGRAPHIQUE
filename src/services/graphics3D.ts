/**
 * 3D Graphics Module
 * Textures, lighting, shadows and animations for 3D view
 */

import * as THREE from 'three';

/**
 * Configuration d'éclairage
 */
export interface LightingConfig {
  ambient: {
    enabled: boolean;
    intensity: number;
    color: string;
  };
  directional: {
    enabled: boolean;
    intensity: number;
    color: string;
    position: { x: number; y: number; z: number };
    castShadows: boolean;
  };
  hemisphere: {
    enabled: boolean;
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
}

export const DEFAULT_LIGHTING: LightingConfig = {
  ambient: {
    enabled: true,
    intensity: 0.5,
    color: '#ffffff',
  },
  directional: {
    enabled: true,
    intensity: 1.0,
    color: '#ffffff',
    position: { x: 10, y: 20, z: 10 },
    castShadows: true,
  },
  hemisphere: {
    enabled: false,
    skyColor: '#87ceeb',
    groundColor: '#8b4513',
    intensity: 0.3,
  },
};

/**
 * Configuration des ombres
 */
export interface ShadowConfig {
  enabled: boolean;
  mapSize: number;
  bias: number;
  radius: number;
}

export const DEFAULT_SHADOWS: ShadowConfig = {
  enabled: true,
  mapSize: 2048,
  bias: -0.0001,
  radius: 4,
};

/**
 * Configuration de rendu
 */
export interface RenderConfig {
  antialias: boolean;
  shadows: ShadowConfig;
  toneMapping: 'linear' | 'reinhard' | 'ACESFilmic';
  exposure: number;
  outputEncoding: 'sRGB' | 'Linear';
}

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  antialias: true,
  shadows: DEFAULT_SHADOWS,
  toneMapping: 'ACESFilmic',
  exposure: 1.0,
  outputEncoding: 'sRGB',
};

/**
 * Prépare le renderer avec la configuration
 */
export function setupRenderer(
  canvas: HTMLCanvasElement,
  config: Partial<RenderConfig> = {}
): THREE.WebGLRenderer {
  const finalConfig = { ...DEFAULT_RENDER_CONFIG, ...config };
  
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: finalConfig.antialias,
    alpha: true,
    powerPreference: 'high-performance',
  });
  
  // Ombres
  renderer.shadowMap.enabled = finalConfig.shadows.enabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Tone mapping
  if (finalConfig.toneMapping === 'ACESFilmic') {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  } else if (finalConfig.toneMapping === 'reinhard') {
    renderer.toneMapping = THREE.ReinhardToneMapping;
  }
  renderer.toneMappingExposure = finalConfig.exposure;
  
  // Output encoding
  renderer.outputColorSpace = finalConfig.outputEncoding === 'sRGB' 
    ? THREE.SRGBColorSpace 
    : THREE.LinearSRGBColorSpace;
  
  // Physical correct lights
  renderer.physicallyCorrectLights = true;
  
  return renderer;
}

/**
 * Crée les lumières selon la configuration
 */
export function setupLighting(
  scene: THREE.Scene,
  config: Partial<LightingConfig> = {}
): THREE.Group {
  const finalConfig = {
    ambient: { ...DEFAULT_LIGHTING.ambient, ...config.ambient },
    directional: { ...DEFAULT_LIGHTING.directional, ...config.directional },
    hemisphere: { ...DEFAULT_LIGHTING.hemisphere, ...config.hemisphere },
  };
  
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'lights';
  
  // Ambient light
  if (finalConfig.ambient.enabled) {
    const ambient = new THREE.AmbientLight(
      finalConfig.ambient.color,
      finalConfig.ambient.intensity
    );
    ambient.name = 'ambient';
    lightsGroup.add(ambient);
  }
  
  // Directional light (sun)
  if (finalConfig.directional.enabled) {
    const directional = new THREE.DirectionalLight(
      finalConfig.directional.color,
      finalConfig.directional.intensity
    );
    directional.name = 'directional';
    directional.position.set(
      finalConfig.directional.position.x,
      finalConfig.directional.position.y,
      finalConfig.directional.position.z
    );
    directional.castShadow = finalConfig.directional.castShadows;
    
    // Configure shadow properties
    if (finalConfig.directional.castShadows) {
      directional.shadow.mapSize.width = 2048;
      directional.shadow.mapSize.height = 2048;
      directional.shadow.camera.near = 0.5;
      directional.shadow.camera.far = 500;
      directional.shadow.camera.left = -100;
      directional.shadow.camera.right = 100;
      directional.shadow.camera.top = 100;
      directional.shadow.camera.bottom = -100;
      directional.shadow.bias = -0.0001;
    }
    
    lightsGroup.add(directional);
  }
  
  // Hemisphere light
  if (finalConfig.hemisphere.enabled) {
    const hemisphere = new THREE.HemisphereLight(
      finalConfig.hemisphere.skyColor,
      finalConfig.hemisphere.groundColor,
      finalConfig.hemisphere.intensity
    );
    hemisphere.name = 'hemisphere';
    lightsGroup.add(hemisphere);
  }
  
  scene.add(lightsGroup);
  return lightsGroup;
}

/**
 * Texture de terrain
 */
export function createTerrainTexture(
  options: {
    baseColor: string;
    roughness: number;
    normalScale: number;
  } = { baseColor: '#3d5c3d', roughness: 0.9, normalScale: 1.0 }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.baseColor,
    roughness: options.roughness,
    metalness: 0.0,
    flatShading: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Texture de routes
 */
export function createRoadTexture(
  options: {
    color: string;
    roughness: number;
  } = { color: '#4a4a4a', roughness: 0.8 }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.color,
    roughness: options.roughness,
    metalness: 0.0,
  });
}

/**
 * Texture de bâtiment
 */
export function createBuildingTexture(
  options: {
    color: string;
    roughness: number;
  } = { color: '#d4d4d4', roughness: 0.7 }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.color,
    roughness: options.roughness,
    metalness: 0.1,
  });
}

/**
 * Génère un terrain avec texture selon altitude
 */
export function createTexturedTerrain(
  geometry: THREE.BufferGeometry,
  bounds: { minZ: number; maxZ: number }
): THREE.Mesh {
  // Créer un shader custom pour le dégradé selon altitude
  const material = new THREE.ShaderMaterial({
    uniforms: {
      minZ: { value: bounds.minZ },
      maxZ: { value: bounds.maxZ },
      colorLow: { value: new THREE.Color('#2d5016') },    // Vert foncé
      colorMid: { value: new THREE.Color('#8fbc8f') },     // Vert clair
      colorHigh: { value: new THREE.Color('#8b7355') },    // Brun
      colorPeak: { value: new THREE.Color('#ffffff') },    // Blanc (neige)
    },
    vertexShader: `
      varying float vElevation;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vElevation = position.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float minZ;
      uniform float maxZ;
      uniform vec3 colorLow;
      uniform vec3 colorMid;
      uniform vec3 colorHigh;
      uniform vec3 colorPeak;
      
      varying float vElevation;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        float t = (vElevation - minZ) / (maxZ - minZ);
        
        vec3 color;
        if (t < 0.33) {
          color = mix(colorLow, colorMid, t * 3.0);
        } else if (t < 0.66) {
          color = mix(colorMid, colorHigh, (t - 0.33) * 3.0);
        } else {
          color = mix(colorHigh, colorPeak, (t - 0.66) * 3.0);
        }
        
        // Ombrage simple
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(vNormal, lightDir), 0.0);
        float ambient = 0.4;
        
        color = color * (ambient + diff * 0.6);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Animation de caméra (fly-through)
 */
export class CameraAnimation {
  private camera: THREE.PerspectiveCamera;
  private path: THREE.Vector3[];
  private speed: number;
  private currentIndex = 0;
  private t = 0;
  private loop: boolean;
  
  constructor(
    camera: THREE.PerspectiveCamera,
    path: THREE.Vector3[],
    speed: number = 1,
    loop: boolean = true
  ) {
    this.camera = camera;
    this.path = path;
    this.speed = speed;
    this.loop = loop;
  }
  
  update(deltaTime: number): void {
    if (this.path.length < 2) return;
    
    this.t += deltaTime * this.speed;
    
    if (this.t >= 1) {
      this.t = 0;
      this.currentIndex++;
      
      if (this.currentIndex >= this.path.length - 1) {
        if (this.loop) {
          this.currentIndex = 0;
        } else {
          this.currentIndex = this.path.length - 2;
          this.t = 1;
        }
      }
    }
    
    const p1 = this.path[this.currentIndex];
    const p2 = this.path[this.currentIndex + 1];
    
    // Interpolation
    this.camera.position.lerpVectors(p1, p2, this.t);
    
    // Regarder vers l'avant
    if (this.currentIndex < this.path.length - 2) {
      const lookTarget = this.path[this.currentIndex + 1];
      this.camera.lookAt(lookTarget);
    }
  }
  
  setPath(path: THREE.Vector3[]): void {
    this.path = path;
    this.currentIndex = 0;
    this.t = 0;
  }
  
  setSpeed(speed: number): void {
    this.speed = speed;
  }
  
  reset(): void {
    this.currentIndex = 0;
    this.t = 0;
    if (this.path.length > 0) {
      this.camera.position.copy(this.path[0]);
    }
  }
}

/**
 * Export de la vue 3D en image
 */
export function capture3DView(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): string {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}