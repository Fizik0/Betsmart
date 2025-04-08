import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Bet } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    staleTime: Infinity,
    retry: false,
    onError: () => {
      navigate('/login');
      return null;
    }
  });
  
  const { data: bets, isLoading: betsLoading } = useQuery<Bet[]>({
    queryKey: ['/api/bets'],
    enabled: !!user,
  });
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      toast({
        title: 'Successfully logged out',
        description: 'You have been logged out of your account',
        variant: 'default',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'There was a problem logging out',
        variant: 'destructive',
      });
    }
  };
  
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-darkbg2 rounded-lg p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-6 w-64 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (userError || !user) {
    navigate('/login');
    return null;
  }
  
  const activeBets = bets?.filter(bet => bet.status === 'pending') || [];
  const settledBets = bets?.filter(bet => bet.status !== 'pending') || [];
  
  return (
    <>
      <Helmet>
        <title>Profile - BetSmart</title>
        <meta name="description" content="Manage your BetSmart account, view bet history and check your balance." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-darkbg2 rounded-lg overflow-hidden">
          <div className="bg-darkaccent px-6 py-4">
            <h1 className="text-2xl font-condensed font-bold text-lighttext">My Account</h1>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <h2 className="text-xl font-condensed text-lighttext">{user.fullName || user.username}</h2>
                <p className="text-mutedtext text-sm">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                <div className="flex items-center">
                  <span className="text-mutedtext mr-2">Balance:</span>
                  <span className="font-mono text-xl text-primary">€{user.balance.toFixed(2)}</span>
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button className="bg-primary hover:bg-opacity-90 text-white">
                    Deposit
                  </Button>
                  <Button variant="outline" className="text-mutedtext border-darkaccent hover:bg-darkaccent">
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-darkbg mb-6 w-full justify-start">
                <TabsTrigger value="overview" className="data-[state=active]:bg-darkaccent">Overview</TabsTrigger>
                <TabsTrigger value="active-bets" className="data-[state=active]:bg-darkaccent">Active Bets</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-darkaccent">Bet History</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-darkaccent">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-darkbg rounded-lg p-4">
                    <h3 className="text-lg font-condensed text-lighttext mb-4 flex items-center">
                      <span className="material-icons text-mutedtext mr-2">account_circle</span>
                      Account Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-mutedtext">Username:</span>
                        <span className="text-lighttext">{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mutedtext">Email:</span>
                        <span className="text-lighttext">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mutedtext">Preferred Language:</span>
                        <span className="text-lighttext">{user.language === 'en' ? 'English' : 'Русский'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-darkbg rounded-lg p-4">
                    <h3 className="text-lg font-condensed text-lighttext mb-4 flex items-center">
                      <span className="material-icons text-mutedtext mr-2">sports</span>
                      Betting Activity
                    </h3>
                    {betsLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : bets && bets.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-mutedtext">Total Bets:</span>
                          <span className="text-lighttext">{bets.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mutedtext">Active Bets:</span>
                          <span className="text-lighttext">{activeBets.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mutedtext">Winning Bets:</span>
                          <span className="text-[#0f9d58]">{settledBets.filter(bet => bet.status === 'won').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mutedtext">Lost Bets:</span>
                          <span className="text-destructive">{settledBets.filter(bet => bet.status === 'lost').length}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-mutedtext">No betting activity yet</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-darkbg rounded-lg p-4 md:col-span-2">
                    <h3 className="text-lg font-condensed text-lighttext mb-4 flex items-center">
                      <div className="inline-block font-mono text-xs py-1 px-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded mr-2">AI</div>
                      Personalized Insights
                    </h3>
                    <div className="space-y-4">
                      <p className="text-mutedtext">Based on your betting history, here are some insights:</p>
                      
                      {bets && bets.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2 text-lighttext">
                          <li>Your most successful sport is <span className="text-primary font-medium">Soccer</span></li>
                          <li>You tend to place bets with average odds of <span className="text-primary font-mono">2.45</span></li>
                          <li>Your win rate is <span className="text-primary font-medium">42%</span></li>
                        </ul>
                      ) : (
                        <div className="bg-darkaccent bg-opacity-50 rounded-lg p-4">
                          <p className="text-center text-mutedtext">Place your first bet to receive AI-powered insights</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="active-bets">
                {betsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : activeBets.length > 0 ? (
                  <div className="space-y-4">
                    {activeBets.map(bet => (
                      <div key={bet.id} className="bg-darkbg rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <div className="flex items-center mb-1">
                              <span className="material-icons text-mutedtext text-sm mr-1">
                                sports_soccer
                              </span>
                              <span className="text-mutedtext text-sm">{bet.betType}</span>
                              <span className="ml-2 bg-[#f39c12] text-white text-xs px-2 py-0.5 rounded">PENDING</span>
                            </div>
                            <h4 className="font-condensed text-lighttext text-lg mb-1">Selection: {bet.selection}</h4>
                            <div className="flex items-center">
                              <span className="text-mutedtext text-xs">Placed on {new Date(bet.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                            <div className="flex items-center mb-1">
                              <span className="text-mutedtext mr-2">Stake:</span>
                              <span className="font-mono text-lighttext">€{bet.stake.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center mb-1">
                              <span className="text-mutedtext mr-2">Odds:</span>
                              <span className="font-mono text-lighttext">{bet.odds.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-mutedtext mr-2">Potential Win:</span>
                              <span className="font-mono text-[#0f9d58]">€{bet.potentialWin.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-darkbg rounded-lg">
                    <span className="material-icons text-mutedtext text-4xl mb-2">receipt_long</span>
                    <h3 className="text-xl font-condensed text-lighttext mb-2">No active bets</h3>
                    <p className="text-mutedtext mb-4">You don't have any active bets at the moment</p>
                    <Button className="bg-primary hover:bg-opacity-90 text-white" onClick={() => navigate('/')}>
                      Place a Bet
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history">
                {betsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : settledBets.length > 0 ? (
                  <div className="space-y-4">
                    {settledBets.map(bet => (
                      <div key={bet.id} className="bg-darkbg rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <div className="flex items-center mb-1">
                              <span className="material-icons text-mutedtext text-sm mr-1">
                                sports_soccer
                              </span>
                              <span className="text-mutedtext text-sm">{bet.betType}</span>
                              <span className={`ml-2 ${
                                bet.status === 'won' ? 'bg-[#0f9d58]' : 'bg-destructive'
                              } text-white text-xs px-2 py-0.5 rounded`}>
                                {bet.status.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-condensed text-lighttext text-lg mb-1">Selection: {bet.selection}</h4>
                            <div className="flex items-center">
                              <span className="text-mutedtext text-xs">Settled on {new Date(bet.settledAt || bet.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                            <div className="flex items-center mb-1">
                              <span className="text-mutedtext mr-2">Stake:</span>
                              <span className="font-mono text-lighttext">€{bet.stake.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center mb-1">
                              <span className="text-mutedtext mr-2">Odds:</span>
                              <span className="font-mono text-lighttext">{bet.odds.toFixed(2)}</span>
                            </div>
                            {bet.status === 'won' ? (
                              <div className="flex items-center">
                                <span className="text-mutedtext mr-2">Won:</span>
                                <span className="font-mono text-[#0f9d58]">€{bet.potentialWin.toFixed(2)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="text-mutedtext mr-2">Lost:</span>
                                <span className="font-mono text-destructive">€{bet.stake.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-darkbg rounded-lg">
                    <span className="material-icons text-mutedtext text-4xl mb-2">history</span>
                    <h3 className="text-xl font-condensed text-lighttext mb-2">No bet history</h3>
                    <p className="text-mutedtext">Your completed bets will appear here</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="space-y-6">
                  <div className="bg-darkbg rounded-lg p-4">
                    <h3 className="text-lg font-condensed text-lighttext mb-4">Account Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-mutedtext mb-1">Username</label>
                        <input 
                          type="text" 
                          className="bg-darkaccent text-lighttext py-2 px-3 rounded w-full focus:outline-none focus:ring-1 focus:ring-primary"
                          value={user.username}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <label className="block text-mutedtext mb-1">Email</label>
                        <input 
                          type="email" 
                          className="bg-darkaccent text-lighttext py-2 px-3 rounded w-full focus:outline-none focus:ring-1 focus:ring-primary"
                          value={user.email}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <label className="block text-mutedtext mb-1">Language</label>
                        <select 
                          className="bg-darkaccent text-lighttext py-2 px-3 rounded w-full focus:outline-none focus:ring-1 focus:ring-primary"
                          value={user.language}
                          disabled
                        >
                          <option value="en">English</option>
                          <option value="ru">Русский</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-darkbg rounded-lg p-4">
                    <h3 className="text-lg font-condensed text-lighttext mb-4">Security</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-mutedtext mb-1">Change Password</label>
                        <Button 
                          variant="outline" 
                          className="text-mutedtext border-darkaccent hover:bg-darkaccent w-full justify-start"
                          disabled
                        >
                          <span className="material-icons text-sm mr-2">lock</span>
                          Update Password
                        </Button>
                      </div>
                      
                      <div>
                        <label className="block text-mutedtext mb-1">Two-Factor Authentication</label>
                        <Button 
                          variant="outline" 
                          className="text-mutedtext border-darkaccent hover:bg-darkaccent w-full justify-start"
                          disabled
                        >
                          <span className="material-icons text-sm mr-2">security</span>
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-darkbg rounded-lg p-4">
                    <h3 className="text-lg font-condensed text-lighttext mb-4">Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="text-mutedtext border-darkaccent hover:bg-darkaccent w-full justify-start"
                        onClick={handleLogout}
                      >
                        <span className="material-icons text-sm mr-2">logout</span>
                        Sign Out
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start"
                        disabled
                      >
                        <span className="material-icons text-sm mr-2">delete</span>
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
