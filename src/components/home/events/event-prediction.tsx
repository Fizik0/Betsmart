import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEventPrediction } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowUpRight, CheckCircle, Zap } from "lucide-react";
import { BestBet, EventPrediction } from "@/lib/types";
import { useBettingSlip } from "@/hooks/use-betting-slip";
import { cn } from "@/lib/utils";

interface EventPredictionCardProps {
  eventId: number;
  homeTeam: string;
  awayTeam: string;
}

export function EventPredictionCard({ eventId, homeTeam, awayTeam }: EventPredictionCardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { addBet } = useBettingSlip();

  const { data: prediction, isLoading, isError } = useQuery({
    queryKey: ["eventPrediction", eventId],
    queryFn: () => getEventPrediction(eventId),
  });

  const handleAddBet = (bet: BestBet) => {
    addBet({
      id: `${eventId}-${bet.type}-${bet.selection}`,
      eventId,
      sportIcon: "⚽️", // Используем фиксированную иконку
      league: "AI Recommendation",
      eventName: `${homeTeam} vs ${awayTeam}`,
      betType: bet.type,
      selection: bet.selection,
      odds: bet.odds,
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Генерация прогноза...</CardTitle>
          <CardDescription className="text-center">
            Наш ИИ анализирует данные для создания детального прогноза
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="h-32 w-32 animate-pulse rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="h-16 w-16 text-primary/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !prediction) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500 text-center">Прогноз временно недоступен</CardTitle>
          <CardDescription className="text-center">
            К сожалению, наш ИИ-аналитик временно недоступен. Пожалуйста, попробуйте позже.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <AlertCircle className="h-20 w-20 text-red-500/70 mb-4" />
          <p className="text-sm text-center text-muted-foreground max-w-md">
            Возможные причины: высокая загрузка серверов, технические работы или исчерпан лимит запросов API.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl text-center">
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent font-bold">
            ИИ-аналитика матча GPT-4.5
          </span>
        </CardTitle>
        <CardDescription className="text-center text-base">
          Детальный анализ от нашего продвинутого GPT-4.5 Turbo ИИ
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overview" className="flex-1">Обзор</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">Анализ</TabsTrigger>
            <TabsTrigger value="bets" className="flex-1">Лучшие ставки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard 
                title="Прогноз счета" 
                homeTeam={homeTeam} 
                awayTeam={awayTeam} 
                homeScore={prediction.predictedScore.home} 
                awayScore={prediction.predictedScore.away} 
              />
              
              <div className="flex flex-col space-y-4 md:col-span-2">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-sm font-medium">Вероятности исхода</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <ProbabilityCard 
                      title={homeTeam} 
                      value={prediction.homeWinProbability * 100} 
                      type="home" 
                    />
                    <ProbabilityCard 
                      title="Ничья" 
                      value={prediction.drawProbability * 100} 
                      type="draw" 
                    />
                    <ProbabilityCard 
                      title={awayTeam} 
                      value={prediction.awayWinProbability * 100} 
                      type="away" 
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Ключевые факторы</h3>
                  <ul className="space-y-2">
                    {prediction.keyFactors.map((factor, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            <div className="prose max-w-full dark:prose-invert">
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {prediction.analysis}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="bets">
            <div className="space-y-4">
              <h3 className="text-base font-medium">Рекомендуемые ставки</h3>
              <div className="grid grid-cols-1 gap-3">
                {prediction.bestBets.map((bet, index) => (
                  <BestBetCard 
                    key={index} 
                    bet={bet} 
                    onAddToBetslip={() => handleAddBet(bet)} 
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ScoreCardProps {
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

function ScoreCard({ title, homeTeam, awayTeam, homeScore, awayScore }: ScoreCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-xs text-muted-foreground mb-1 truncate">{homeTeam}</div>
          <div className="text-3xl font-bold">{homeScore}</div>
        </div>
        <div className="text-xl font-bold text-muted-foreground">:</div>
        <div className="text-center flex-1">
          <div className="text-xs text-muted-foreground mb-1 truncate">{awayTeam}</div>
          <div className="text-3xl font-bold">{awayScore}</div>
        </div>
      </div>
    </div>
  );
}

interface ProbabilityCardProps {
  title: string;
  value: number;
  type: 'home' | 'draw' | 'away';
}

function ProbabilityCard({ title, value, type }: ProbabilityCardProps) {
  const colors = {
    home: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    draw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    away: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  
  const progressColors = {
    home: 'bg-blue-600',
    draw: 'bg-gray-600',
    away: 'bg-purple-600',
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-2">
      <div className="text-xs font-medium text-center mb-1 truncate">{title}</div>
      <div className="text-xl font-bold text-center mb-1">{Math.round(value)}%</div>
      <Progress value={value} className={cn("h-2", progressColors[type])} />
    </div>
  );
}

interface BestBetCardProps {
  bet: BestBet;
  onAddToBetslip: () => void;
}

function BestBetCard({ bet, onAddToBetslip }: BestBetCardProps) {
  return (
    <div className="flex flex-col space-y-2 p-3 rounded-lg border">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{bet.type}</h4>
          <p className="text-sm">{bet.selection}</p>
        </div>
        <Badge variant={bet.valueRating > 7 ? "destructive" : "secondary"} className="ml-2">
          {bet.odds.toFixed(2)}
        </Badge>
      </div>
      
      <Separator />
      
      <div className="text-xs text-muted-foreground">
        {bet.explanation}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center">
          <span className="text-xs mr-1">Уверенность:</span>
          <Progress value={bet.confidence * 100} className="w-16 h-2" />
          <span className="text-xs ml-1">{Math.round(bet.confidence * 100)}%</span>
        </div>
        
        <Button size="sm" onClick={onAddToBetslip} className="ml-auto">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          В купон
        </Button>
      </div>
    </div>
  );
}