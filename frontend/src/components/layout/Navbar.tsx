import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FriendlyAvatar from '@/assets/friendly-avatar.svg';

import { useAuth } from '@/lib/auth';
import { Menu, User, LogOut, Calendar, MapPin, Home, LayoutDashboard, Info } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

import logoUrl from '@/assets/logo.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isActive = (path: string) => location.pathname === path;

  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'facility_owner'
      ? '/dashboard/facility'
      : '/dashboard/user';

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/venues', label: 'Venues', icon: MapPin },
    { path: '/about', label: 'About', icon: Info },
    ...(user
      ? [
          { path: dashboardPath, label: 'Dashboard', icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={logoUrl}
              alt="QuickCourt Logo"
              className="h-8 w-8 rounded-lg object-cover"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-gradient-brand hidden sm:block">
              QuickCourt
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isActive(path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
                {isActive(path) && (
                  <span className="absolute -bottom-2 left-3 right-3 h-0.5 rounded-full bg-primary/70" />
                )}
              </Link>
            ))}
          </div>

          {/* Theme + User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile">
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <AvatarImage src={user.avatar || (FriendlyAvatar as unknown as string)} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              (() => {
                const onAuth = location.pathname === '/auth';
                const mode = (searchParams.get('mode') as 'login' | 'signup') || 'login';
                const targetMode = onAuth && mode === 'login' ? 'signup' : 'login';
                const label = targetMode === 'signup' ? 'Sign Up' : 'Sign In';
                const href = `/auth?mode=${targetMode}`;
                return (
                  <div className="flex items-center gap-3">
                    <Link to={href}>
                      <Button className="btn-bounce bg-primary hover:bg-primary/90 shadow-sm">
                        <User className="h-4 w-4 mr-2" />
                        {label}
                      </Button>
                    </Link>
                  </div>
                );
              })()
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-border">
              <div className="flex flex-col space-y-4 mt-6">
                <div className="px-4 flex items-center justify-between">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(path)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="justify-start px-4 py-3 h-auto text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </>
                ) : (
                  (() => {
                    const onAuth = location.pathname === '/auth';
                    const mode = (searchParams.get('mode') as 'login' | 'signup') || 'login';
                    const targetMode = onAuth && mode === 'login' ? 'signup' : 'login';
                    const label = targetMode === 'signup' ? 'Sign Up' : 'Sign In';
                    const href = `/auth?mode=${targetMode}`;
                    return (
                      <Link to={href} onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start btn-bounce bg-primary hover:bg-primary/90">
                          <User className="h-5 w-5 mr-3" />
                          {label}
                        </Button>
                      </Link>
                    );
                  })()
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};