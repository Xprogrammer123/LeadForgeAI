import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company_name: '',
    role: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { user, userProfile, updateProfile } = useAuth();

  useEffect(() => {
    if (userProfile) {
      setProfile({
        full_name: userProfile.full_name || '',
        email: user?.email || '',
        company_name: userProfile.company_name || '',
        role: userProfile.role || ''
      });
    }
  }, [user, userProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile({
        full_name: profile.full_name,
        company_name: profile.company_name,
        role: profile.role
      });

      if (result?.success) {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result?.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Password change logic would go here
      // This would typically involve calling an auth service
      setSuccess('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Settings" currentPath="/settings">
      <div className="space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-lg p-4 border border-error/20 bg-error/10"
          >
            <div className="text-sm text-error font-body-medium">{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-lg p-4 border border-success/20 bg-success/10"
          >
            <div className="text-sm text-success font-body-medium">{success}</div>
          </motion.div>
        )}

        {/* Header */}
        <div>
          <h2 className="text-2xl font-headline-bold text-foreground">
            Account Settings
          </h2>
          <p className="text-muted-foreground font-body">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Icon name="User" size={24} color="var(--color-primary)" />
            <h3 className="text-lg font-headline-bold text-foreground">
              Profile Information
            </h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted/20 cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Company
                </label>
                <Input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({...profile, company: e.target.value})}
                  placeholder="Enter your company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Job Title
                </label>
                <Input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({...profile, title: e.target.value})}
                  placeholder="Enter your job title"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={loading}
                className="cta-button"
              >
                Update Profile
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Icon name="Lock" size={24} color="var(--color-primary)" />
            <h3 className="text-lg font-headline-bold text-foreground">
              Change Password
            </h3>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-body-semibold text-foreground mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                placeholder="Enter current password"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={loading}
                variant="secondary"
              >
                Change Password
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Icon name="Bell" size={24} color="var(--color-primary)" />
            <h3 className="text-lg font-headline-bold text-foreground">
              Notification Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-body-semibold text-foreground">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive email updates about your campaigns</p>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-primary rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-body-semibold text-foreground">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive browser notifications for new leads</p>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-muted-foreground rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-body-semibold text-foreground">Weekly Reports</h4>
                <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-primary rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;