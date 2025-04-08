import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Event, LiveStream, LiveStreamStats } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePiPPlayer } from '@/hooks/use-pip-player';
import Hls from 'hls.js';
import { motion } from 'framer-motion';

type VideoPlayerProps = {
  eventId: number;
};

const VideoPlayer = ({ eventId }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [bufferingProgress, setBufferingProgress] = useState(0);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // PiP context
  const { openPiP } = usePiPPlayer();
  
  // Получение данных о трансляции
  const { data: stream, isLoading: loadingStream } = useQuery<LiveStream>({
    queryKey: ['/api/events', eventId, 'stream'],
  });
  
  // Получение статистики
  const { data: stats, isLoading: loadingStats } = useQuery<LiveStreamStats>({
    queryKey: ['/api/events', eventId, 'stats'],
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  // Получение данных события
  const { data: event, isLoading: loadingEvent } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
  });
  
  // Инициализация HLS плеера
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    
    const video = videoRef.current;
    let hls: Hls | null = null;
    
    if (Hls.isSupported() && stream.hlsUrl) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hls.loadSource(stream.hlsUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Получить доступные качества
        const levels = data.levels.map(level => `${level.height}p`);
        setAvailableQualities(['auto', ...levels]);
        
        video.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Error playing video:', err));
      });
      
      // Следим за буферизацией
      hls.on(Hls.Events.FRAG_BUFFERED, (_, data) => {
        if (data && data.stats) {
          setBufferingProgress(Math.min(100, data.stats.loaded / data.stats.total * 100));
        }
      });
      
      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && stream.hlsUrl) {
      // Для Safari, который имеет встроенную поддержку HLS
      video.src = stream.hlsUrl;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing video:', err));
    } else if (stream.fallbackUrl) {
      // Если HLS не поддерживается и есть fallback URL (например mp4)
      video.src = stream.fallbackUrl;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing video:', err));
    }
  }, [stream]);
  
  // Обработчики управления воспроизведением
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing video:', err));
    }
  }, [isPlaying]);
  
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  }, [isMuted]);
  
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = Number(e.target.value);
    videoRef.current.volume = newVolume / 100;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  }, [isMuted]);
  
  const handleQualityChange = useCallback((quality: string) => {
    if (!videoRef.current || !stream) return;
    
    setCurrentQuality(quality);
    setShowQualityOptions(false);
    
    // В реальной реализации здесь должно быть переключение потока
    // на нужное качество через API Hls.js
  }, [stream]);
  
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error entering fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error exiting fullscreen:', err));
    }
  }, []);
  
  // Обработчик для кнопки Picture-in-Picture
  const handlePiPMode = useCallback(() => {
    if (!stream || !event) return;
    
    // Открываем PiP режим с текущим потоком и статистикой
    openPiP(stream, stats);
    
    // Если видео было воспроизведено, приостанавливаем его в основном плеере
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [stream, stats, event, isPlaying, openPiP]);
  
  // Проверка поддержки WebRTC для низкой задержки
  const supportsWebRTC = !!window.RTCPeerConnection;

  const isLoading = loadingStream || loadingEvent;
  
  // Рендер скелетона загрузки
  if (isLoading) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-darkbg2 w-full aspect-video">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Если трансляция не найдена
  if (!stream) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-card w-full aspect-video flex flex-col items-center justify-center">
        <span className="material-icons text-4xl text-muted-foreground mb-2">videocam_off</span>
        <p className="text-muted-foreground">Трансляция сейчас недоступна</p>
        <p className="text-xs text-muted-foreground mt-1">Проверьте позже или выберите другое событие</p>
      </div>
    );
  }
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden w-full aspect-video bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video 
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
      />
      
      {/* Буферизация */}
      {bufferingProgress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <span className="material-icons animate-spin mb-2">cached</span>
            <p>Буферизация {Math.floor(bufferingProgress)}%</p>
          </div>
        </div>
      )}
      
      {/* Overlay верхней панели */}
      <motion.div 
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <div className="text-white flex items-center">
            {event ? (
              <>
                <span className="bg-destructive text-white text-xs px-1 rounded mr-2">LIVE</span>
                <span className="font-bold">{event.homeTeam} vs {event.awayTeam}</span>
                <span className="ml-2 text-xs">
                  {event.liveMinute}' {event.homeScore} - {event.awayScore}
                </span>
              </>
            ) : (
              <span>{stream.title}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Кнопка "Низкая задержка" */}
            {supportsWebRTC && (
              <Button variant="ghost" size="sm" className="text-white h-8 px-2 hover:bg-white/20">
                <span className="material-icons text-sm mr-1">speed</span>
                <span className="text-xs">Низкая задержка</span>
              </Button>
            )}
            
            {/* Индикатор качества и выбор */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-white h-8 px-2 hover:bg-white/20"
                onClick={() => setShowQualityOptions(!showQualityOptions)}
              >
                <span className="material-icons text-sm mr-1">hd</span>
                <span className="text-xs">{currentQuality}</span>
              </Button>
              
              {showQualityOptions && (
                <div className="absolute right-0 top-full mt-1 bg-card shadow-lg rounded-md p-2 z-10 text-foreground">
                  {availableQualities.map(quality => (
                    <div
                      key={quality}
                      className={`px-3 py-1 cursor-pointer hover:bg-card-muted rounded ${
                        quality === currentQuality ? 'text-primary' : ''
                      }`}
                      onClick={() => handleQualityChange(quality)}
                    >
                      {quality}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Кнопка Picture-in-Picture */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-8 hover:bg-white/20"
              onClick={handlePiPMode}
            >
              <span className="material-icons">picture_in_picture_alt</span>
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Overlay нижней панели с управлением */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          {/* Индикатор статуса */}
          <div className="flex items-center">
            <div className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </div>
            <span className="text-white text-xs">Live</span>
          </div>
          
          {/* Progress Bar (имитация для live) */}
          <div className="flex-1 mx-4 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '90%' }}></div>
          </div>
          
          {/* Таймкод */}
          <div className="text-white text-xs">LIVE</div>
        </div>
        
        <div className="flex justify-between items-center">
          {/* Левая группа кнопок */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-8 hover:bg-white/20"
              onClick={togglePlay}
            >
              <span className="material-icons">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-8 hover:bg-white/20"
              onClick={toggleMute}
            >
              <span className="material-icons">
                {isMuted ? 'volume_off' : volume > 50 ? 'volume_up' : 'volume_down'}
              </span>
            </Button>
            
            <div className="w-20 px-1">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 accent-primary bg-white/30 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          {/* Центральная группа - пусто или какие-то доп. элементы */}
          <div className="flex-1"></div>
          
          {/* Правая группа кнопок */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-8 hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <span className="material-icons">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white h-8 hover:bg-white/20"
              onClick={handlePiPMode}
            >
              <span className="material-icons">picture_in_picture_alt</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoPlayer;