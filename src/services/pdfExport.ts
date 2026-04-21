/**
 * PDF Export Service
 * Export de plans avec mise en page, cartouche et légende
 */

import { jsPDF } from 'jspdf';
import { Point, Entity, Layer, TopographicPoint } from '../types';

/**
 * Format de page
 */
export type PageFormat = 'A4' | 'A3' | 'A2' | 'A1' | 'A0';

export interface PageSize {
  width: number;
  height: number;
}

export const PAGE_FORMATS: Record<PageFormat, PageSize> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  A0: { width: 841, height: 1189 },
};

/**
 * Options d'export PDF
 */
export interface PDFExportOptions {
  format: PageFormat;
  orientation: 'portrait' | 'paysage';
  scale: number;
  title: string;
  projectName: string;
  client?: string;
  operator?: string;
  date?: string;
  showGrid?: boolean;
  showNorth?: boolean;
  showLegend?: boolean;
  showScale?: boolean;
  showLogo?: boolean;
}

/**
 * Position du cartouche
 */
interface CartouchePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Service d'export PDF
 */
export class PDFExportService {
  private doc: jsPDF;
  private options: PDFExportOptions;
  private pageSize: PageSize;
  private margin = 15; // mm
  
  constructor(options: Partial<PDFExportOptions> = {}) {
    this.options = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      scale: options.scale || 500,
      title: options.title || 'Plan topographique',
      projectName: options.projectName || 'Projet',
      client: options.client,
      operator: options.operator,
      date: options.date || new Date().toLocaleDateString('fr-FR'),
      showGrid: options.showGrid ?? true,
      showNorth: options.showNorth ?? true,
      showLegend: options.showLegend ?? true,
      showScale: options.showScale ?? true,
      showLogo: options.showLogo ?? false,
    };
    
    this.pageSize = PAGE_FORMATS[this.options.format];
    
    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.format,
    });
  }
  
  /**
   * Génère le PDF complet
   */
  generate(entities: Entity[], layers: Layer[], bounds: { minX: number; maxX: number; minY: number; maxY: number }): jsPDF {
    this.drawHeader();
    this.drawMap(entities, layers, bounds);
    
    if (this.options.showNorth) {
      this.drawNorthArrow();
    }
    
    if (this.options.showScale) {
      this.drawScale();
    }
    
    if (this.options.showLegend) {
      this.drawLegend(layers);
    }
    
    this.drawCartouche();
    
    return this.doc;
  }
  
  /**
   * Dessine l'en-tête
   */
  private drawHeader(): void {
    const { width } = this.pageSize;
    
    // Titre
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.options.title, this.margin, 10);
    
    // Sous-titre
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.options.projectName, this.margin, 16);
  }
  
  /**
   * Dessine la carte
   */
  private drawMap(entities: Entity[], layers: Layer[], bounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    const { width, height } = this.pageSize;
    const mapTop = 25;
    const mapBottom = this.options.orientation === 'portrait' ? height - 45 : height - 35;
    const mapLeft = this.margin;
    const mapRight = width - this.margin;
    
    const mapWidth = mapRight - mapLeft;
    const mapHeight = mapBottom - mapTop;
    
    const dataWidth = bounds.maxX - bounds.minX;
    const dataHeight = bounds.maxY - bounds.minY;
    const scale = Math.min(mapWidth / dataWidth, mapHeight / dataHeight) * 0.9;
    
    // Centrer
    const offsetX = mapLeft + (mapWidth - dataWidth * scale) / 2;
    const offsetY = mapTop + (mapHeight - dataHeight * scale) / 2;
    
    // Fond blanc
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(mapLeft, mapTop, mapWidth, mapHeight, 'F');
    
    // Grille si activée
    if (this.options.showGrid) {
      this.doc.setDrawColor(220, 220, 220);
      this.doc.setLineWidth(0.1);
      
      const gridSpacing = 10 * scale; // 10 unites
      for (let x = 0; x <= dataWidth * scale; x += gridSpacing) {
        this.doc.line(offsetX + x, mapTop, offsetX + x, mapBottom);
      }
      for (let y = 0; y <= dataHeight * scale; y += gridSpacing) {
        this.doc.line(mapLeft, offsetY + y, mapRight, offsetY + y);
      }
    }
    
    // Dessiner les entités
    for (const entity of entities) {
      const layer = layers.find(l => l.id === entity.layerId);
      const color = layer ? this.hexToRgb(layer.color) : { r: 0, g: 0, b: 0 };
      
      this.doc.setDrawColor(color.r, color.g, color.b);
      this.doc.setLineWidth((layer?.lineWidth || 1) * 0.3);
      
      if (entity.type === 'line' && entity.points.length >= 2) {
        for (let i = 1; i < entity.points.length; i++) {
          const p1 = entity.points[i - 1];
          const p2 = entity.points[i];
          
          this.doc.line(
            offsetX + (p1.x - bounds.minX) * scale,
            offsetY + (bounds.maxY - p1.y) * scale,
            offsetX + (p2.x - bounds.minX) * scale,
            offsetY + (bounds.maxY - p2.y) * scale
          );
        }
      }
      
      if (entity.type === 'point') {
        for (const p of entity.points) {
          const x = offsetX + (p.x - bounds.minX) * scale;
          const y = offsetY + (bounds.maxY - p.y) * scale;
          this.doc.circle(x, y, 1, 'F');
        }
      }
    }
    
    // Cadre
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.rect(mapLeft, mapTop, mapWidth, mapHeight);
  }
  
  /**
   * Dessine la flèche du nord
   */
  private drawNorthArrow(): void {
    const { width, height } = this.pageSize;
    const x = width - this.margin - 20;
    const y = 30;
    const size = 12;
    
    // Fond
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(x, y, size, 'F');
    
    // Flèche nord
    this.doc.setFillColor(0, 0, 0);
    this.doc.text('N', x - 2, y - 3);
    
    // Flèche
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(x, y + 2, x, y - size + 4);
    this.doc.line(x, y - size + 4, x - 3, y - size + 8);
    this.doc.line(x, y - size + 4, x + 3, y - size + 4);
  }
  
  /**
   * Dessine l'échelle
   */
  private drawScale(): void {
    const { width, height } = this.pageSize;
    const x = this.margin;
    const y = height - 30;
    const widthScale = 50; // mm
    const realWidth = widthScale * this.options.scale / 1000; // en metres
    
    // Ligne d'échelle
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(x, y, x + widthScale, y);
    
    // Extrémités
    this.doc.line(x, y - 2, x, y + 2);
    this.doc.line(x + widthScale, y - 2, x + widthScale, y + 2);
    
    // Texte
    this.doc.setFontSize(8);
    this.doc.text(`Echelle 1/${this.options.scale}`, x, y - 4);
    this.doc.text(`${realWidth.toFixed(0)} m`, x + widthScale / 2 - 5, y + 6);
  }
  
  /**
   * Dessine la légende
   */
  private drawLegend(layers: Layer[]): void {
    const { width, height } = this.pageSize;
    const x = width - this.margin - 50;
    const y = height - 55;
    const itemHeight = 5;
    
    // Titre
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Légende', x, y);
    
    // Items
    let currentY = y + 4;
    this.doc.setFont('helvetica', 'normal');
    
    for (const layer of layers.slice(0, 8)) {
      const color = this.hexToRgb(layer.color);
      this.doc.setFillColor(color.r, color.g, color.b);
      this.doc.rect(x, currentY, 3, 3, 'F');
      this.doc.setDrawColor(0, 0, 0);
      this.doc.rect(x, currentY, 3, 3);
      
      this.doc.text(layer.name, x + 5, currentY + 2.5);
      currentY += itemHeight + 2;
    }
  }
  
  /**
   * Dessine le cartouche
   */
  private drawCartouche(): void {
    const { width, height } = this.pageSize;
    const cartoucheHeight = 35;
    const cartoucheY = height - cartoucheHeight - 5;
    const cartoucheLeft = this.margin;
    const cartoucheWidth = width - 2 * this.margin;
    
    // Cadre
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.rect(cartoucheLeft, cartoucheY, cartoucheWidth, cartoucheHeight);
    
    // Ligne verticale séparation
    this.doc.line(cartoucheLeft + cartoucheWidth * 0.7, cartoucheY, cartoucheLeft + cartoucheWidth * 0.7, cartoucheY + cartoucheHeight);
    
    // Partie gauche - Infos projet
    let textY = cartoucheY + 5;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Projet:', cartoucheLeft + 3, textY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.options.projectName, cartoucheLeft + 20, textY);
    
    textY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Date:', cartoucheLeft + 3, textY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.options.date, cartoucheLeft + 20, textY);
    
    if (this.options.client) {
      textY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Client:', cartoucheLeft + 3, textY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.options.client, cartoucheLeft + 20, textY);
    }
    
    if (this.options.operator) {
      textY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Operateur:', cartoucheLeft + 3, textY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.options.operator, cartoucheLeft + 20, textY);
    }
    
    // Partie droite - Infos techniques
    let rightTextY = cartoucheY + 5;
    const rightX = cartoucheLeft + cartoucheWidth * 0.75;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Echelle:', rightX + 2, rightTextY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`1:${this.options.scale}`, rightX + 20, rightTextY);
    
    rightTextY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Format:', rightX + 2, rightTextY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.options.format, rightX + 20, rightTextY);
    
    rightTextY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Systeme:', rightX + 2, rightTextY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Lambert 93', rightX + 20, rightTextY);
  }
  
  /**
   * Convertit hex en RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }
  
  /**
   * Sauvegarde le PDF
   */
  save(filename: string = 'plan.pdf'): void {
    this.doc.save(filename);
  }
  
  /**
   * Retourne le blob
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }
  
  /**
   * Retourne le base64
   */
  getBase64(): string {
    return this.doc.output('datauristring');
  }
}

/**
 * Fonction utilitaire pour exporter rapidement
 */
export function quickExportPDF(
  entities: Entity[],
  layers: Layer[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  options?: Partial<PDFExportOptions>
): void {
  const exporter = new PDFExportService(options);
  exporter.generate(entities, layers, bounds);
  exporter.save();
}