import { createContext, useContext, useState, ReactNode } from 'react';
import { LiveStream, LiveStreamStats } from '@shared/schema';

type PiPContextType = {
  openPiP: (stream: LiveStream, stats?: LiveStreamStats) => void;
  closePiP: () => void;
  isPiPOpen: boolean;
  currentStream?: LiveStream;
  currentStats?: LiveStreamStats;
};

const PiPContext = createContext<PiPContextType | undefined>(undefined);

export const PiPProvider = ({ children }: { children: ReactNode }) => {
  const [isPiPOpen, setIsPiPOpen] = useState(false);
  const [currentStream, setCurrentStream] = useState<LiveStream | undefined>();
  const [currentStats, setCurrentStats] = useState<LiveStreamStats | undefined>();
  
  // Метод для открытия PiP с указанным потоком
  const openPiP = (stream: LiveStream, stats?: LiveStreamStats) => {
    setCurrentStream(stream);
    setCurrentStats(stats);
    setIsPiPOpen(true);
  };
  
  // Метод для закрытия PiP
  const closePiP = () => {
    setIsPiPOpen(false);
  };
  
  return (
    <PiPContext.Provider value={{ 
      openPiP, 
      closePiP, 
      isPiPOpen, 
      currentStream, 
      currentStats 
    }}>
      {children}
    </PiPContext.Provider>
  );
};

export const usePiPPlayer = (): PiPContextType => {
  const context = useContext(PiPContext);
  
  if (context === undefined) {
    throw new Error('usePiPPlayer must be used within a PiPProvider');
  }
  
  return context;
};