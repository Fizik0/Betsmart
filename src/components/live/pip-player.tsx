import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LiveStream, LiveStreamStats } from '@shared/schema';
import Hls from 'hls.js';

type PiPPlayerProps = {
  stream?: LiveStream;
  stats?: LiveStreamStats;
  isOpen: boolean;
  onClose: () => void;
};

const PiPPlayer = ({ stream, stats, isOpen, onClose }: PiPPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 200 });
  const [showControls, setShowControls] = useState(false);
  
  // Инициализация HLS плеера
  useEffect(() => {
    if (!isOpen || !stream || !videoRef.current) return;
    
    const video = videoRef.current;
    
    if (Hls.isSupported() && stream.hlsUrl) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hls.loadSource(stream.hlsUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.error('Error playing video:', err));
      });
      
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && stream.hlsUrl) {
      // Для Safari, который имеет встроенную поддержку HLS
      video.src = stream.hlsUrl;
      video.play().catch(err => console.error('Error playing video:', err));
    } else if (stream.fallbackUrl) {
      // Если HLS не поддерживается и есть fallback URL (например mp4)
      video.src = stream.fallbackUrl;
      video.play().catch(err => console.error('Error playing video:', err));
    }
  }, [isOpen, stream]);
  
  // Обработка перетаскивания
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);
  
  const handleDrag = (e: any, info: any) => {
    const newX = position.x + info.delta.x;
    const newY = position.y + info.delta.y;
    
    // Ограничения, чтобы не вытащить полностью за пределы экрана
    const maxX = window.innerWidth - (isMinimized ? 200 : 400);
    const maxY = window.innerHeight - (isMinimized ? 150 : 300);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };
  
  // Переключение между минимизированным и обычным режимом
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed z-50 shadow-lg rounded-lg overflow-hidden bg-card border border-border",
            isMinimized ? "w-[280px]" : "w-[480px]"
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: position.x,
            y: position.y,
            width: isMinimized ? 280 : 480
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 20 }}
          drag
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={handleDrag}
          dragConstraints={{ left: 0, right: window.innerWidth - 280, top: 0, bottom: window.innerHeight - 150 }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Header */}
          <div 
            className="bg-card-foreground/10 p-2 flex justify-between items-center cursor-move"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center">
              <span className="bg-destructive text-white text-xs px-1 rounded mr-2">LIVE</span>
              <span className="text-sm truncate">{stream?.title || 'Live Stream'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={toggleMinimized}
              >
                <span className="material-icons text-sm">
                  {isMinimized ? 'open_in_full' : 'close_fullscreen'}
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={onClose}
              >
                <span className="material-icons text-sm">close</span>
              </Button>
            </div>
          </div>
          
          {/* Video area */}
          <div className="relative">
            <video 
              ref={videoRef}
              className="w-full aspect-video bg-black"
              playsInline
              muted
              autoPlay
            />
            
            {/* Live stats overlay */}
            {stats && (
              <div className="absolute bottom-0 left-0 right-0 bg-card-foreground/80 text-card p-2 text-xs">
                {stats.eventStats ? (
                  <>
                    <div className="flex justify-between">
                      <div>{stats.eventStats.possession?.home}%</div>
                      <div>Владение</div>
                      <div>{stats.eventStats.possession?.away}%</div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <div>{stats.eventStats.shots?.home}</div>
                      <div>Удары</div>
                      <div>{stats.eventStats.shots?.away}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">Статистика загружается...</div>
                )}
              </div>
            )}
          </div>
          
          {/* Controls overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center space-x-2 pointer-events-auto">
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <span className="material-icons">volume_up</span>
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <span className="material-icons">hd</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PiPPlayer;