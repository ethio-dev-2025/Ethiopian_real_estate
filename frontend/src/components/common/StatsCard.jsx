// src/component/dashboard/common/StatsCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Info,
  MoreVert
} from '@mui/icons-material';

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
    return trend === 'up' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    return trend === 'up' ? 'success.main' : 'error.main';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            
            {(trend || trendValue) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Box sx={{ color: getTrendColor(), display: 'flex', alignItems: 'center' }}>
                  {getTrendIcon()}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {trendValue}
                  </Typography>
                </Box>
                {subtext && (
                  <Typography variant="caption" color="text.secondary">
                    {subtext}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          <Box>
            <Avatar 
              sx={{ 
                bgcolor: `${color}.light`, 
                color: `${color}.main`,
                width: 48,
                height: 48
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </Box>
        
        {actions && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Tooltip title="More options">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                // Handle actions menu
              }}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;