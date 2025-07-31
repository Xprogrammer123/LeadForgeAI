import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import Icon from '../AppIcon';
import Button from '../ui/Button';

const DashboardLayout = ({ children, title, currentPath }) => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'BarChart3' },
    { path: '/campaigns', label: 'Campaigns', icon: 'Megaphone' },
    { path: '/contacts', label: 'Contacts', icon: 'Users' },
    { path: '/settings', label: 'Settings', icon: 'Settings' }
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 h-screen sticky top-0 glassmorphism shadow-md border-r border-border p-6 flex flex-col justify-between">
        <div>
          {/* Logo & Title */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Bot" size={20} color="var(--color-primary-foreground)" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-headline-bold text-foreground">LeadForge AI</h1>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`w-full justify-start text-foreground border border-transparent hover:border-lime-500 hover:bg-lime-500 focus:border-lime-500 focus:bg-black focus:outline-none transition-all duration-200 py-5  ${
                  currentPath === item.path ? 'bg-black border-lime-500 text-white' : ''
                }`}
                iconName={item.icon}
                iconPosition="left"
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="space-y-4">
          <span className="text-sm text-muted-foreground block">
            Welcome, {userProfile?.full_name || user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full text-error hover:text-white hover:bg-error focus:bg-error focus:text-white transition-all duration-200"
            iconName="LogOut"
            iconPosition="left"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
