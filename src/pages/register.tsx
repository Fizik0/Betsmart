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

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  language: z.enum(['en', 'ru']).default('en'),
  fullName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      language: 'en',
      fullName: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        language: data.language,
        fullName: data.fullName || undefined,
      });
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You can now log in.',
        variant: 'default',
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register - BetSmart</title>
        <meta name="description" content="Create a new BetSmart account and start betting with AI-powered recommendations." />
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
            <CardTitle className="text-2xl font-condensed text-center">Create an Account</CardTitle>
            <CardDescription className="text-mutedtext text-center">
              Enter your details below to create your BetSmart account
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email" 
                          type="email"
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
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
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
                          placeholder="Create a password" 
                          type="password"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Confirm your password" 
                          type="password"
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lighttext">Preferred Language</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full bg-darkbg border border-darkaccent text-lighttext h-10 px-3 rounded-md"
                          {...field}
                        >
                          <option value="en">English</option>
                          <option value="ru">Русский</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full bg-primary hover:bg-opacity-90" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-mutedtext text-sm">
              By registering, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </div>
            <div className="text-center text-lighttext">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default RegisterPage;
