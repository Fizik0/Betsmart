import { useState } from 'react';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Event } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

const UpcomingEvents = () => {
  const [showMore, setShowMore] = useState(false);
  const bettingSlip = useBettingSlip();
  
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const upcomingEvents = events
    ?.filter(event => !event.isLive)
    .slice(0, showMore ? 8 : 4);
  
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
        <h2 className="text-xl font-condensed font-bold text-lighttext">Upcoming Events</h2>
        <div className="flex space-x-2">
          <button className="text-mutedtext hover:text-lighttext">
            <span className="material-icons">filter_list</span>
          </button>
          <button className="text-mutedtext hover:text-lighttext">
            <span className="material-icons">today</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-darkbg2 hover:bg-darkaccent cursor-pointer rounded-lg p-4 transition-colors">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="h-8 w-16 rounded" />
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <div key={event.id} className="bg-darkbg2 hover:bg-darkaccent cursor-pointer rounded-lg p-4 transition-colors">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center mb-1">
                    <span className="material-icons text-mutedtext text-sm mr-1">
                      {event.sportId === 1 ? 'sports_soccer' : 
                       event.sportId === 2 ? 'sports_basketball' : 
                       event.sportId === 3 ? 'sports_tennis' : 
                       'sports'}
                    </span>
                    <span className="text-mutedtext text-sm">{event.league}</span>
                    <span className="text-mutedtext text-sm mx-2">•</span>
                    <span className="text-mutedtext text-sm">
                      {new Date(event.startTime).toLocaleString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className="font-condensed text-lighttext text-lg">{event.homeTeam} vs {event.awayTeam}</h3>
                  
                  {event.popular && (
                    <div className="flex items-center mt-1">
                      <span className="text-mutedtext text-xs">Popular event</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {event.odds.homeWin && (
                    <button 
                      className="bg-darkbg hover:bg-darkaccent text-white py-1 px-3 rounded transition-colors"
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
                      className="bg-darkbg hover:bg-darkaccent text-white py-1 px-3 rounded transition-colors"
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
                      className="bg-darkbg hover:bg-darkaccent text-white py-1 px-3 rounded transition-colors"
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
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <span className="material-icons text-mutedtext text-4xl mb-2">event</span>
            <p className="text-mutedtext">No upcoming events available</p>
            <p className="text-xs text-mutedtext mt-2">Check back later for upcoming events</p>
          </div>
        )}
      </div>
      
      {!isLoading && upcomingEvents && upcomingEvents.length > 0 && (
        <button 
          className="mt-4 w-full bg-darkaccent hover:bg-darkbg2 text-mutedtext hover:text-lighttext py-2 rounded text-center transition-colors"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Show Less Events' : 'Show More Events'}
        </button>
      )}
    </div>
  );
};

export default UpcomingEvents;
