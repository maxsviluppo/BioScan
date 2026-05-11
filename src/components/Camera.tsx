import React, { useRef, useState, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCw, X, Zap, ZapOff, Image, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CameraProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [showZoomBadge, setShowZoomBadge] = useState(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPinchDistance = useRef<number | null>(null);
  const lastTouchY = useRef<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Il tuo browser non supporta l'accesso alla fotocamera. Prova ad aprire l'app in una nuova scheda o in un altro browser.");
      return;
    }
    try {
      const constraints: any = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 }
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const track = stream.getVideoTracks()[0];
      if ((track as any).getCapabilities) {
        const caps = (track as any).getCapabilities();
        setCapabilities(caps);
        if (caps.zoom) {
          setZoom(caps.zoom.min || 1);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permesso negato. Per favore, consenti l'accesso alla fotocamera nelle impostazioni del browser o prova ad aprire l'app in una nuova scheda.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("Nessuna fotocamera trovata su questo dispositivo.");
      } else {
        setError("Impossibile accedere alla fotocamera. Prova a ricaricare la pagina o ad aprire l'app in una nuova scheda.");
      }
    }
  }, []);

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !flashOn }]
        });
        setFlashOn(!flashOn);
      } catch (err) {
        console.error("Flash not supported:", err);
      }
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    if (streamRef.current && capabilities?.zoom) {
      const track = streamRef.current.getVideoTracks()[0];
      const clampedZoom = Math.max(capabilities.zoom.min, Math.min(capabilities.zoom.max, newZoom));
      
      // Light haptic feedback for zoom steps
      if (Math.abs(clampedZoom - zoom) > 0.1 && navigator.vibrate) {
        navigator.vibrate(5);
      }

      try {
        await (track as any).applyConstraints({
          advanced: [{ zoom: clampedZoom }]
        });
        setZoom(clampedZoom);
        
        // Show zoom badge
        setShowZoomBadge(true);
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = setTimeout(() => setShowZoomBadge(false), 1000);
      } catch (err) {
        console.error("Zoom not supported:", err);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchY.current = e.touches[0].pageY;
    } else if (e.touches.length === 2) {
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastPinchDistance.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null && capabilities?.zoom) {
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      
      const delta = distance - lastPinchDistance.current;
      const sensitivity = (capabilities.zoom.max - capabilities.zoom.min) / (window.innerWidth * 0.5);
      const newZoom = zoom + delta * sensitivity;
      
      handleZoomChange(newZoom);
      lastPinchDistance.current = distance;
    } else if (e.touches.length === 1 && lastTouchY.current !== null && capabilities?.zoom && !isPinching) {
      // Vertical slide on the right side of the screen to zoom
      const touch = e.touches[0];
      if (touch.pageX > window.innerWidth * 0.7) {
        const deltaY = lastTouchY.current - touch.pageY;
        if (Math.abs(deltaY) > 2) {
          const sensitivity = (capabilities.zoom.max - capabilities.zoom.min) / (window.innerHeight * 0.4);
          const newZoom = zoom + deltaY * sensitivity;
          handleZoomChange(newZoom);
          lastTouchY.current = touch.pageY;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    lastPinchDistance.current = null;
    lastTouchY.current = null;
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onCapture(base64String);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      // Haptic feedback for shutter
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        onCapture(base64Image);
        stopCamera();
      }
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={() => {
          stopCamera();
          onClose();
        }}
        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50"
      >
        <X size={24} />
      </button>

      {error ? (
        <div className="text-white text-center p-8 max-w-xs z-50">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CameraIcon size={32} className="text-emerald-400" />
          </div>
          <p className="mb-8 text-sm text-stone-300 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={startCamera}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 rounded-full font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              <RefreshCw size={18} /> Riprova
            </button>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 active:scale-95 transition-all"
            >
              Apri in nuova scheda
            </a>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Central Zoom Badge */}
          <AnimatePresence>
            {showZoomBadge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 z-50"
              >
                <span className="text-white font-black text-xl font-mono">
                  {zoom.toFixed(1)}x
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <canvas ref={canvasRef} className="hidden" />
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />

          {/* Top Controls */}
          <div className="absolute top-6 left-6 flex gap-4 z-50">
            <button
              onClick={toggleFlash}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              {flashOn ? <Zap size={24} className="text-yellow-400 fill-yellow-400" /> : <ZapOff size={24} />}
            </button>
          </div>
          
          {/* Zoom Bubble Regulator */}
          {capabilities?.zoom && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 bg-black/40 p-5 rounded-full backdrop-blur-xl border border-white/20 z-50 shadow-2xl">
              <button 
                onClick={() => handleZoomChange(zoom + 0.5)} 
                className="text-white hover:text-emerald-400 transition-colors active:scale-125"
              >
                <Plus size={24} />
              </button>
              
              <div className="h-56 w-3 bg-white/10 rounded-full relative group touch-none">
                {/* Visual Tick Marks (Zoom Wheel Effect) */}
                <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-30">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-full h-[1px] bg-white" />
                  ))}
                </div>
                
                <input
                  type="range"
                  min={capabilities.zoom.min}
                  max={capabilities.zoom.max}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-56 h-12 opacity-0 cursor-pointer -rotate-90 origin-center -translate-x-[106px] translate-y-[88px] z-10"
                />
                {/* Track Fill */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-full transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  style={{ height: `${((zoom - capabilities.zoom.min) / (capabilities.zoom.max - capabilities.zoom.min)) * 100}%` }}
                />
                {/* Bubble Handle */}
                <motion.div 
                  className="absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-2xl border-2 border-emerald-500 flex items-center justify-center z-20 pointer-events-none"
                  style={{ bottom: `calc(${((zoom - capabilities.zoom.min) / (capabilities.zoom.max - capabilities.zoom.min)) * 100}% - 16px)` }}
                  animate={isPinching ? { scale: 1.3 } : { scale: 1 }}
                >
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </motion.div>
              </div>

              <button 
                onClick={() => handleZoomChange(zoom - 0.5)} 
                className="text-white hover:text-emerald-400 transition-colors active:scale-125"
              >
                <Minus size={24} />
              </button>
              
              <button
                onClick={() => handleZoomChange(capabilities.zoom.min)}
                className="flex flex-col items-center group"
              >
                <span className="text-[10px] font-black text-white font-mono bg-emerald-600 px-2 py-0.5 rounded-full shadow-sm group-active:scale-90 transition-transform">
                  {zoom.toFixed(1)}x
                </span>
                <span className="text-[8px] text-white/50 mt-1 uppercase font-bold">Reset</span>
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12 z-50">
            <button
              onClick={handleGalleryClick}
              className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <Image size={28} />
            </button>

            <button
              onClick={captureImage}
              disabled={!isStreaming}
              className={cn(
                "w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-90 shadow-2xl shadow-emerald-500/30",
                !isStreaming && "opacity-50"
              )}
            >
              <div className="w-20 h-20 rounded-full bg-white shadow-inner" />
            </button>

            <div className="w-14" /> {/* Spacer for symmetry */}
          </div>
        </>
      )}
    </motion.div>
  );
};
