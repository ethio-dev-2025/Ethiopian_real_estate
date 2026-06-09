// src/components/common/StatsCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Info, MoreVert } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary',
  trend,
  trendValue,
  subtext,
  loading = false,
  onClick,
  actions
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-text-muted';
    return trend === 'up' ? 'text-success' : 'text-error';
  };

  const getColorClasses = () => {
    switch(color) {
      case 'primary':
        return { bg: 'bg-primary-100', text: 'text-primary-700' };
      case 'secondary':
        return { bg: 'bg-secondary-100', text: 'text-secondary-700' };
      case 'success':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'warning':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      default:
        return { bg: 'bg-primary-100', text: 'text-primary-700' };
    }
  };

  const colorClasses = getColorClasses();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-border-light p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-2xl shadow-md border border-border-light p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {(trend || trendValue) && (
            <div className="flex items-center gap-1 mt-2">
              <div className={`flex items-center ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-xs ml-0.5">{trendValue}</span>
              </div>
              {subtext && (
                <span className="text-xs text-text-muted">{subtext}</span>
              )}
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center`}>
          <div className={`w-6 h-6 ${colorClasses.text}`}>
            {icon}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="flex justify-end mt-2">
          <button className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <MoreVert className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StatsCard;