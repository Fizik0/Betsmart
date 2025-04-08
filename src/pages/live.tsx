import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sport, Event, LiveStream, LiveStreamStats } from '@shared/schema';
import { Helmet } from 'react-helmet';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useLocation } from 'wouter';
import LiveStreamManager from '@/components/live/live-stream-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OddsType } from '@/lib/types';
import { queryClient } from '@/lib/queryClient';

const EventDetail = ({ eventId }: { eventId: number }) => {
  const { data: event, isLoading: loadingEvent } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
  });
  
  const { data: stream } = useQuery<LiveStream>({
    queryKey: ['/api/events', eventId, 'stream'],
  });
  
  const { data: stats } = useQuery<LiveStreamStats>({
    queryKey: ['/api/events', eventId, 'stats'],
  });
  
  if (loadingEvent) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {event.homeTeam} vs {event.awayTeam}
          </h1>
          <p className="text-muted-foreground">
            {event.league} • Live {event.liveMinute}' • Score: {event.homeScore} - {event.awayScore}
          </p>
        </div>
      </div>
      
      <LiveStreamManager
        event={event}
        initialStream={stream}
        initialStats={stats}
      />
    </div>
  );
};

const LivePage = () => {
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const bettingSlip = useBettingSlip();
  const [, setLocation] = useLocation();
  
  const { data: sports, isLoading: loadingSports } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });
  
  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true, sportId: selectedSport }],
  });
  
  const isLoading = loadingSports || loadingEvents;
  
  const handleAddToBetSlip = (event: Event, selectionType: string, selection: string, odds: number) => {
    // Ensure event.odds is a valid OddsType object
    const eventOdds = event.odds as OddsType;
    
    bettingSlip.addBet({
      id: `${event.id}-${selectionType}-${selection}`,
      eventId: event.id,
      sportIcon: event.sportId === 1 ? 'sports_soccer' : 
                event.sportId === 2 ? 'sports_basketball' : 
                event.sportId === 3 ? 'sports_tennis' : 
                'sports',
      league: event.league,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      betType: selectionType,
      selection,
      odds,
    });
  };
  
  // Implement auto refresh for live events
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (events && events.length > 0) {
        // Refresh live events data every 30 seconds
        queryClient.invalidateQueries({ queryKey: ['/api/events', { isLive: true, sportId: selectedSport }] });
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [events, selectedSport]);
  
  return (
    <>
      <Helmet>
        <title>Live Events - BetSmart</title>
        <meta name="description" content="Watch and bet on live sporting events with real-time updates and odds." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            <h1 className="gradient-heading">Live Events</h1>
          </div>
          <div className="hidden md:block">
            <p className="text-muted-foreground text-sm">Watch live games and place bets in real-time</p>
          </div>
        </div>

        {/* Main content */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="mb-6 bg-secondary/20 p-1 rounded-lg">
            <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <span className="material-icons text-sm">view_list</span>
              All Events
            </TabsTrigger>
            {selectedEvent && (
              <TabsTrigger value="watch" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <span className="material-icons text-sm">live_tv</span>
                Watch Live
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="events">
            <div className="overflow-x-auto pb-6 mb-6">
              <div className="flex gap-3">
                <button 
                  className={`whitespace-nowrap py-2.5 px-5 rounded-full text-sm font-medium transition-all shadow-sm ${
                    selectedSport === null 
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/20' 
                      : 'bg-secondary/50 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  onClick={() => setSelectedSport(null)}
                >
                  All Sports
                </button>
                
                {!loadingSports && sports?.map(sport => (
                  <button
                    key={sport.id}
                    className={`whitespace-nowrap py-2.5 px-5 rounded-full text-sm font-medium transition-all shadow-sm ${
                      selectedSport === sport.id 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/20' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                    onClick={() => setSelectedSport(sport.id === selectedSport ? null : sport.id)}
                  >
                    <span className="material-icons text-sm mr-2 align-text-bottom">{sport.icon}</span>
                    {sport.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                [1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex justify-between pt-4">
                        <div className="flex-1">
                          <Skeleton className="h-6 w-48 mb-3" />
                          <div className="flex items-center mb-3">
                            <Skeleton className="h-6 w-24 mr-3" />
                            <Skeleton className="h-6 w-8" />
                          </div>
                          <div className="flex items-center">
                            <Skeleton className="h-6 w-24 mr-3" />
                            <Skeleton className="h-6 w-8" />
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Skeleton className="h-20 w-48 rounded-lg" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-10 w-16 rounded-lg" />
                            <Skeleton className="h-10 w-16 rounded-lg" />
                            <Skeleton className="h-10 w-16 rounded-lg" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : events && events.length > 0 ? (
                events.map(event => (
                  <Card key={event.id} className="overflow-hidden card-hover glass-card">
                    <div className="bg-primary/5 px-4 py-2 flex justify-between items-center border-b border-border/50">
                      <div className="flex items-center">
                        <span className="material-icons text-sm text-primary mr-2">
                          {event.sportId === 1 ? 'sports_soccer' : 
                          event.sportId === 2 ? 'sports_basketball' : 
                          event.sportId === 3 ? 'sports_tennis' :
                          event.sportId === 4 ? 'sports_hockey' :
                          event.sportId === 5 ? 'sports_baseball' :
                          event.sportId === 6 ? 'videogame_asset' :
                          'sports'}
                        </span>
                        <span className="text-muted-foreground text-sm font-medium">{event.league}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="live-badge">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          LIVE
                        </span>
                        <span className="text-muted-foreground text-sm font-mono">{event.liveMinute || 0}'</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold">{event.homeTeam} vs {event.awayTeam}</h2>
                        {event.hasLiveStream && (
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                            onClick={() => {
                              setSelectedEvent(event.id);
                              // Force tab switch
                              const tabElement = document.querySelector('[data-value="watch"]') as HTMLElement;
                              if (tabElement) tabElement.click();
                            }}
                          >
                            <span className="material-icons text-sm">live_tv</span>
                            Watch Live
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-secondary/5 rounded-lg p-4 flex flex-col">
                          <h3 className="text-sm text-muted-foreground mb-4 font-medium">Current Score</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">H</div>
                                <span className="font-medium">{event.homeTeam}</span>
                              </div>
                              <span className="font-mono text-2xl font-bold">{event.homeScore || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-foreground font-bold">A</div>
                                <span className="font-medium">{event.awayTeam}</span>
                              </div>
                              <span className="font-mono text-2xl font-bold">{event.awayScore || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-4">
                          <div className="bg-secondary/5 rounded-lg p-4">
                            <h3 className="text-sm text-muted-foreground mb-3 font-medium">Match Result</h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {(event.odds as OddsType).homeWin && (
                                <button 
                                  className="odds-button flex-1"
                                  onClick={() => handleAddToBetSlip(
                                    event, 
                                    'Match Result', 
                                    event.homeTeam, 
                                    (event.odds as OddsType).homeWin!
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Home</span>
                                    <span className="text-sm font-medium">{event.homeTeam}</span>
                                  </div>
                                  <span className="font-mono text-primary text-lg font-bold">{((event.odds as OddsType).homeWin!).toFixed(2)}</span>
                                </button>
                              )}
                              
                              {(event.odds as OddsType).draw && (
                                <button 
                                  className="odds-button flex-1"
                                  onClick={() => handleAddToBetSlip(
                                    event, 
                                    'Match Result', 
                                    'Draw', 
                                    (event.odds as OddsType).draw!
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Draw</span>
                                    <span className="text-sm font-medium">X</span>
                                  </div>
                                  <span className="font-mono text-primary text-lg font-bold">{((event.odds as OddsType).draw!).toFixed(2)}</span>
                                </button>
                              )}
                              
                              {(event.odds as OddsType).awayWin && (
                                <button 
                                  className="odds-button flex-1"
                                  onClick={() => handleAddToBetSlip(
                                    event, 
                                    'Match Result', 
                                    event.awayTeam, 
                                    (event.odds as OddsType).awayWin!
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Away</span>
                                    <span className="text-sm font-medium">{event.awayTeam}</span>
                                  </div>
                                  <span className="font-mono text-primary text-lg font-bold">{((event.odds as OddsType).awayWin!).toFixed(2)}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 px-8 glass-card rounded-xl">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                    <span className="material-icons text-primary text-4xl">sports_score</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 gradient-heading">No live events right now</h3>
                  <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-6">
                    {selectedSport 
                      ? 'There are no live events for this sport currently. Please check back later or select another sport.'
                      : 'There are no live events currently. Please check back later.'}
                  </p>
                  <Button 
                    variant="outline" 
                    className="bg-secondary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary border-border/50"
                    onClick={() => window.location.reload()}
                  >
                    <span className="material-icons text-sm mr-2">refresh</span>
                    Refresh Events
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="watch">
            {selectedEvent && <EventDetail eventId={selectedEvent} />}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default LivePage;
