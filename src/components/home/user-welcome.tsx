import { useQuery } from '@tanstack/react-query';
import { User, Bet } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Анимированный компонент для личной статистики пользователя
const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  delta 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  trend: 'up' | 'down' | 'neutral'; 
  delta: string;
}) => {
  return (
    <motion.div 
      className="bg-card p-4 rounded-lg shadow-sm border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-muted-foreground text-sm">{title}</span>
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-mono font-bold">{value}</span>
        <div className={`ml-2 flex items-center text-xs 
          ${trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-destructive' : 
            'text-muted-foreground'}`}>
          <span className="material-icons text-xs mr-0.5">
            {trend === 'up' ? 'trending_up' : 
             trend === 'down' ? 'trending_down' : 
             'trending_flat'}
          </span>
          {delta}
        </div>
      </div>
    </motion.div>
  );
};

// Список последних ставок пользователя с анимацией
const RecentBets = ({ bets }: { bets: Bet[] }) => {
  if (bets.length === 0) {
    return (
      <div className="text-center p-4">
        <span className="text-muted-foreground">Нет последних ставок</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet, index) => (
        <motion.div 
          key={bet.id}
          className={`p-3 rounded-lg ${
            bet.status === 'won' ? 'bg-green-500/10 border border-green-500/20' :
            bet.status === 'lost' ? 'bg-destructive/10 border border-destructive/20' :
            'bg-card border border-border'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-sm mb-1">{bet.betType}: {bet.selection}</div>
              <div className="text-xs text-muted-foreground">{new Date(bet.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className={`font-mono font-bold ${
                bet.status === 'won' ? 'text-green-500' :
                bet.status === 'lost' ? 'text-destructive' :
                'text-foreground'
              }`}>
                {bet.status === 'won' ? '+' : bet.status === 'lost' ? '-' : ''}€{bet.status === 'won' ? bet.potentialWin.toFixed(2) : bet.stake.toFixed(2)}
              </div>
              <div className="text-xs">
                {bet.status === 'pending' ? (
                  <span className="inline-flex items-center bg-amber-500/20 text-amber-500 px-1.5 rounded">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    В процессе
                  </span>
                ) : bet.status === 'won' ? (
                  <span className="inline-flex items-center bg-green-500/20 text-green-500 px-1.5 rounded">
                    Выигрыш
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-destructive/20 text-destructive px-1.5 rounded">
                    Проигрыш
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Компонент уведомлений для пользователя
const UserNotifications = ({ count = 2 }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Примеры уведомлений для демонстрации
  const notifications = [
    {
      id: 1,
      type: 'reminder',
      title: 'Приближается матч',
      message: 'Матч "Реал Мадрид vs Барселона" начнется через 30 минут.',
      time: new Date(Date.now() - 25 * 60000),
      icon: 'notifications'
    },
    {
      id: 2,
      type: 'promo',
      title: 'Эксклюзивный бонус!',
      message: 'Получите бонус 100% на следующий депозит до €50.',
      time: new Date(Date.now() - 3 * 3600000),
      icon: 'redeem'
    }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-full hover:bg-card-muted transition-colors"
      >
        <span className="material-icons">notifications</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-border">
              <div className="font-medium">Уведомления</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notification => (
                <div key={notification.id} className="p-3 border-b border-border hover:bg-card-secondary cursor-pointer">
                  <div className="flex">
                    <div className={`${
                      notification.type === 'promo' ? 'bg-primary/20 text-primary' :
                      notification.type === 'reminder' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-card-muted text-muted-foreground'
                    } rounded-full p-2 mr-3`}>
                      <span className="material-icons text-sm">{notification.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        {notification.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border text-center">
              <Button variant="link" className="text-xs text-primary w-full">Просмотреть все</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Основной компонент приветствия
const UserWelcome = () => {
  const { data: user, isLoading: loadingUser } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false
  });

  const { data: bets, isLoading: loadingBets } = useQuery<Bet[]>({
    queryKey: ['/api/bets'],
    enabled: !!user
  });

  const isLoading = loadingUser || loadingBets;
  const recentBets = bets?.slice(0, 5) || [];
  
  // Расчет статистики пользователя
  const totalBets = bets?.length || 0;
  const wonBets = bets?.filter(bet => bet.status === 'won').length || 0;
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
  
  // Расчет прибыли
  const profit = bets?.reduce((total, bet) => {
    if (bet.status === 'won') return total + bet.potentialWin - bet.stake;
    if (bet.status === 'lost') return total - bet.stake;
    return total;
  }, 0) || 0;

  if (!user && !isLoading) {
    return null; // Не показывать компонент для неавторизованных пользователей
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-card-muted to-card rounded-lg p-6 shadow-md border border-border">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-7 w-60 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  {/* Приветствие зависит от времени суток */}
                  {new Date().getHours() < 12 ? 'Доброе утро' : 
                   new Date().getHours() < 17 ? 'Добрый день' : 
                   'Добрый вечер'}, {user?.username}!
                </h2>
                <p className="text-muted-foreground">
                  Вот ваша личная статистика и рекомендации на сегодня
                </p>
              </div>
              <UserNotifications />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatsCard 
                title="Винрейт" 
                value={`${winRate.toFixed(1)}%`} 
                icon="pie_chart" 
                trend={winRate > 55 ? 'up' : winRate < 45 ? 'down' : 'neutral'}
                delta={`${(winRate - 50).toFixed(1)}%`}
              />

              <StatsCard 
                title="Прибыль" 
                value={`€${Math.abs(profit).toFixed(2)}`} 
                icon="euro_symbol" 
                trend={profit > 0 ? 'up' : profit < 0 ? 'down' : 'neutral'}
                delta={`${profit > 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}`}
              />

              <StatsCard 
                title="Ставок размещено" 
                value={totalBets.toString()} 
                icon="receipt_long" 
                trend="neutral"
                delta="Всего"
              />
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Последние ставки</h3>
                <Button variant="outline" size="sm">История ставок</Button>
              </div>
              <RecentBets bets={recentBets} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserWelcome;