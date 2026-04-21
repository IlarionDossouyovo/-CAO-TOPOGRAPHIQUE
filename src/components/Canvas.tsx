import { FC, useRef, useEffect, useState, useCallback } from 'react';
import { DrawingTool, SnapMode, Point } from '../types';

interface CanvasProps {
  tool: DrawingTool;
  layer: string | null;
  gridEnabled: boolean;
  snapMode: SnapMode;
  onMouseMove: (x: number, y: number, z: number) => void;
}

const GRID_SIZE = 20;
const MAJOR_GRID = 100;

export const Canvas: FC<CanvasProps> = ({
  tool,
  layer,
  gridEnabled,
  snapMode,
  onMouseMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [entities, setEntities] = useState<{ type: string; points: Point[]; color: string }[]>([]);
  const [currentDraw, setCurrentDraw] = useState<{ type: string; points: Point[] } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid if enabled
      if (gridEnabled) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        
        // Minor grid
        for (let x = offset.x % (GRID_SIZE * scale); x < canvas.width; x += GRID_SIZE * scale) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = offset.y % (GRID_SIZE * scale); y < canvas.height; y += GRID_SIZE * scale) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Major grid
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let x = offset.x % (MAJOR_GRID * scale); x < canvas.width; x += MAJOR_GRID * scale) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = offset.y % (MAJOR_GRID * scale); y < canvas.height; y += MAJOR_GRID * scale) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(offset.x, 0);
        ctx.lineTo(offset.x, canvas.height);
        ctx.stroke();
        
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, offset.y);
        ctx.lineTo(canvas.width, offset.y);
        ctx.stroke();
      }
      
      // Draw entities
      entities.forEach((entity) => {
        ctx.strokeStyle = entity.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (entity.type === 'line' && entity.points.length >= 2) {
          ctx.moveTo(
            entity.points[0].x * scale + offset.x,
            -entity.points[0].y * scale + offset.y
          );
          ctx.lineTo(
            entity.points[1].x * scale + offset.x,
            -entity.points[1].y * scale + offset.y
          );
        } else if (entity.type === 'polyline' && entity.points.length >= 2) {
          ctx.moveTo(
            entity.points[0].x * scale + offset.x,
            -entity.points[0].y * scale + offset.y
          );
          entity.points.slice(1).forEach((point) => {
            ctx.lineTo(point.x * scale + offset.x, -point.y * scale + offset.y);
          });
        }
        ctx.stroke();
      });
      
      // Draw current drawing
      if (currentDraw) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        if (currentDraw.type === 'line' && currentDraw.points.length >= 1) {
          ctx.moveTo(
            currentDraw.points[0].x * scale + offset.x,
            -currentDraw.points[0].y * scale + offset.y
          );
        } else if (currentDraw.type === 'polyline' && currentDraw.points.length >= 1) {
          ctx.moveTo(
            currentDraw.points[0].x * scale + offset.x,
            -currentDraw.points[0].y * scale + offset.y
          );
          currentDraw.points.slice(1).forEach((point) => {
            ctx.lineTo(point.x * scale + offset.x, -point.y * scale + offset.y);
          });
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [gridEnabled, offset, scale, entities, currentDraw]);

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left - offset.x) / scale;
      const y = -(clientY - rect.top - offset.y) / scale;
      return { x, y };
    },
    [offset, scale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'pan' || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        return;
      }

      if (tool === 'point') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        setEntities((prev) => [
          ...prev,
          {
            type: 'point',
            points: [coords],
            color: '#ef4444',
          },
        ]);
      } else if (tool === 'line' || tool === 'polyline') {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        setCurrentDraw((prev) => {
          if (!prev) return { type: tool, points: [coords] };
          return { type: prev.type, points: [...prev.points, coords] };
        });
      }
    },
    [tool, offset, getCanvasCoordinates]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      onMouseMove(coords.x, coords.y, 0);
    },
    [isPanning, panStart, getCanvasCoordinates, onMouseMove]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (currentDraw && currentDraw.points.length >= 2) {
        setEntities((prev) => [...prev, { ...currentDraw, color: '#2563eb' } as any]);
        setCurrentDraw(null);
      }
    },
    [isPanning, currentDraw]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.1), 10));
  }, []);

  return (
    <div
      ref={containerRef}
      className="drawing-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};