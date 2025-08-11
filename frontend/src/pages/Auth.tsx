import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { OTPForm } from '@/components/auth/OTPForm';
import { useAuth } from '@/lib/auth';

export const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user, pendingVerification } = useAuth();

  // Redirect if user is already authenticated
  if (user) {
    const target =
      user.role === 'admin'
        ? '/dashboard/admin'
        : user.role === 'facility_owner'
        ? '/dashboard/facility'
        : '/dashboard/user';
    return <Navigate to={target} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {pendingVerification ? (
          <OTPForm onBack={() => setMode('signup')} />
        ) : mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

export default Auth;