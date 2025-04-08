import { Link, useLocation } from 'wouter';
import { useBettingSlip } from '@/hooks/use-betting-slip';

const MobileNavigation = () => {
  const [location] = useLocation();
  const bettingSlip = useBettingSlip();
  
  return (
    <nav className="md:hidden bg-darkbg2 border-t border-darkaccent fixed bottom-0 w-full z-40">
      <div className="flex justify-around items-center">
        <Link 
          href="/" 
          className={`py-3 px-4 ${location === '/' ? 'text-primary' : 'text-mutedtext'} hover:text-lighttext flex flex-col items-center`}
        >
          <span className="material-icons">home</span>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link
          href="/sports"
          className={`py-3 px-4 ${location === '/sports' ? 'text-primary' : 'text-mutedtext'} hover:text-lighttext flex flex-col items-center`}
        >
          <span className="material-icons">sports_soccer</span>
          <span className="text-xs mt-1">Sports</span>
        </Link>
        
        <Link
          href="/live"
          className={`py-3 px-4 ${location === '/live' ? 'text-primary' : 'text-mutedtext'} hover:text-lighttext flex flex-col items-center relative`}
        >
          <span className="absolute top-2 right-6 h-2 w-2 bg-destructive rounded-full"></span>
          <span className="material-icons">stream</span>
          <span className="text-xs mt-1">Live</span>
        </Link>
        
        <Link
          href="/predictions"
          className={`py-3 px-4 ${location === '/predictions' ? 'text-primary' : 'text-mutedtext'} hover:text-lighttext flex flex-col items-center relative`}
        >
          <span className="material-icons">psychology</span>
          <span className="text-xs mt-1">AI</span>
        </Link>
        
        <button
          onClick={() => bettingSlip.toggleMobileOpen()}
          className="py-3 px-4 text-mutedtext hover:text-lighttext flex flex-col items-center relative"
        >
          {bettingSlip.items.length > 0 && (
            <span className="absolute top-1 right-5 bg-destructive text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {bettingSlip.items.length}
            </span>
          )}
          <span className="material-icons">receipt</span>
          <span className="text-xs mt-1">Bet Slip</span>
        </button>
        
        <Link
          href="/profile"
          className={`py-3 px-4 ${location === '/profile' ? 'text-primary' : 'text-mutedtext'} hover:text-lighttext flex flex-col items-center`}
        >
          <span className="material-icons">account_circle</span>
          <span className="text-xs mt-1">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNavigation;
