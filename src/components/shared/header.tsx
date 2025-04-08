import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { useBettingSlip } from '@/hooks/use-betting-slip';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Header = () => {
  const [location] = useLocation();
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const bettingSlip = useBettingSlip();
  
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false,
    onError: () => null
  });
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/" className="text-primary font-condensed text-2xl font-bold flex items-center">
            <span className="material-icons-outlined mr-1">sports</span>
            BetSmart
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors py-2`}>
              Home
            </Link>
            <Link href="/sports" className={`${location === '/sports' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors py-2`}>
              Sports
            </Link>
            <Link href="/live" className={`${location === '/live' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors py-2 flex items-center`}>
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              Live
            </Link>
            <Link href="/promotions" className={`${location === '/promotions' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors py-2`}>
              Promotions
            </Link>
            <Link href="/predictions" className={`${location === '/predictions' ? 'text-primary' : 'text-muted-foreground'} hover:text-primary transition-colors py-2 flex items-center group relative`}>
              <div className="inline-block font-mono text-xs py-1 px-1.5 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 text-white rounded mr-1">AI</div>
              Predictions
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />
        
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground flex items-center">
                <span className="material-icons text-sm mr-1">language</span>
                {language === 'en' ? 'EN' : 'RU'}
                <span className="material-icons text-sm">arrow_drop_down</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ru')}>
                Русский
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Search */}
          <button className="text-muted-foreground hover:text-foreground">
            <span className="material-icons">search</span>
          </button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-muted-foreground hover:text-foreground p-1 rounded-full border border-border">
                <span className="material-icons">account_circle</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-muted-foreground text-sm">Balance: €{user.balance.toFixed(2)}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="w-full">
                      Bet History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/deposit" className="text-primary w-full">
                      Deposit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full">
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="text-primary w-full">
                      Register
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Bet Slip Toggle */}
          <button 
            className="relative bg-primary text-white p-1 rounded-full"
            onClick={() => bettingSlip.toggleOpen()}
          >
            <span className="material-icons">receipt</span>
            {bettingSlip.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {bettingSlip.items.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
