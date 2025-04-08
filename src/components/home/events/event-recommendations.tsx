import { useQuery } from "@tanstack/react-query";
import { getEventRecommendations } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { cn } from "@/lib/utils";

interface EventRecommendationsProps {
  eventId: number;
  homeTeam: string;
  awayTeam: string;
  odds: Record<string, number>;
}

export function EventRecommendations({ eventId, homeTeam, awayTeam, odds }: EventRecommendationsProps) {
  const { addBet } = useBettingSlip();
  
  const { data: recommendations, isLoading, isError } = useQuery({
    queryKey: ["eventRecommendations", eventId],
    queryFn: () => getEventRecommendations(eventId),
  });

  const handleAddBet = (betType: string, selection: string) => {
    const betOdds = odds[selection] || 1.5;
    
    addBet({
      id: `${eventId}-${betType}-${selection}`,
      eventId,
      sportIcon: "⚽️", // Используем фиксированную иконку
      league: "AI Recommendation",
      eventName: `${homeTeam} vs ${awayTeam}`,
      betType,
      selection,
      odds: betOdds,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Загрузка рекомендаций...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader className="h-8 w-8 animate-spin text-primary/70" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Рекомендации временно недоступны</CardTitle>
          <CardDescription>
            Наш ИИ-аналитик в данный момент не может предоставить рекомендации
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-4">
          <AlertCircle className="h-10 w-10 text-red-500/70 mb-2" />
          <p className="text-xs text-center text-muted-foreground">
            Пожалуйста, попробуйте позже
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Рекомендации недоступны</CardTitle>
          <CardDescription>
            Для данного события пока нет рекомендаций от ИИ
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
          Рекомендации от GPT-4.5
        </CardTitle>
        <CardDescription>
          Точные рекомендации от GPT-4.5 Turbo для этого события
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((rec) => (
            <div key={rec.id} className="rounded-lg border p-3 relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-sm">{rec.betType}</h3>
                  <p className="text-xs text-muted-foreground">{rec.selection}</p>
                </div>
                <Badge className={cn(
                  rec.isValueBet ? "bg-green-600 hover:bg-green-700" : ""
                )}>
                  {odds[rec.selection]?.toFixed(2) || "N/A"}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {rec.reasoning}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs">Уверенность:</span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-1">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        rec.confidence > 0.8 ? "bg-green-600" :
                        rec.confidence > 0.6 ? "bg-yellow-500" : 
                        "bg-orange-500"
                      )}
                      style={{ width: `${rec.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{Math.round(rec.confidence * 100)}%</span>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAddBet(rec.betType, rec.selection)}
                >
                  В купон
                </Button>
              </div>
              
              {rec.isTrending && (
                <Badge 
                  variant="outline" 
                  className="absolute top-2 right-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-[10px]"
                >
                  Популярно
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}