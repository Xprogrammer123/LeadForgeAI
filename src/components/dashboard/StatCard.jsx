import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

const StatCard = ({ title, value, icon, color = 'primary', change = null }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glassmorphism rounded-xl p-6 hover:shadow-glassmorphism transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-body-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-headline-bold text-foreground mb-2">
            {value}
          </p>
          {change && (
            <div className="flex items-center space-x-1">
              <Icon 
                name={change > 0 ? 'TrendingUp' : 'TrendingDown'} 
                size={16} 
                color={change > 0 ? 'var(--color-success)' : 'var(--color-error)'} 
              />
              <span className={`text-sm font-body-medium ${change > 0 ? 'text-success' : 'text-error'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;