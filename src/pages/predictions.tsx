import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "../components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, BarChart2, Brain, CalendarDays, CheckCircle, Info, TrendingUp } from "lucide-react";
import { Event, Sport } from "@/lib/types";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function PredictionsPage() {
  const [, navigate] = useLocation();
  
  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: sports, isLoading: isLoadingSports } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });
  
  const isLoading = isLoadingEvents || isLoadingSports;
  
  // Фильтруем только предстоящие события
  const upcomingEvents = events?.filter(event => 
    event.status === "scheduled" || event.status === "not_started"
  ) || [];
  
  // Группируем события по видам спорта
  const eventsBySport = upcomingEvents.reduce((acc, event) => {
    const sportId = event.sportId;
    if (!acc[sportId]) {
      acc[sportId] = [];
    }
    acc[sportId].push(event);
    return acc;
  }, {} as Record<number, Event[]>);
  
  // Получаем список спортов с событиями
  const sportsWithEvents = sports?.filter(sport => 
    eventsBySport[sport.id] && eventsBySport[sport.id].length > 0
  ) || [];
  
  return (
    <div className="container py-6 max-w-6xl">
      <PageTitle 
        title="GPT-4.5 Turbo Предсказания" 
        description="Анализ и прогнозы предстоящих спортивных событий с использованием продвинутого искусственного интеллекта"
        icon={<Brain className="h-8 w-8 text-primary" />}
      />
      
      <Tabs defaultValue="all" className="w-full mt-6">
        <TabsList className="w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="all" className="flex-1">Все события</TabsTrigger>
          <TabsTrigger value="trending" className="flex-1">Популярные</TabsTrigger>
          <TabsTrigger value="value" className="flex-1">Ценные ставки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(j => (
                      <Skeleton key={j} className="h-32 w-full rounded-lg" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sportsWithEvents.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Нет предстоящих событий</CardTitle>
                <CardDescription>
                  В данный момент нет событий для предсказаний
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <CalendarDays className="h-16 w-16 text-muted-foreground/50" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sportsWithEvents.map(sport => (
                <SportPredictionSection 
                  key={sport.id} 
                  sport={sport} 
                  events={eventsBySport[sport.id]} 
                  onEventClick={(eventId) => navigate(`/events/${eventId}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
                    Популярные события с прогнозами GPT-4.5
                  </CardTitle>
                  <CardDescription>
                    События, привлекающие наибольшее внимание игроков и аналитиков
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents
                    .filter(event => event.popular)
                    .map(event => (
                      <PredictionEventCard 
                        key={event.id} 
                        event={event} 
                        sport={sports?.find(s => s.id === event.sportId)} 
                        onClick={() => navigate(`/events/${event.id}`)}
                        showTrending
                      />
                    ))}
                  
                  {upcomingEvents.filter(event => event.popular).length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8">
                      <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-center text-muted-foreground">
                        В данный момент нет популярных событий с прогнозами
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="value">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2 text-green-500" />
                    Ценные ставки с высоким коэффициентом
                  </CardTitle>
                  <CardDescription>
                    События с выгодными коэффициентами по мнению GPT-4.5 Turbo
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents
                    .slice(0, 6) // Для демонстрации используем первые 6 событий
                    .map(event => (
                      <PredictionEventCard 
                        key={event.id} 
                        event={event} 
                        sport={sports?.find(s => s.id === event.sportId)} 
                        onClick={() => navigate(`/events/${event.id}`)}
                        showValueBet
                      />
                    ))}
                  
                  {upcomingEvents.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8">
                      <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-center text-muted-foreground">
                        В данный момент нет событий с ценными ставками
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SportPredictionSectionProps {
  sport: Sport;
  events: Event[];
  onEventClick: (eventId: number) => void;
}

function SportPredictionSection({ sport, events, onEventClick }: SportPredictionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="material-icons mr-2">{sport.icon}</span>
          {sport.name}
        </CardTitle>
        <CardDescription>
          Предсказания GPT-4.5 Turbo для предстоящих событий
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <PredictionEventCard 
            key={event.id} 
            event={event} 
            sport={sport} 
            onClick={() => onEventClick(event.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface PredictionEventCardProps {
  event: Event;
  sport?: Sport;
  showTrending?: boolean;
  showValueBet?: boolean;
  onClick: () => void;
}

function PredictionEventCard({ event, sport, showTrending, showValueBet, onClick }: PredictionEventCardProps) {
  // Генерируем случайные значения для прогноза для демонстрации
  // В реальном приложении здесь будут данные от GPT-4.5
  const homeWinProb = Math.random();
  const drawProb = Math.random() * (1 - homeWinProb);
  const awayWinProb = 1 - homeWinProb - drawProb;
  
  const probabilities = [
    { label: 'П1', value: homeWinProb * 100, type: 'home' },
    { label: 'X', value: drawProb * 100, type: 'draw' },
    { label: 'П2', value: awayWinProb * 100, type: 'away' },
  ];
  
  // Получаем коэффициенты
  const homeOdds = event.odds?.homeWin || 0;
  const drawOdds = event.odds?.draw || 0;
  const awayOdds = event.odds?.awayWin || 0;
  
  return (
    <div 
      className="rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary transition-colors cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      {/* Верхняя плашка с GPT-4.5 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600" />
      
      {showTrending && (
        <Badge className="absolute top-2 right-2 bg-orange-600 hover:bg-orange-700">
          Популярно
        </Badge>
      )}
      
      {showValueBet && (
        <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
          Выгодный коэф
        </Badge>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center">
              <span className="material-icons text-xs mr-1">{sport?.icon}</span>
              {event.league}
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs mr-2 px-1 py-0 h-4">
                GPT-4.5
              </Badge>
              <p className="text-xs text-muted-foreground">
                {new Date(event.startTime).toLocaleDateString()} 
                {" "}
                {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <h3 className="font-medium text-base">{event.homeTeam} vs {event.awayTeam}</h3>
        </div>
        
        <div className="space-y-2 mb-3">
          {probabilities.map((prob, index) => (
            <div key={index} className="flex items-center">
              <div className="w-8 text-xs font-medium">{prob.label}</div>
              <div className="flex-1 mx-2">
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className={cn(
                      "h-full",
                      prob.type === 'home' ? "bg-blue-600" : 
                      prob.type === 'draw' ? "bg-gray-600" : 
                      "bg-purple-600"
                    )} 
                    style={{ width: `${prob.value}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-xs text-right">
                {prob.value.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center border-t pt-2">
          <div className="text-xs text-muted-foreground">
            Коэффициенты
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-xs">
              {homeOdds.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {drawOdds.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {awayOdds.toFixed(2)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}