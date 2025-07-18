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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Bot" size={20} color="var(--color-primary-foreground)" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-headline-bold text-foreground">
                  AgenticAI SDR
                </h1>
                <p className="text-sm text-muted-foreground">{title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-sm text-muted-foreground">
                Welcome, {userProfile?.full_name || user?.email}
              </span>
              
              <nav className="flex space-x-1">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={`text-muted-foreground hover:text-foreground hover:bg-muted ${
                      currentPath === item.path ? 'text-primary bg-primary/10' : ''
                    }`}
                    iconName={item.icon}
                    iconPosition="left"
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-error hover:text-error-foreground hover:bg-error/10"
                iconName="LogOut"
                iconPosition="left"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;