import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sport, Event } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { Helmet } from 'react-helmet';

const Sports = () => {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const bettingSlip = useBettingSlip();
  
  const { data: sports, isLoading: loadingSports } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });
  
  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events', { sportId: selectedSport }],
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
    <>
      <Helmet>
        <title>Sports - BetSmart</title>
        <meta name="description" content="Browse all sports events and place your bets with BetSmart's competitive odds." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-condensed font-bold text-lighttext mb-4">Sports</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {loadingSports ? (
              Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : (
              sports?.map(sport => (
                <button
                  key={sport.id}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                    selectedSport === sport.id 
                      ? 'bg-primary text-white' 
                      : 'bg-darkbg2 text-lighttext hover:bg-darkaccent'
                  }`}
                  onClick={() => setSelectedSport(sport.id === selectedSport ? null : sport.id)}
                >
                  <span className="material-icons text-3xl mb-2">{sport.icon}</span>
                  <span className="font-condensed">{sport.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-condensed font-bold text-lighttext">
              {selectedSport 
                ? `${sports?.find(s => s.id === selectedSport)?.name} Events` 
                : 'All Events'}
            </h2>
            
            <div className="flex space-x-2">
              <button className="text-mutedtext hover:text-lighttext">
                <span className="material-icons">filter_list</span>
              </button>
              <button className="text-mutedtext hover:text-lighttext">
                <span className="material-icons">search</span>
              </button>
            </div>
          </div>
          
          <div>
            {loadingEvents ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-darkbg2 rounded-lg overflow-hidden mb-3">
                  <div className="bg-darkaccent px-4 py-2">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="p-4">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex space-x-2">
                        {Array(3).fill(0).map((_, j) => (
                          <Skeleton key={j} className="h-10 w-20 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="bg-darkbg2 rounded-lg overflow-hidden">
                    <div className="bg-darkaccent px-4 py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="material-icons text-sm text-mutedtext mr-2">
                          {event.sportId === 1 ? 'sports_soccer' : 
                           event.sportId === 2 ? 'sports_basketball' : 
                           event.sportId === 3 ? 'sports_tennis' : 
                           'sports'}
                        </span>
                        <span className="text-mutedtext text-sm">{event.league}</span>
                      </div>
                      
                      <div className="flex items-center text-mutedtext text-sm">
                        {event.isLive ? (
                          <>
                            <span className="bg-destructive text-white text-xs px-1 rounded mr-2">LIVE</span>
                            <span>{event.liveMinute}'</span>
                          </>
                        ) : (
                          <span>
                            {new Date(event.startTime).toLocaleString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-condensed text-lg text-lighttext mb-3">{event.homeTeam} vs {event.awayTeam}</h3>
                      
                      {event.isLive && (
                        <div className="flex mb-3">
                          <div className="flex items-center mr-8">
                            <span className="font-condensed text-lighttext">{event.homeTeam}</span>
                            <span className="ml-2 font-mono text-lighttext text-lg">{event.homeScore}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-condensed text-lighttext">{event.awayTeam}</span>
                            <span className="ml-2 font-mono text-lighttext text-lg">{event.awayScore}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {event.odds.homeWin && (
                          <Button 
                            variant="outline"
                            className="bg-darkbg text-white hover:bg-darkaccent"
                            onClick={() => handleAddToBetSlip(
                              event, 
                              'Match Result', 
                              event.homeTeam, 
                              event.odds.homeWin
                            )}
                          >
                            <span className="font-mono mr-2">{event.odds.homeWin.toFixed(2)}</span>
                            <span className="text-xs uppercase">{event.homeTeam}</span>
                          </Button>
                        )}
                        
                        {event.odds.draw && (
                          <Button 
                            variant="outline"
                            className="bg-darkbg text-white hover:bg-darkaccent"
                            onClick={() => handleAddToBetSlip(
                              event, 
                              'Match Result', 
                              'Draw', 
                              event.odds.draw
                            )}
                          >
                            <span className="font-mono mr-2">{event.odds.draw.toFixed(2)}</span>
                            <span className="text-xs uppercase">Draw</span>
                          </Button>
                        )}
                        
                        {event.odds.awayWin && (
                          <Button 
                            variant="outline"
                            className="bg-darkbg text-white hover:bg-darkaccent"
                            onClick={() => handleAddToBetSlip(
                              event, 
                              'Match Result', 
                              event.awayTeam, 
                              event.odds.awayWin
                            )}
                          >
                            <span className="font-mono mr-2">{event.odds.awayWin.toFixed(2)}</span>
                            <span className="text-xs uppercase">{event.awayTeam}</span>
                          </Button>
                        )}
                        
                        <Button variant="outline" className="bg-darkbg text-white hover:bg-darkaccent">
                          <span className="material-icons text-sm mr-1">add</span>
                          <span className="text-xs">More</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-darkbg2 rounded-lg">
                <span className="material-icons text-mutedtext text-5xl mb-4">sports</span>
                <h3 className="text-xl font-condensed text-lighttext mb-2">No events found</h3>
                <p className="text-mutedtext">
                  {selectedSport 
                    ? 'There are no events available for this sport. Please try another sport.'
                    : 'No events are currently available. Please check back later.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sports;
