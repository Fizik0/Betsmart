import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsType, Event } from '@shared/schema';
import { cn } from '@/lib/utils';

interface MatchStatsProps {
  event?: Event;
  stats?: StatsType;
  isLoading?: boolean;
  className?: string;
}

const StatBar: React.FC<{ 
  name: string; 
  homeValue: number; 
  awayValue: number; 
  homeLabel?: string;
  awayLabel?: string;
}> = ({ name, homeValue, awayValue, homeLabel, awayLabel }) => {
  const total = homeValue + awayValue;
  const homePercent = total === 0 ? 50 : Math.round((homeValue / total) * 100);
  const awayPercent = total === 0 ? 50 : 100 - homePercent;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{homeLabel || homeValue}</span>
        <span className="text-muted-foreground">{name}</span>
        <span className="font-medium">{awayLabel || awayValue}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[45%]">
          <Progress value={homePercent} className="h-2 bg-muted" />
        </div>
        <div className="w-[10%] flex justify-center">
          <span className="text-xs text-muted-foreground">vs</span>
        </div>
        <div className="w-[45%]">
          <Progress value={awayPercent} className="h-2 bg-muted" />
        </div>
      </div>
    </div>
  );
};

const MatchStats: React.FC<MatchStatsProps> = ({ 
  event, 
  stats, 
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!stats || !event) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Match Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No statistics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { possession, shots, shotsOnTarget, corners, fouls, yellowCards, redCards } = stats;
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Match Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm font-semibold mb-2">
          <div>{event.homeTeam}</div>
          <div>{event.awayTeam}</div>
        </div>
        
        {possession && (
          <StatBar 
            name="Possession" 
            homeValue={possession.home} 
            awayValue={possession.away} 
            homeLabel={`${possession.home}%`}
            awayLabel={`${possession.away}%`}
          />
        )}
        
        {shots && (
          <StatBar 
            name="Shots" 
            homeValue={shots.home} 
            awayValue={shots.away} 
          />
        )}
        
        {shotsOnTarget && (
          <StatBar 
            name="Shots on Target" 
            homeValue={shotsOnTarget.home} 
            awayValue={shotsOnTarget.away} 
          />
        )}
        
        {corners && (
          <StatBar 
            name="Corners" 
            homeValue={corners.home} 
            awayValue={corners.away} 
          />
        )}
        
        {fouls && (
          <StatBar 
            name="Fouls" 
            homeValue={fouls.home} 
            awayValue={fouls.away} 
          />
        )}
        
        {yellowCards && (
          <StatBar 
            name="Yellow Cards" 
            homeValue={yellowCards.home} 
            awayValue={yellowCards.away} 
          />
        )}
        
        {redCards && (
          <StatBar 
            name="Red Cards" 
            homeValue={redCards.home} 
            awayValue={redCards.away} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MatchStats;