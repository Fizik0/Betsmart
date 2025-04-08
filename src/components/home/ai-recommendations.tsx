import { useBettingSlip } from '@/hooks/use-betting-slip';
import { useQuery } from '@tanstack/react-query';
import { Recommendation, Event } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const AIRecommendationCard = ({ recommendation }: { recommendation: Recommendation & { event?: Event } }) => {
  const bettingSlip = useBettingSlip();
  
  const handleAddToBetSlip = () => {
    if (!recommendation.event) return;
    
    bettingSlip.addBet({
      id: `rec-${recommendation.id}-${recommendation.betType}-${recommendation.selection}`,
      eventId: recommendation.eventId,
      sportIcon: recommendation.event.sportId === 1 ? 'sports_soccer' : 
                recommendation.event.sportId === 2 ? 'sports_basketball' : 
                recommendation.event.sportId === 3 ? 'sports_tennis' : 
                'sports',
      league: recommendation.event.league,
      eventName: `${recommendation.event.homeTeam} vs ${recommendation.event.awayTeam}`,
      betType: recommendation.betType,
      selection: recommendation.selection,
      odds: recommendation.event.odds[recommendation.selection.toLowerCase() as keyof typeof recommendation.event.odds] || 1.9,
    });
  };
  
  const confidencePercentage = Math.round(recommendation.confidence * 100);
  const isHighConfidence = confidencePercentage >= 80;
  const isMediumConfidence = confidencePercentage >= 70 && confidencePercentage < 80;
  
  return (
    <div className={`bg-darkbg2 border border-darkaccent rounded-lg p-4 ${isHighConfidence ? 'animate-pulse-win' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-medium bg-darkaccent text-mutedtext px-2 py-1 rounded">
            {recommendation.event?.sportId === 1 ? 'SOCCER' : 
             recommendation.event?.sportId === 2 ? 'BASKETBALL' : 
             recommendation.event?.sportId === 3 ? 'TENNIS' : 
             'SPORTS'}
          </span>
          {recommendation.isTrending && (
            <span className="text-xs font-medium bg-green-800 text-white px-2 py-1 rounded ml-1">TRENDING</span>
          )}
          {recommendation.isValueBet && (
            <span className="text-xs font-medium bg-blue-800 text-white px-2 py-1 rounded ml-1">VALUE BET</span>
          )}
        </div>
        <span className={`${
          isHighConfidence ? 'text-[#0f9d58]' : 
          isMediumConfidence ? 'text-[#f39c12]' : 
          'text-mutedtext'
        } font-mono`}>
          {confidencePercentage}%
        </span>
      </div>
      
      <h3 className="font-condensed font-bold text-lighttext mb-1">{recommendation.selection}</h3>
      <p className="text-mutedtext text-sm mb-3">
        {recommendation.event ? `${recommendation.event.homeTeam} vs ${recommendation.event.awayTeam}` : 'Loading...'}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs text-mutedtext">AI confidence</span>
          <div className="w-24 h-2 bg-darkaccent rounded-full ml-2">
            <div 
              className={`${
                isHighConfidence ? 'bg-[#0f9d58]' : 
                isMediumConfidence ? 'bg-[#f39c12]' : 
                'bg-muted'
              } h-2 rounded-full`} 
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
        </div>
        
        <Button 
          className="bg-primary text-white py-1 px-3 rounded text-sm"
          onClick={handleAddToBetSlip}
          disabled={!recommendation.event}
        >
          Add to Slip
        </Button>
      </div>
    </div>
  );
};

const AIRecommendations = () => {
  const { data: recommendations, isLoading: loadingRecs } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations'],
  });
  
  const { data: events, isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  const isLoading = loadingRecs || loadingEvents;
  
  // Combine recommendations with their events
  const recommendationsWithEvents = recommendations?.map(rec => ({
    ...rec,
    event: events?.find(event => event.id === rec.eventId)
  })) || [];
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-condensed font-bold text-lighttext flex items-center">
          <div className="inline-block font-mono text-xs py-1 px-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded mr-2">GPT-4.5</div>
          Personalized Recommendations
        </h2>
        <button className="text-mutedtext hover:text-primary flex items-center text-sm">
          <span className="material-icons text-sm mr-1">info</span>
          How it works
        </button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-darkbg2 border border-darkaccent rounded-lg p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-40 mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-24 ml-2" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendationsWithEvents.map(recommendation => (
            <AIRecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
