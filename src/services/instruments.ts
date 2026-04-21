/**
 * Instruments Connection Service
 * Support for total stations, GPS/GNSS devices
 */

import { TopographicPoint } from '../types';

/**
 * Type d'instrument
 */
export type InstrumentType = 'leica' | 'trimble' | 'topcon' | 'sokkia' | 'gps';

/**
 * Type de connexion
 */
export type ConnectionType = 'usb' | 'bluetooth' | 'wifi' | 'serial';

/**
 * Statut de connexion
 */
export interface ConnectionStatus {
  connected: boolean;
  instrument: InstrumentInfo | null;
  lastData: number;
  errors: string[];
}

/**
 * Information sur l'instrument
 */
export interface InstrumentInfo {
  type: InstrumentType;
  model: string;
  serial: string;
  firmware?: string;
  capabilities: string[];
}

/**
 * Donnée brute reçue de l'instrument
 */
export interface RawData {
  type: 'coordinate' | 'angle' | 'distance' | 'measurement';
  timestamp: number;
  data: unknown;
}

/**
 * Point issu d'un instrument
 */
export interface InstrumentPoint {
  number: string;
  x: number;
  y: number;
  z: number;
  code?: string;
  timestamp: number;
  accuracy?: number;
}

/**
 * Options de connexion
 */
export interface ConnectionOptions {
  type: ConnectionType;
  port?: string;
  baudRate?: number;
  address?: string;
  timeout?: number;
}

/**
 * Service de connexion aux instruments
 */
class InstrumentsService {
  private connection: WebSocket | SerialPort | null = null;
  private status: ConnectionStatus = {
    connected: false,
    instrument: null,
    lastData: 0,
    errors: [],
  };
  
  private listeners: ((point: InstrumentPoint) => void)[] = [];
  private rawListeners: ((data: RawData) => void)[] = [];
  
  /**
   * Connecte à un instrument
   */
  async connect(options: ConnectionOptions): Promise<boolean> {
    try {
      this.status.errors = [];
      
      switch (options.type) {
        case 'wifi':
          return await this.connectWifi(options);
        case 'bluetooth':
          return await this.connectBluetooth(options);
        case 'serial':
        case 'usb':
          return await this.connectSerial(options);
        default:
          return false;
      }
    } catch (error) {
      this.status.errors.push(error instanceof Error ? error.message : 'Connection error');
      return false;
    }
  }
  
  /**
   * Déconnecte l'instrument
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      if (this.connection instanceof WebSocket) {
        this.connection.close();
      } else if (this.connection instanceof SerialPort) {
        await this.connection.close();
      }
      this.connection = null;
    }
    
    this.status = {
      connected: false,
      instrument: null,
      lastData: 0,
      errors: [],
    };
  }
  
  /**
   * Obtient le statut de connexion
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }
  
  /**
   * Écoute les points reçus
   */
  onPoint(listener: (point: InstrumentPoint) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Écoute les données brutes
   */
  onRawData(listener: (data: RawData) => void): () => void {
    this.rawListeners.push(listener);
    return () => {
      this.rawListeners = this.rawListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Envoyer une commande à l'instrument
   */
  async sendCommand(command: string): Promise<string | null> {
    if (!this.status.connected) return null;
    
    try {
      if (this.connection instanceof WebSocket) {
        this.connection.send(command);
        return 'OK';
      }
      return null;
    } catch (error) {
      this.status.errors.push('Command failed');
      return null;
    }
  }
  
  // Méthodes privées
  
  private async connectWifi(options: ConnectionOptions): Promise<boolean> {
    const url = `ws://${options.address || '192.168.1.100'}:9000`;
    
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.connection = ws;
        this.status.connected = true;
        this.status.instrument = {
          type: 'leica', // Auto-detect
          model: 'TS16',
          serial: 'Unknown',
          capabilities: ['total-station'],
        };
        resolve(true);
      };
      
      ws.onmessage = (event) => {
        this.handleData(event.data);
      };
      
      ws.onerror = () => {
        this.status.errors.push('WebSocket error');
        resolve(false);
      };
      
      ws.onclose = () => {
        this.status.connected = false;
      };
      
      setTimeout(() => {
        if (!this.status.connected) {
          ws.close();
          resolve(false);
        }
      }, options.timeout || 5000);
    });
  }
  
  private async connectBluetooth(options: ConnectionOptions): Promise<boolean> {
    // Utiliser Web Bluetooth API
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }],
      });
      
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
      
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothCharacteristic).value;
        if (value) {
          const decoder = new TextDecoder();
          this.handleData(decoder.decode(value));
        }
      });
      
      await characteristic.startNotifications();
      
      this.status.connected = true;
      this.status.instrument = {
        type: 'leica',
        model: device.name || 'Unknown',
        serial: 'N/A',
        capabilities: ['total-station'],
      };
      
      return true;
    } catch (error) {
      this.status.errors.push('Bluetooth error: ' + (error as Error).message);
      return false;
    }
  }
  
  private async connectSerial(options: ConnectionOptions): Promise<boolean> {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: options.baudRate || 9600 });
      
      this.connection = port;
      this.status.connected = true;
      this.status.instrument = {
        type: 'leica',
        model: 'Serial Device',
        serial: 'N/A',
        capabilities: ['total-station'],
      };
      
      // Lire les données en continu
      const reader = port.readable.getReader();
      
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const decoder = new TextDecoder();
            this.handleData(decoder.decode(value));
          }
        } catch {
          // Handle error
        }
      };
      
      readLoop();
      
      return true;
    } catch (error) {
      this.status.errors.push('Serial error: ' + (error as Error).message);
      return false;
    }
  }
  
  private handleData(data: string): void {
    this.status.lastData = Date.now();
    
    // Parser selon le format
    let parsed: InstrumentPoint | null = null;
    
    // Essayer différents formats
    if (data.includes(',')) {
      parsed = this.parseCSV(data);
    } else if (data.startsWith('%') || data.startsWith('@')) {
      parsed = this.parseGSI(data);
    } else if (data.startsWith('$')) {
      parsed = this.parseNMEA(data);
    }
    
    // Émettre les données brutes
    const rawData: RawData = {
      type: 'coordinate',
      timestamp: Date.now(),
      data,
    };
    
    for (const listener of this.rawListeners) {
      listener(rawData);
    }
    
    // Émettre le point parsé
    if (parsed) {
      for (const listener of this.listeners) {
        listener(parsed);
      }
    }
  }
  
  /**
   * Parse données CSV (format standard)
   */
  private parseCSV(data: string): InstrumentPoint | null {
    const parts = data.trim().split(',');
    if (parts.length < 4) return null;
    
    return {
      number: parts[0].trim(),
      x: parseFloat(parts[1]),
      y: parseFloat(parts[2]),
      z: parseFloat(parts[3]),
      code: parts[4]?.trim(),
      timestamp: Date.now(),
    };
  }
  
  /**
   * Parse format GSI (Leica)
   */
  private parseGSI(data: string): InstrumentPoint | null {
    // Format GSI: %XX.DDDDDDDDD...|
    //Exemple: %10.001+0000000000+0000000000+0000000000|
    
    const match = data.match(/%(\d+)\.(\d+)\+(\d+)\+(\d+)\+(\d+)/);
    if (!match) return null;
    
    const x = parseInt(match[3]) / 10000;
    const y = parseInt(match[4]) / 10000;
    const z = parseInt(match[5]) / 10000;
    
    return {
      number: String(Date.now()),
      x, y, z,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Parse NMEA (GPS/GNSS)
   */
  private parseNMEA(data: string): InstrumentPoint | null {
    // $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47
    
    if (!data.startsWith('$GPGGA')) return null;
    
    const parts = data.split(',');
    if (parts.length < 10) return null;
    
    const lat = this.parseNMEACoordinate(parts[2], parts[3]);
    const lon = this.parseNMEACoordinate(parts[4], parts[5]);
    const alt = parseFloat(parts[9]) || 0;
    
    if (!lat || !lon) return null;
    
    return {
      number: String(Date.now()),
      x: lon,
      y: lat,
      z: alt,
      accuracy: parseFloat(parts[8]) || 0,
      timestamp: Date.now(),
    };
  }
  
  private parseNMEACoordinate(coord: string, dir: string): number | null {
    if (!coord || !dir) return null;
    
    const degrees = parseInt(coord.slice(0, -7));
    const minutes = parseFloat(coord.slice(-7));
    
    if (isNaN(degrees) || isNaN(minutes)) return null;
    
    let decimal = degrees + minutes / 60;
    
    if (dir === 'S' || dir === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }
}

// Singleton
export const instruments = new InstrumentsService();

/**
 * Utilitaires pour instruments
 */
export function formatPointForInstrument(point: TopographicPoint): string {
  return `${point.number},${point.x},${point.y},${point.z},${point.code}`;
}

export function createLeicaGSI(point: TopographicPoint): string {
  const x = String(Math.round(point.x * 10000)).padStart(11, '0');
  const y = String(Math.round(point.y * 10000)).padStart(11, '0');
  const z = String(Math.round((point.z || 0) * 10000)).padStart(11, '0');
  return `%10.001+${x}+${y}+${z}|`;
}