import { useState, useRef, useEffect } from 'react';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Event } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const bettingSlip = useBettingSlip();
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true }],
  });
  
  const featuredEvents = events?.filter(event => event.popular) || [];
  
  useEffect(() => {
    // Set up auto-slide
    const interval = setInterval(() => {
      if (featuredEvents.length > 1) {
        setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
      }
    }, 7000);
    
    return () => clearInterval(interval);
  }, [featuredEvents.length]);
  
  const handlePrev = () => {
    if (featuredEvents.length > 1) {
      setCurrentSlide((prev) => (prev === 0 ? featuredEvents.length - 1 : prev - 1));
    }
  };
  
  const handleNext = () => {
    if (featuredEvents.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }
  };
  
  const handleAddToBetSlip = (event: Event, selectionType: string, selection: string, odds: number) => {
    bettingSlip.addBet({
      id: `${event.id}-${selectionType}-${selection}`,
      eventId: event.id,
      sportIcon: event.sportId === 1 ? 'sports_soccer' : 
                event.sportId === 2 ? 'sports_basketball' : 
                event.sportId === 3 ? 'sports_tennis' : 
                'sports',
      league: event.league,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      betType: 'Match Result',
      selection,
      odds,
    });
  };
  
  if (isLoading) {
    return (
      <div className="mb-8 relative overflow-hidden rounded-lg">
        <Skeleton className="w-full h-64" />
      </div>
    );
  }
  
  if (!featuredEvents.length) {
    return null;
  }
  
  const currentEvent = featuredEvents[currentSlide];
  
  return (
    <div className="mb-8 relative overflow-hidden rounded-lg">
      <div className="relative h-64" ref={sliderRef}>
        {/* Image Background */}
        <div className="w-full h-full bg-gradient-to-r from-darkbg to-darkbg2 absolute inset-0" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-center mb-2">
            <span className="text-xs font-medium bg-red-600 text-white px-2 py-1 rounded">LIVE</span>
            <span className="text-xs font-medium bg-darkbg text-white px-2 py-1 rounded ml-2">{currentEvent.league.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-condensed font-bold text-white">
            {currentEvent.homeTeam} vs. {currentEvent.awayTeam}
          </h2>
          <p className="text-lighttext mb-4">
            {currentEvent.isLive ? 
              `Live - ${currentEvent.liveMinute}'` : 
              new Date(currentEvent.startTime).toLocaleString('en-US', { 
                weekday: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }
          </p>
          <div className="flex flex-wrap gap-2">
            {currentEvent.odds.homeWin && (
              <button 
                className="bg-darkbg bg-opacity-80 hover:bg-opacity-100 text-white py-2 px-4 rounded-lg flex items-center"
                onClick={() => handleAddToBetSlip(
                  currentEvent, 
                  'Match Result', 
                  currentEvent.homeTeam, 
                  currentEvent.odds.homeWin!
                )}
              >
                <span className="font-mono">{currentEvent.odds.homeWin.toFixed(2)}</span>
                <span className="ml-2 text-xs uppercase whitespace-nowrap">{currentEvent.homeTeam}</span>
              </button>
            )}
            
            {currentEvent.odds.draw && (
              <button 
                className="bg-darkbg bg-opacity-80 hover:bg-opacity-100 text-white py-2 px-4 rounded-lg flex items-center"
                onClick={() => handleAddToBetSlip(
                  currentEvent, 
                  'Match Result', 
                  'Draw', 
                  currentEvent.odds.draw!
                )}
              >
                <span className="font-mono">{currentEvent.odds.draw.toFixed(2)}</span>
                <span className="ml-2 text-xs uppercase">Draw</span>
              </button>
            )}
            
            {currentEvent.odds.awayWin && (
              <button 
                className="bg-darkbg bg-opacity-80 hover:bg-opacity-100 text-white py-2 px-4 rounded-lg flex items-center"
                onClick={() => handleAddToBetSlip(
                  currentEvent, 
                  'Match Result', 
                  currentEvent.awayTeam, 
                  currentEvent.odds.awayWin!
                )}
              >
                <span className="font-mono">{currentEvent.odds.awayWin.toFixed(2)}</span>
                <span className="ml-2 text-xs uppercase whitespace-nowrap">{currentEvent.awayTeam}</span>
              </button>
            )}
            
            <Button variant="secondary" className="bg-opacity-80 hover:bg-opacity-100 py-2 px-4 rounded-lg text-xs">
              +126 more
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      {featuredEvents.length > 1 && (
        <>
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-darkbg2 bg-opacity-50 hover:bg-opacity-70 rounded-full p-1"
            onClick={handlePrev}
          >
            <span className="material-icons text-white">chevron_left</span>
          </button>
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-darkbg2 bg-opacity-50 hover:bg-opacity-70 rounded-full p-1"
            onClick={handleNext}
          >
            <span className="material-icons text-white">chevron_right</span>
          </button>
          
          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {featuredEvents.map((_, idx) => (
              <button 
                key={idx}
                className={`h-1 w-${idx === currentSlide ? '8' : '4'} ${idx === currentSlide ? 'bg-primary' : 'bg-white bg-opacity-50'} rounded-full`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FeaturedSlider;
