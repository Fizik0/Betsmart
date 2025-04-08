import FeaturedSlider from '@/components/home/featured-slider';
import AIRecommendations from '@/components/home/ai-recommendations';
import LiveEvents from '@/components/home/live-events';
import UpcomingEvents from '@/components/home/upcoming-events';
import UserWelcome from '@/components/home/user-welcome';
import HotBets from '@/components/home/hot-bets';
import Achievements from '@/components/home/achievements';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { motion } from 'framer-motion';

const Home = () => {
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false
  });
  
  // Определяем анимацию для контейнера
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  // Анимация для дочерних элементов
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <>
      <Helmet>
        <title>BetSmart - AI-Powered Sports Betting</title>
        <meta name="description" content="BetSmart offers sports betting with AI-powered recommendations, live events, and competitive odds." />
      </Helmet>
      
      <motion.div 
        className="container mx-auto px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Приветствие пользователя (только для авторизованных пользователей) */}
        <motion.div variants={itemVariants}>
          <UserWelcome />
        </motion.div>
        
        {/* Слайдер с популярными событиями */}
        <motion.div variants={itemVariants}>
          <FeaturedSlider />
        </motion.div>
        
        {/* AI Рекомендации */}
        <motion.div variants={itemVariants}>
          <AIRecommendations />
        </motion.div>
        
        {/* Горячие ставки - показываем только авторизованным пользователям */}
        {user && (
          <motion.div variants={itemVariants}>
            <HotBets />
          </motion.div>
        )}
        
        {/* Живые события */}
        <motion.div variants={itemVariants}>
          <LiveEvents />
        </motion.div>
        
        {/* Достижения - показываем только авторизованным пользователям */}
        {user && (
          <motion.div variants={itemVariants}>
            <Achievements />
          </motion.div>
        )}
        
        {/* Предстоящие события */}
        <motion.div variants={itemVariants}>
          <UpcomingEvents />
        </motion.div>
      </motion.div>
    </>
  );
};

export default Home;
