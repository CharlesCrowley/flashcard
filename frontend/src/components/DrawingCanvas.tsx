import { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, Download } from 'lucide-react';

interface DrawingCanvasProps {
  initialData?: string;
  onChange?: (data: string) => void;
  width?: number;
  height?: number;
}

export default function DrawingCanvas({
  initialData,
  onChange,
  width = 400,
  height = 300,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (initialData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialData;
      }
    }
  }, [initialData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : e.nativeEvent.offsetX;
    const y = 'touches' in e
      ? e.touches[0].clientY - rect.top
      : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : e.nativeEvent.offsetX;
    const y = 'touches' in e
      ? e.touches[0].clientY - rect.top
      : e.nativeEvent.offsetY;

    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && onChange) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (onChange) {
      onChange('');
    }
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    '#000000', // Black
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
  ];

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Color picker */}
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              className={clsx(
                'w-8 h-8 rounded-full border-2 transition-transform',
                color === c && !isEraser
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-300'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Line width */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{lineWidth}px</span>
        </div>

        {/* Tools */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={clsx(
              'tap-target btn',
              isEraser ? 'btn-primary' : 'btn-secondary'
            )}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button onClick={clearCanvas} className="tap-target btn btn-secondary">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={downloadDrawing} className="tap-target btn btn-secondary">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function clsx(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
