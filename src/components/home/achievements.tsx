import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';

// Тип для достижений
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  completed: boolean;
  reward: string;
  category: 'beginner' | 'intermediate' | 'expert' | 'special';
};

// Пример достижений (в реальном приложении они должны приходить с сервера)
const mockAchievements: Achievement[] = [
  {
    id: 'first-bet',
    title: 'Первая ставка',
    description: 'Сделайте свою первую ставку',
    icon: 'sports',
    progress: 100,
    completed: true,
    reward: 'Бонус €5',
    category: 'beginner'
  },
  {
    id: 'winning-streak',
    title: 'Удачная серия',
    description: 'Выиграйте 3 ставки подряд',
    icon: 'bolt',
    progress: 66.7,
    completed: false,
    reward: 'Бонус €10',
    category: 'beginner'
  },
  {
    id: 'variety-bettor',
    title: 'Разносторонний игрок',
    description: 'Сделайте ставки на 5 разных видов спорта',
    icon: 'sports_volleyball',
    progress: 40,
    completed: false,
    reward: 'Бесплатная ставка €15',
    category: 'intermediate'
  },
  {
    id: 'loyal-player',
    title: 'Лояльный клиент',
    description: 'Сделайте ставки в течение 7 дней подряд',
    icon: 'calendar_month',
    progress: 28.6,
    completed: false,
    reward: 'VIP статус на 1 месяц',
    category: 'intermediate'
  },
  {
    id: 'high-roller',
    title: 'Хай-роллер',
    description: 'Поставьте суммарно более €1000',
    icon: 'euro_symbol',
    progress: 15,
    completed: false,
    reward: 'Кэшбэк 5%',
    category: 'expert'
  }
];

// Компонент для отображения одного достижения
const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  return (
    <motion.div 
      className={`rounded-lg border ${
        achievement.completed 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-border bg-card'
      } p-4 flex items-start gap-3 relative overflow-hidden`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {/* Значок достижения */}
      <div className={`rounded-full p-3 ${
        achievement.completed 
          ? 'bg-green-500/20 text-green-500' 
          : 'bg-primary/10 text-primary'
      }`}>
        <span className="material-icons">{achievement.icon}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{achievement.title}</h3>
          {achievement.completed && (
            <div className="bg-green-500 text-white text-xs py-0.5 px-2 rounded-full">
              Завершено
            </div>
          )}
        </div>
        
        <p className="text-muted-foreground text-sm mt-1">{achievement.description}</p>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>{achievement.completed ? 'Завершено' : 'Прогресс'}</span>
            <span>{achievement.progress}%</span>
          </div>
          <Progress value={achievement.progress} className={`h-1.5 ${achievement.completed ? 'bg-green-500' : ''}`} />
        </div>
        
        <div className="mt-3 text-xs bg-primary/10 text-primary py-1 px-2 rounded inline-block">
          Награда: {achievement.reward}
        </div>
      </div>
      
      {/* Фоновый узор для завершенных достижений */}
      {achievement.completed && (
        <div className="absolute -right-5 -bottom-5 text-green-500/10">
          <span className="material-icons text-[100px]">emoji_events</span>
        </div>
      )}
    </motion.div>
  );
};

// Компонент рейтинга пользователя
const UserRating = () => {
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false
  });
  
  if (!user) return null;
  
  // Здесь должна быть логика расчета рейтинга и уровня на основе активности пользователя
  const level = 3;
  const levelProgress = 68;
  const pointsToNextLevel = 150;
  const currentPoints = levelProgress * (pointsToNextLevel / 100);
  
  return (
    <motion.div 
      className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 border border-primary/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium flex items-center">
            <span className="material-icons text-sm mr-1 text-primary">military_tech</span>
            Ваш рейтинг
          </h3>
          <div className="flex items-baseline">
            <span className="text-xl font-bold">Уровень {level}</span>
            <span className="text-muted-foreground text-sm ml-2">Опытный игрок</span>
          </div>
        </div>
        <div className="bg-primary text-white rounded-full h-8 w-8 flex items-center justify-center">
          {level}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Прогресс до следующего уровня</span>
          <span>{currentPoints}/{pointsToNextLevel} XP</span>
        </div>
        <Progress value={levelProgress} className="h-2" />
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-card p-2 rounded">
          <div className="text-muted-foreground">Ставок</div>
          <div className="font-bold">42</div>
        </div>
        <div className="bg-card p-2 rounded">
          <div className="text-muted-foreground">Выигрыши</div>
          <div className="font-bold">26</div>
        </div>
        <div className="bg-card p-2 rounded">
          <div className="text-muted-foreground">Винрейт</div>
          <div className="font-bold">61%</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <Button variant="outline" size="sm" className="w-full">
          <span className="material-icons text-sm mr-1">emoji_events</span>
          Посмотреть награды
        </Button>
      </div>
    </motion.div>
  );
};

// Основной компонент достижений
const Achievements = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedAchievements = showAll ? mockAchievements : mockAchievements.slice(0, 3);
  
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false
  });
  
  if (!user) return null; // Не показывать для неавторизованных пользователей
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-condensed font-bold text-lighttext flex items-center">
          <span className="material-icons text-md mr-2 text-primary">emoji_events</span>
          Достижения
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Скрыть' : 'Показать все'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <AnimatePresence>
            {displayedAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </AnimatePresence>
        </div>
        
        <div>
          <UserRating />
        </div>
      </div>
    </div>
  );
};

export default Achievements;