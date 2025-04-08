import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BetItem = {
  id: string;
  eventId: number;
  sportIcon: string;
  league: string;
  eventName: string;
  betType: string;
  selection: string;
  odds: number;
};

export type BetSlipType = 'single' | 'parlay' | 'system';

type BettingSlipState = {
  items: BetItem[];
  stake: number;
  betType: BetSlipType;
  isOpen: boolean;
  isMobileOpen: boolean;
  addBet: (bet: BetItem) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;
  setBetType: (type: BetSlipType) => void;
  setStake: (stake: number) => void;
  toggleOpen: () => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (isOpen: boolean) => void;
};

export const useBettingSlip = create<BettingSlipState>()(
  persist(
    (set) => ({
      items: [],
      stake: 10,
      betType: 'parlay',
      isOpen: false,
      isMobileOpen: false,
      
      addBet: (bet) => set((state) => {
        // Check if the bet already exists
        const exists = state.items.some(item => item.id === bet.id);
        if (exists) return state;
        
        return { items: [...state.items, bet] };
      }),
      
      removeBet: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      
      clearBets: () => set({ items: [] }),
      
      setBetType: (betType) => set({ betType }),
      
      setStake: (stake) => set({ stake }),
      
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      
      setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),
    }),
    {
      name: 'betting-slip-storage',
    }
  )
);

export const calculateTotalOdds = (items: BetItem[], betType: BetSlipType): number => {
  if (items.length === 0) return 0;
  
  if (betType === 'single') {
    return items[0].odds;
  }
  
  if (betType === 'parlay') {
    return items.reduce((acc, item) => acc * item.odds, 1);
  }
  
  // Simple system calculation (for demo purposes)
  if (betType === 'system') {
    return items.reduce((acc, item) => acc + item.odds, 0) / items.length;
  }
  
  return 0;
};

export const calculatePotentialWin = (items: BetItem[], stake: number, betType: BetSlipType): number => {
  const totalOdds = calculateTotalOdds(items, betType);
  return totalOdds * stake;
};
