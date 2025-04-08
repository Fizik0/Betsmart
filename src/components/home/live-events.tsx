import { useState } from 'react';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Event, Sport } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

const LiveEvents = () => {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const bettingSlip = useBettingSlip();
  
  const { data: sports, isLoading: loadingSports } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });
  
  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true, sportId: selectedSport }],
  });
  
  const isLoading = loadingSports || loadingEvents;
  
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
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-condensed font-bold text-lighttext flex items-center">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
          Live Now
        </h2>
        <Link href="/live" className="text-secondary hover:underline text-sm">
          View All
        </Link>
      </div>
      
      <div className="overflow-x-auto pb-2">
        {isLoading ? (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button 
              variant={selectedSport === null ? 'secondary' : 'outline'}
              className={`whitespace-nowrap rounded-full text-sm ${
                selectedSport === null ? '' : 'text-mutedtext bg-darkaccent hover:bg-darkbg2 hover:text-lighttext'
              }`}
              onClick={() => setSelectedSport(null)}
            >
              All Sports
            </Button>
            
            {sports?.map(sport => (
              <Button
                key={sport.id}
                variant={selectedSport === sport.id ? 'secondary' : 'outline'}
                className={`whitespace-nowrap rounded-full text-sm ${
                  selectedSport === sport.id ? '' : 'text-mutedtext bg-darkaccent hover:bg-darkbg2 hover:text-lighttext'
                }`}
                onClick={() => setSelectedSport(sport.id)}
              >
                {sport.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-3 mt-4">
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-darkbg2 rounded-lg overflow-hidden">
              <div className="bg-darkaccent px-4 py-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="p-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map(j => (
                      <Skeleton key={j} className="h-10 w-16 rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : events && events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="bg-darkbg2 rounded-lg overflow-hidden">
              <div className="bg-darkaccent px-4 py-2 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="material-icons text-sm text-destructive mr-2">
                    {event.sportId === 1 ? 'sports_soccer' : 
                     event.sportId === 2 ? 'sports_basketball' : 
                     event.sportId === 3 ? 'sports_tennis' : 
                     'sports'}
                  </span>
                  <span className="text-mutedtext text-sm">{event.league}</span>
                </div>
                <div className="flex items-center text-mutedtext text-sm">
                  <span className="bg-destructive text-white text-xs px-1 rounded mr-2">LIVE</span>
                  <span>{event.liveMinute}'</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-condensed text-lg text-lighttext">{event.homeTeam}</span>
                      <span className="ml-3 font-mono text-lighttext text-xl">{event.homeScore}</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="font-condensed text-lg text-lighttext">{event.awayTeam}</span>
                      <span className="ml-3 font-mono text-lighttext text-xl">{event.awayScore}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {event.odds.homeWin && (
                      <button 
                        className="bg-darkbg hover:bg-darkaccent text-white py-2 px-4 rounded-lg transition-colors"
                        onClick={() => handleAddToBetSlip(
                          event, 
                          'Match Result', 
                          event.homeTeam, 
                          event.odds.homeWin
                        )}
                      >
                        <span className="font-mono text-sm">{event.odds.homeWin.toFixed(2)}</span>
                      </button>
                    )}
                    
                    {event.odds.draw && (
                      <button 
                        className="bg-darkbg hover:bg-darkaccent text-white py-2 px-4 rounded-lg transition-colors"
                        onClick={() => handleAddToBetSlip(
                          event, 
                          'Match Result', 
                          'Draw', 
                          event.odds.draw
                        )}
                      >
                        <span className="font-mono text-sm">{event.odds.draw.toFixed(2)}</span>
                      </button>
                    )}
                    
                    {event.odds.awayWin && (
                      <button 
                        className="bg-darkbg hover:bg-darkaccent text-white py-2 px-4 rounded-lg transition-colors"
                        onClick={() => handleAddToBetSlip(
                          event, 
                          'Match Result', 
                          event.awayTeam, 
                          event.odds.awayWin
                        )}
                      >
                        <span className="font-mono text-sm">{event.odds.awayWin.toFixed(2)}</span>
                      </button>
                    )}
                    
                    <button className="bg-darkbg hover:bg-darkaccent text-white py-2 px-4 rounded-lg flex items-center">
                      <span className="material-icons text-sm">add</span>
                      <span className="text-xs ml-1">more</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <span className="material-icons text-mutedtext text-4xl mb-2">sports</span>
            <p className="text-mutedtext">No live events available</p>
            <p className="text-xs text-mutedtext mt-2">Check back later for live action</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveEvents;
