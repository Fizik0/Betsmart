import React from 'react';
import { Event } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { LucideActivity, LucideCalendar, LucideAlarmClock, LucideAward, LucideFlag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useBettingSlip } from '@/hooks/use-betting-slip';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCardModern({ event, className }: EventCardProps) {
  const { addBet } = useBettingSlip();
  
  const handleAddBet = (selection: string, odds: number) => {
    if (odds) {
      addBet({
        id: `${event.id}-${selection}`,
        eventId: event.id,
        sportIcon: "sports",
        league: event.league,
        eventName: `${event.homeTeam} vs ${event.awayTeam}`,
        betType: "Match Result",
        selection,
        odds
      });
    }
  };

  // Format date
  const formattedDate = new Date(event.startTime).toLocaleDateString(
    'ru-RU', 
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
  
  // Card animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { y: -5, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.div
      className={cn("", className)}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
    >
      <Card className="overflow-hidden h-full bg-card/50 backdrop-blur-sm border-primary/10 relative">
        {/* Status indicator */}
        {event.isLive && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        )}
        
        <CardContent className="p-5">
          {/* Header with league and status */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Badge variant="outline" className="font-medium">
                {event.league}
              </Badge>
            </div>
            
            {event.isLive ? (
              <div className="flex items-center text-red-500 animate-pulse">
                <LucideActivity className="w-4 h-4 mr-1" />
                <span className="text-sm font-semibold">Лайв</span>
                {event.liveMinute && (
                  <span className="ml-1 text-xs text-primary">{event.liveMinute}'</span>
                )}
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <LucideCalendar className="w-4 h-4 mr-1" />
                <span className="text-sm">{formattedDate}</span>
              </div>
            )}
          </div>
          
          {/* Teams and scores */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.homeTeam}</h3>
              </div>
              
              {event.isLive && (
                <div className="flex items-center px-3">
                  <span className="text-xl font-bold mx-1">{event.homeScore}</span>
                  <span className="text-xl font-bold mx-1">-</span>
                  <span className="text-xl font-bold mx-1">{event.awayScore}</span>
                </div>
              )}
              
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg">{event.awayTeam}</h3>
              </div>
            </div>
            
            {event.popular && (
              <div className="flex items-center justify-center text-orange-500 my-1">
                <LucideAward className="w-4 h-4 mr-1" />
                <span className="text-xs">Популярный матч</span>
              </div>
            )}
          </div>
          
          {/* Betting odds */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <GradientButton
              variant="betting"
              size="sm"
              onClick={() => handleAddBet(event.homeTeam, event.odds.homeWin!)}
              className="w-full"
              glow={true}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs">П1</span>
                <span className="font-bold">{event.odds.homeWin?.toFixed(2)}</span>
              </div>
            </GradientButton>
            
            {event.odds.draw ? (
              <GradientButton
                variant="betting"
                size="sm"
                onClick={() => handleAddBet("Draw", event.odds.draw)}
                className="w-full"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs">X</span>
                  <span className="font-bold">{event.odds.draw.toFixed(2)}</span>
                </div>
              </GradientButton>
            ) : (
              <div></div>
            )}
            
            <GradientButton
              variant="betting"
              size="sm"
              onClick={() => handleAddBet(event.awayTeam, event.odds.awayWin!)}
              className="w-full"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs">П2</span>
                <span className="font-bold">{event.odds.awayWin?.toFixed(2)}</span>
              </div>
            </GradientButton>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
            {event.hasLiveStream ? (
              <div className="flex items-center text-emerald-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                <span>Трансляция доступна</span>
              </div>
            ) : (
              <div></div>
            )}
            
            <Link href={`/events/${event.id}`}>
              <a className="text-primary hover:underline transition-all">
                Больше коэффициентов
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}