import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { 
  LucideHome, 
  LucideActivity, 
  LucideTicket, 
  LucideUser, 
  LucideMenu, 
  LucideX,
  LucideVideo,
  LucideSettings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  const menuItems: MenuItem[] = [
    { icon: <LucideHome className="w-5 h-5" />, label: 'Главная', path: '/' },
    { icon: <LucideActivity className="w-5 h-5" />, label: 'Спорт', path: '/sports' },
    { icon: <LucideVideo className="w-5 h-5" />, label: 'Прямая трансляция', path: '/live' },
    { icon: <LucideTicket className="w-5 h-5" />, label: 'История ставок', path: '/bets' },
    { icon: <LucideUser className="w-5 h-5" />, label: 'Профиль', path: '/profile' },
    { icon: <LucideSettings className="w-5 h-5" />, label: 'Настройки', path: '/settings' },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  
  const menuVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };
  
  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <>
      {/* Mobile menu toggle button */}
      <button 
        onClick={toggleMenu} 
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <LucideX className="w-6 h-6" />
        ) : (
          <LucideMenu className="w-6 h-6" />
        )}
      </button>
      
      {/* Slide-out menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
              onClick={toggleMenu}
            />
            
            {/* Menu panel */}
            <motion.div 
              className="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-card shadow-xl z-50 md:hidden"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
            >
              <div className="flex flex-col h-full">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-pink-600 text-transparent bg-clip-text">
                    Спортивные ставки
                  </h2>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-3">
                  <ul className="space-y-1">
                    {menuItems.map((item, i) => (
                      <motion.li 
                        key={item.path}
                        custom={i}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link href={item.path}>
                          <a onClick={toggleMenu}>
                            <div 
                              className={cn(
                                "flex items-center p-3 rounded-lg transition-colors",
                                location === item.path 
                                  ? "bg-primary/10 text-primary" 
                                  : "hover:bg-muted"
                              )}
                            >
                              {item.icon}
                              <span className="ml-3">{item.label}</span>
                            </div>
                          </a>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <LucideUser className="w-4 h-4 text-primary" />
                      </div>
                      <span className="ml-2 font-medium">Гость</span>
                    </div>
                    <button 
                      onClick={toggleMenu}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <LucideX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Fixed bottom navigation for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-30 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {menuItems.slice(0, 5).map((item) => (
            <Link key={item.path} href={item.path}>
              <a className="flex flex-col items-center justify-center h-full">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center",
                    location === item.path 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}