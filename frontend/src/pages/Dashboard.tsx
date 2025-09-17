import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  SwapHoriz,
  People,
} from '@mui/icons-material';
import { dashboardAPI, DashboardStats } from '../services/api';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    ownerAccounts: 0,
    totalTransactions: 0,
    totalAccountTypes: 0,
    recentTransactions: [],
    accountsByType: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              bgcolor: `${color}.main`,
              color: 'white',
              borderRadius: 1,
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard
          title="Total Accounts"
          value={stats.totalAccounts}
          icon={<AccountBalance />}
          color="primary"
        />
        <StatCard
          title="Owner Accounts"
          value={stats.ownerAccounts}
          icon={<TrendingUp />}
          color="success"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={<SwapHoriz />}
          color="info"
        />
        <StatCard
          title="Account Types"
          value={stats.totalAccountTypes}
          icon={<People />}
          color="warning"
        />
      </Box>

      {/* Recent Transactions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        {stats.recentTransactions.length === 0 ? (
          <Typography>No recent transactions</Typography>
        ) : (
          stats.recentTransactions.map((transaction) => (
            <Box key={transaction._id} sx={{ mb: 1, p: 1, border: '1px solid #ddd' }}>
              <Typography variant="subtitle2">
                Transaction ID: {transaction.transactionId}
              </Typography>
              <Typography variant="body2">
                Date: {new Date(transaction.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                Amount: ${transaction.totalAmount.toLocaleString()}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;