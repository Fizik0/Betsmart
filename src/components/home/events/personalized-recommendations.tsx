import { useQuery } from "@tanstack/react-query";
import { getPersonalizedRecommendations, getEvents } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recommendation, Event } from "@/lib/types";
import { AlertCircle, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBettingSlip } from "@/hooks/use-betting-slip";

export function PersonalizedRecommendations() {
  const { addBet } = useBettingSlip();

  const { data: recommendations, isLoading: isLoadingRecs, isError: isRecsError } = useQuery({
    queryKey: ["personalizedRecommendations"],
    queryFn: getPersonalizedRecommendations,
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
  });

  // Объединяем рекомендации с информацией о событиях
  const recommendationsWithEvents = recommendations?.map(rec => {
    const event = events?.find(e => e.id === rec.eventId);
    return { ...rec, event };
  }) || [];

  const handleAddBet = (rec: Recommendation, event?: Event) => {
    if (!event) return;
    
    addBet({
      id: `${rec.eventId}-${rec.betType}-${rec.selection}`,
      eventId: rec.eventId,
      sportIcon: "⚽️", // Используем фиксированную иконку, можно заменить на динамическую
      league: event.league,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      betType: rec.betType,
      selection: rec.selection,
      odds: event.odds?.[rec.selection] || 1.5, // Используем коэффициент из события, или запасной
    });
  };

  if (isLoadingRecs || isLoadingEvents) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Загрузка персональных рекомендаций</CardTitle>
          <CardDescription className="text-center">
            Наш ИИ анализирует вашу историю ставок для создания персонализированных рекомендаций
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="h-12 w-12 text-primary/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRecsError || !recommendations) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500 text-center">Рекомендации временно недоступны</CardTitle>
          <CardDescription className="text-center">
            К сожалению, наш ИИ-аналитик временно не может предоставить персонализированные рекомендации.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <AlertCircle className="h-16 w-16 text-red-500/70 mb-3" />
          <p className="text-sm text-center text-muted-foreground max-w-md">
            Возможные причины: высокая загрузка серверов, технические работы или исчерпан лимит API.
            Пожалуйста, попробуйте позже.
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recommendationsWithEvents.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Рекомендации недоступны</CardTitle>
          <CardDescription className="text-center">
            Сделайте несколько ставок, чтобы мы могли создать персонализированные рекомендации
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/70" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">
          <span className="bg-gradient-to-r from-pink-600 to-violet-600 bg-clip-text text-transparent font-bold">
            Персональные рекомендации GPT-4.5
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Разработано с помощью продвинутого GPT-4.5 Turbo на основе вашей истории ставок
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendationsWithEvents.map((rec) => (
            <RecommendationCard 
              key={rec.id} 
              recommendation={rec} 
              onAddToBetslip={() => handleAddBet(rec, rec.event)} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation & { event?: Event };
  onAddToBetslip: () => void;
}

function RecommendationCard({ recommendation, onAddToBetslip }: RecommendationCardProps) {
  const { event, betType, selection, confidence, reasoning, isTrending, isValueBet } = recommendation;
  
  if (!event) return null;
  
  const odds = event.odds?.[selection] || 1.5; // Запасное значение, если коэффициент не найден
  
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 relative">
      <div className="absolute top-3 right-3 flex space-x-1">
        {isTrending && (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800">
            Популярно
          </Badge>
        )}
        {isValueBet && (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
            Ценная ставка
          </Badge>
        )}
      </div>
      
      <div className="flex items-center mb-3">
        <div>
          <h3 className="font-medium text-sm">{event.league}</h3>
          <p className="text-muted-foreground text-xs">{new Date(event.startTime).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="font-semibold">{event.homeTeam} vs {event.awayTeam}</h3>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium">{betType}</p>
          <p className="text-xs text-muted-foreground">{selection}</p>
        </div>
        <Badge className={cn(
          "text-lg px-3 py-1",
          isValueBet ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
        )}>
          {odds.toFixed(2)}
        </Badge>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        <p>{reasoning}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs">Уверенность:</span>
          <div className="w-20 h-2 bg-gray-200 rounded-full mx-1">
            <div 
              className={cn(
                "h-full rounded-full",
                confidence > 0.8 ? "bg-green-600" :
                confidence > 0.6 ? "bg-yellow-500" : 
                "bg-orange-500"
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-xs">{Math.round(confidence * 100)}%</span>
        </div>
        
        <Button size="sm" onClick={onAddToBetslip}>
          В купон
        </Button>
      </div>
    </div>
  );
}