import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LiveStream, LiveStreamStats, StatsType, Event } from '@shared/schema';
import VideoPlayer from './video-player';
import MatchStats from './match-stats';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveStreamManagerProps {
  event: Event;
  initialStream?: LiveStream;
  initialStats?: LiveStreamStats;
}

const LiveStreamManager: React.FC<LiveStreamManagerProps> = ({
  event,
  initialStream,
  initialStats
}) => {
  const [stream, setStream] = useState<LiveStream | undefined>(initialStream);
  const [stats, setStats] = useState<StatsType | undefined>(initialStats?.stats as StatsType | undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  
  const connectWebSocket = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    // Determine websocket protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsLoading(false);
        
        // Subscribe to the event
        socket.send(JSON.stringify({
          type: 'subscribe',
          eventId: event.id
        }));
      };
      
      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          
          if (data.type === 'stream_info' && data.stream) {
            setStream(data.stream);
          } else if (data.type === 'stats' && data.stats) {
            setStats(data.stats.stats);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError('Failed to connect to the live stream. Please try again later.');
        setIsLoading(false);
        setIsConnected(false);
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      socketRef.current = socket;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to initialize WebSocket connection.');
      setIsLoading(false);
    }
  }, [event.id]);
  
  // Connect to WebSocket when the component mounts
  useEffect(() => {
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={connectWebSocket}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <VideoPlayer 
            stream={stream}
            isLoading={isLoading && !stream}
          />
        </div>
        
        <div>
          <MatchStats 
            event={event}
            stats={stats}
            isLoading={isLoading && !stats}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamManager;