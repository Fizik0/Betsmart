import { useBettingSlip, calculateTotalOdds, calculatePotentialWin } from '@/hooks/use-betting-slip';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';

const BettingSlip = () => {
  const bettingSlip = useBettingSlip();
  const { toast } = useToast();
  
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false,
    onError: () => null
  });
  
  const totalOdds = calculateTotalOdds(bettingSlip.items, bettingSlip.betType);
  const potentialWin = calculatePotentialWin(bettingSlip.items, bettingSlip.stake, bettingSlip.betType);
  
  const handlePlaceBet = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to place a bet",
        variant: "destructive",
      });
      return;
    }
    
    if (bettingSlip.items.length === 0) {
      toast({
        title: "No bets selected",
        description: "Please select at least one bet",
        variant: "destructive",
      });
      return;
    }
    
    if (bettingSlip.stake <= 0) {
      toast({
        title: "Invalid stake",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }
    
    if (user.balance < bettingSlip.stake) {
      toast({
        title: "Insufficient balance",
        description: "Please deposit funds to place this bet",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // For demo purposes, we'll just place the first bet
      const bet = bettingSlip.items[0];
      
      await apiRequest("POST", "/api/bets", {
        userId: user.id,
        eventId: bet.eventId,
        betType: bet.betType,
        selection: bet.selection,
        odds: bet.odds,
        stake: bettingSlip.stake,
      });
      
      toast({
        title: "Bet placed successfully",
        description: "Your bet has been placed",
        variant: "default",
      });
      
      bettingSlip.clearBets();
    } catch (error) {
      toast({
        title: "Failed to place bet",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  if (!bettingSlip.isOpen) {
    return null;
  }
  
  return (
    <div className="hidden md:block w-80 border-l border-darkaccent bg-darkbg2 overflow-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-condensed font-bold text-lighttext">Bet Slip</h2>
          {bettingSlip.items.length > 0 && (
            <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {bettingSlip.items.length}
            </span>
          )}
        </div>
        
        {bettingSlip.items.length > 0 ? (
          <div className="space-y-3 mb-4">
            {bettingSlip.items.map((item) => (
              <div key={item.id} className="bg-darkbg rounded-lg p-3 relative">
                <button 
                  className="absolute top-2 right-2 text-mutedtext hover:text-destructive"
                  onClick={() => bettingSlip.removeBet(item.id)}
                >
                  <span className="material-icons text-sm">close</span>
                </button>
                <div className="flex items-center mb-1">
                  <span className="material-icons text-mutedtext text-sm mr-1">{item.sportIcon}</span>
                  <span className="text-mutedtext text-xs">{item.league}</span>
                </div>
                <h3 className="font-condensed text-lighttext text-base">{item.eventName}</h3>
                <p className="text-mutedtext text-xs mb-2">{item.betType}</p>
                <div className="flex justify-between items-center">
                  <span className="bg-darkaccent text-lighttext text-sm px-2 py-1 rounded">{item.selection}</span>
                  <span className="font-mono text-lighttext">{item.odds.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-darkbg rounded-lg p-4 text-center mb-4">
            <span className="material-icons text-mutedtext text-3xl mb-2">receipt_long</span>
            <p className="text-mutedtext">Your bet slip is empty</p>
            <p className="text-xs text-mutedtext mt-2">Add selections to place bets</p>
          </div>
        )}
        
        <div className="bg-darkbg rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-mutedtext">Type</span>
            <Select
              value={bettingSlip.betType}
              onValueChange={(value) => bettingSlip.setBetType(value as any)}
            >
              <SelectTrigger className="w-24 h-7 bg-darkaccent text-lighttext text-sm border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-darkaccent text-lighttext border-darkbg">
                <SelectItem value="single">Singles</SelectItem>
                <SelectItem value="parlay">Parlay</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-mutedtext">Total Odds</span>
            <span className="font-mono text-lighttext font-medium">{totalOdds.toFixed(2)}</span>
          </div>
          
          <div className="mb-3">
            <label className="text-mutedtext text-sm mb-1 block">Stake</label>
            <div className="flex">
              <Input
                type="number"
                min="1"
                value={bettingSlip.stake}
                onChange={(e) => bettingSlip.setStake(parseFloat(e.target.value) || 0)}
                className="bg-darkaccent text-lighttext rounded-l py-2 px-3 w-full focus:outline-none focus:ring-1 focus:ring-primary border-none"
              />
              <span className="bg-darkaccent text-mutedtext py-2 px-2 rounded-r border-l border-darkbg">€</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-mutedtext">Potential Winnings</span>
            <span className="font-mono text-[#0f9d58] font-medium">€{potentialWin.toFixed(2)}</span>
          </div>
        </div>
        
        <Button
          className="w-full bg-primary hover:bg-opacity-90 text-white py-6 rounded font-medium"
          onClick={handlePlaceBet}
          disabled={bettingSlip.items.length === 0}
        >
          Place Bet
        </Button>
      </div>
    </div>
  );
};

export default BettingSlip;
