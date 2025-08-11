import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { requestPasswordReset } from '@/lib/api';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <>
    <Card className="w-full max-w-md card-gradient border-border/50">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold text-gradient-primary">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to book your favorite courts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input/50 border-border focus:border-primary"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-input/50 border-border focus:border-primary"
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/90"
              onClick={() => { setForgotEmail(''); setForgotOpen(true); }}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full btn-bounce neon-glow bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-primary hover:text-primary/90 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
    {/* Forgot password dialog */}
    <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter the email associated with your account. We'll send reset instructions if it exists.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="forgot-email" type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!forgotEmail.trim()) { toast.error('Please enter your email'); return; }
              try {
                setForgotLoading(true);
                await requestPasswordReset(forgotEmail.trim());
                toast.success('If an account exists, a reset link has been sent');
                setForgotOpen(false);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to request password reset';
                toast.error(msg);
              } finally {
                setForgotLoading(false);
              }
            }}
            disabled={forgotLoading}
          >
            {forgotLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};