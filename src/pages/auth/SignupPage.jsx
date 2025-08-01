
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';

function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    role: 'member'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the terms of service');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        full_name: formData.fullName,
        company_name: formData.companyName,
        role: formData.role
      };

      const result = await signUp(formData.email, formData.password, userData);
      
      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Icon name="Zap" size={28} color="white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-headline-bold text-foreground"
          >
            Create your account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm text-muted-foreground font-body"
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-body-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </motion.p>
        </div>
        
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glassmorphism rounded-2xl p-8 shadow-xl"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-body-semibold text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="w-full"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-body-semibold text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-body-semibold text-foreground mb-2">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="w-full"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-body-semibold text-foreground mb-2">
                  Role
                </label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-body-semibold text-foreground mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-body-semibold text-foreground mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="acceptTerms" className="text-sm text-muted-foreground font-body leading-5">
                I accept the{' '}
                <Link to="/terms" className="text-primary hover:text-primary/80 font-body-semibold transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary hover:text-primary/80 font-body-semibold transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphism rounded-lg p-4 border border-error/20 bg-error/10"
              >
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={16} color="var(--color-error)" />
                  <div className="text-sm text-error font-body-medium">{error}</div>
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-body-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground"
        >
          <div className="flex items-center space-x-2">
            <Icon name="Shield" size={14} color="var(--color-primary)" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={14} color="var(--color-primary)" />
            <span>Setup in 2 Minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Users" size={14} color="var(--color-primary)" />
            <span>Join 10,000+ Users</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SignupPage;
