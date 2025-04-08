import { useQuery } from '@tanstack/react-query';
import { Event, Sport } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Тип для горячей ставки (обычно эта информация приходила бы с сервера)
type HotBet = {
  id: string;
  eventId: number;
  betType: string;
  selection: string;
  odds: number;
  betCount: number; // сколько пользователей сделали эту ставку
  placedAmount: number; // общая сумма ставок
  trend: 'up' | 'down' | 'neutral'; // тренд популярности
  percentageChange: number; // изменение в процентах
};

// Генерация горячих ставок на основе событий
// В реальном приложении эти данные должны приходить с сервера
const generateHotBets = (events: Event[]): HotBet[] => {
  if (!events?.length) return [];
  
  // Функция для генерации случайных данных для демонстрации
  const getRandomTrend = (): 'up' | 'down' | 'neutral' => {
    const rand = Math.random();
    if (rand > 0.6) return 'up';
    if (rand > 0.3) return 'down';
    return 'neutral';
  };
  
  // Берем несколько случайных событий для демонстрации
  const selectedEvents = events.filter(e => e.popular).slice(0, 3);
  
  return selectedEvents.map(event => {
    const selectionType = Math.random() > 0.6 ? 'homeWin' : Math.random() > 0.5 ? 'awayWin' : 'draw';
    const selection = selectionType === 'homeWin' 
      ? event.homeTeam 
      : selectionType === 'awayWin' 
        ? event.awayTeam 
        : 'Draw';
    
    // Обеспечиваем безопасную типизацию для odds
    const odds = event.odds && typeof event.odds === 'object' ? 
                (event.odds as any)[selectionType] || 1.9 : 
                1.9;
    const trend = getRandomTrend();
    
    return {
      id: `hot-${event.id}-${selectionType}`,
      eventId: event.id,
      betType: 'Match Result',
      selection,
      odds,
      betCount: Math.floor(Math.random() * 100) + 50,
      placedAmount: Math.floor(Math.random() * 5000) + 1000,
      trend,
      percentageChange: Math.floor(Math.random() * 20) + 1
    };
  });
};

const HotBetCard = ({ hotBet, event }: { hotBet: HotBet; event?: Event }) => {
  const bettingSlip = useBettingSlip();
  
  if (!event) return null;
  
  const handleAddToBetSlip = () => {
    bettingSlip.addBet({
      id: `${event.id}-${hotBet.betType}-${hotBet.selection}`,
      eventId: event.id,
      sportIcon: event.sportId === 1 ? 'sports_soccer' : 
                event.sportId === 2 ? 'sports_basketball' : 
                event.sportId === 3 ? 'sports_tennis' : 
                'sports',
      league: event.league,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      betType: hotBet.betType,
      selection: hotBet.selection,
      odds: hotBet.odds,
    });
  };
  
  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons text-sm text-primary mr-2">
            {event.sportId === 1 ? 'sports_soccer' : 
             event.sportId === 2 ? 'sports_basketball' : 
             event.sportId === 3 ? 'sports_tennis' : 
             'sports'}
          </span>
          <span className="text-foreground text-sm">{event.league}</span>
        </div>
        <div className="flex items-center text-muted-foreground text-sm">
          {event.isLive ? (
            <>
              <span className="bg-destructive text-white text-xs px-1 rounded mr-2">LIVE</span>
              <span>{event.liveMinute}'</span>
            </>
          ) : (
            <span>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-condensed text-lg text-foreground mb-2">
          {event.homeTeam} vs {event.awayTeam}
        </h3>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm text-muted-foreground">{hotBet.betType}</div>
            <div className="font-medium">{hotBet.selection}</div>
          </div>
          <motion.button 
            className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg flex items-center space-x-2"
            onClick={handleAddToBetSlip}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-mono font-bold">{hotBet.odds.toFixed(2)}</span>
            <span className="material-icons text-sm">add</span>
          </motion.button>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <span className="material-icons-outlined text-lg mr-1 text-muted-foreground">group</span>
            <span>{hotBet.betCount} пользователей</span>
          </div>
          <div className={`flex items-center ${
            hotBet.trend === 'up' ? 'text-green-500' : 
            hotBet.trend === 'down' ? 'text-destructive' : 
            'text-muted-foreground'
          }`}>
            <span className="material-icons text-sm mr-1">
              {hotBet.trend === 'up' ? 'trending_up' : 
              hotBet.trend === 'down' ? 'trending_down' : 
              'trending_flat'}
            </span>
            <span>{hotBet.percentageChange}%</span>
          </div>
        </div>
        
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, hotBet.betCount / 2)}%` }}></div>
        </div>
      </div>
    </motion.div>
  );
};

const HotBets = () => {
  const [hotBets, setHotBets] = useState<HotBet[]>([]);
  
  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  // Гeнерация hot bets на основе событий
  useEffect(() => {
    if (events) {
      setHotBets(generateHotBets(events));
    }
  }, [events]);
  
  if (loadingEvents) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-condensed font-bold text-lighttext flex items-center mb-4">
          <span className="material-icons text-md mr-2 text-amber-500">local_fire_department</span>
          Горячие ставки
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-lg overflow-hidden border border-border">
              <div className="bg-card-muted px-4 py-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="p-4">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-6 w-1/2 mb-3" />
                <div className="flex justify-between items-center mb-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (hotBets.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-condensed font-bold text-lighttext flex items-center mb-4">
        <span className="material-icons text-md mr-2 text-amber-500">local_fire_department</span>
        Горячие ставки
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotBets.map(hotBet => (
          <HotBetCard 
            key={hotBet.id} 
            hotBet={hotBet} 
            event={events?.find(e => e.id === hotBet.eventId)}
          />
        ))}
      </div>
    </div>
  );
};

export default HotBets;