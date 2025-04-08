import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/login', {
        username: data.username,
        password: data.password,
      });
      
      // Invalidate queries to fetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to BetSmart!',
        variant: 'default',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid username or password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - BetSmart</title>
        <meta name="description" content="Log in to your BetSmart account and start betting." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-md bg-darkbg2 border-darkaccent text-lighttext">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <span className="text-primary font-condensed text-3xl font-bold flex items-center">
                <span className="material-icons mr-1">sports</span>
                BetSmart
              </span>
            </div>
            <CardTitle className="text-2xl font-condensed text-center">Sign In</CardTitle>
            <CardDescription className="text-mutedtext text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          className="bg-darkbg border-darkaccent text-lighttext"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your password" 
                          type="password"
                          className="bg-darkbg border-darkaccent text-lighttext"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="accent-primary h-4 w-4 bg-darkbg border-darkaccent"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-mutedtext text-sm cursor-pointer">Remember me</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                
                <Button type="submit" className="w-full bg-primary hover:bg-opacity-90" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-darkaccent"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-darkbg2 text-mutedtext">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="border-darkaccent text-lighttext hover:bg-darkaccent">
                <span className="material-icons text-sm mr-2">language</span> Google
              </Button>
              <Button variant="outline" className="border-darkaccent text-lighttext hover:bg-darkaccent">
                <span className="material-icons text-sm mr-2">facebook</span> Facebook
              </Button>
            </div>
            
            <div className="text-center text-lighttext">
              Don't have an account? <Link href="/register" className="text-primary hover:underline">Sign Up</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
