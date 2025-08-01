
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../../utils/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const result = await authService.resetPassword(email);
      
      if (result?.success) {
        setSuccess(true);
      } else {
        setError(result?.error || 'Failed to send reset email');
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
            <Icon name="Lock" size={28} color="white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-3xl font-headline-bold text-foreground"
          >
            Reset your password
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-sm text-muted-foreground font-body max-w-sm mx-auto"
          >
            Enter your email address and we'll send you a link to reset your password.
          </motion.p>
        </div>
        
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glassmorphism rounded-2xl p-8 shadow-xl"
        >
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                    <span>Sending reset link...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Icon name="Mail" size={16} color="white" />
                    <span>Send reset link</span>
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Icon name="CheckCircle" size={32} color="var(--color-success)" />
              </div>
              <h3 className="text-lg font-headline-bold text-foreground">
                Reset link sent!
              </h3>
              <p className="text-sm text-muted-foreground font-body">
                Password reset link has been sent to <span className="font-body-semibold text-foreground">{email}</span>. 
                Please check your inbox and follow the instructions.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-body-semibold transition-colors"
                >
                  <Icon name="ArrowLeft" size={16} />
                  <span>Back to login</span>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Back to login */}
        {!success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-body-semibold transition-colors"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Back to login</span>
            </Link>
          </motion.div>
        )}

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="glassmorphism rounded-xl p-4 text-center"
        >
          <p className="text-xs text-muted-foreground font-body">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                setSuccess(false);
                setError('');
              }}
              className="text-primary hover:text-primary/80 font-body-semibold transition-colors"
            >
              try again
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
