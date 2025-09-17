import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { accountAPI, transactionAPI, Account, Transaction, TransactionDetail } from '../services/api';

interface AccountReport {
  account: Account;
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
  transactions: {
    transaction: Transaction;
    amount: number;
    type: 'debit' | 'credit';
    description: string;
  }[];
}

interface FilterState {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  selectedAccount: string;
  ownerAccountsOnly: boolean;
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: dayjs().subtract(30, 'days'),
    endDate: dayjs(),
    selectedAccount: '',
    ownerAccountsOnly: false,
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<AccountReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState({
    totalAccounts: 0,
    totalCredit: 0,
    totalDebit: 0,
    netAmount: 0,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      generateReports();
    }
  }, [accounts, filters]);

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    }
  };

  const loadTransactions = async (): Promise<Transaction[]> => {
    try {
      const params: any = {};
      
      if (filters.startDate) {
        params.startDate = filters.startDate.format('YYYY-MM-DD');
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.format('YYYY-MM-DD');
      }

      const response = await transactionAPI.getAll(params);
      return response.data.transactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    }
  };

  const generateReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const allTransactions = await loadTransactions();
      setTransactions(allTransactions);

      // Filter accounts based on selection
      let filteredAccounts = accounts;
      
      if (filters.selectedAccount) {
        filteredAccounts = accounts.filter(acc => acc._id === filters.selectedAccount);
      } else if (filters.ownerAccountsOnly) {
        filteredAccounts = accounts.filter(acc => acc.isOwnerAccount);
      }

      // Generate reports for each account
      const accountReports: AccountReport[] = [];
      let totalCredit = 0;
      let totalDebit = 0;

      filteredAccounts.forEach(account => {
        const accountTransactions: AccountReport['transactions'] = [];
        let accountCredit = 0;
        let accountDebit = 0;

        allTransactions.forEach(transaction => {
          transaction.details.forEach(detail => {
            const detailAccount = typeof detail.account === 'string' 
              ? detail.account 
              : detail.account.name;
            
            if (detailAccount === account.name) {
              accountTransactions.push({
                transaction,
                amount: detail.amount,
                type: detail.type,
                description: detail.description,
              });

              if (detail.type === 'credit') {
                accountCredit += detail.amount;
                totalCredit += detail.amount;
              } else {
                accountDebit += detail.amount;
                totalDebit += detail.amount;
              }
            }
          });
        });

        if (accountTransactions.length > 0) {
          accountReports.push({
            account,
            totalCredit: accountCredit,
            totalDebit: accountDebit,
            netAmount: accountCredit - accountDebit,
            transactions: accountTransactions.sort((a, b) => 
              new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime()
            ),
          });
        }
      });

      setReports(accountReports);
      setSummary({
        totalAccounts: accountReports.length,
        totalCredit,
        totalDebit,
        netAmount: totalCredit - totalDebit,
      });

    } catch (error) {
      setError('Failed to generate reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: dayjs().subtract(30, 'days'),
      endDate: dayjs(),
      selectedAccount: '',
      ownerAccountsOnly: false,
    });
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Account Reports
        </Typography>

        {/* Filters Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Date Range */}
            <Box sx={{ minWidth: '200px', flex: '1 1 200px' }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                enableAccessibleFieldDOMStructure={false}
                slots={{ textField: TextField }}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Box>
            
            <Box sx={{ minWidth: '200px', flex: '1 1 200px' }}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                enableAccessibleFieldDOMStructure={false}
                slots={{ textField: TextField }}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Box>

            {/* Account Filter */}
            <Box sx={{ minWidth: '200px', flex: '1 1 200px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Specific Account</InputLabel>
                <Select
                  value={filters.selectedAccount}
                  onChange={(e) => handleFilterChange('selectedAccount', e.target.value)}
                  label="Specific Account"
                >
                  <MenuItem value="">All Accounts</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.name} ({account.type.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Owner Accounts Filter */}
            <Box sx={{ minWidth: '200px', flex: '1 1 200px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Type</InputLabel>
                <Select
                  value={filters.ownerAccountsOnly ? 'owner' : 'all'}
                  onChange={(e) => handleFilterChange('ownerAccountsOnly', e.target.value === 'owner')}
                  label="Filter Type"
                >
                  <MenuItem value="all">All Accounts</MenuItem>
                  <MenuItem value="owner">Owner Accounts Only</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, minWidth: '200px' }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={generateReports}
                disabled={loading}
              >
                Generate Report
              </Button>
              <Button variant="outlined" onClick={resetFilters}>
                Reset Filters
              </Button>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Accounts
                  </Typography>
                  <Typography variant="h5">
                    {summary.totalAccounts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Credits
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    ${summary.totalCredit.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDownIcon sx={{ mr: 1, color: 'error.main' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Debits
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    ${summary.totalDebit.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountIcon sx={{ mr: 1, color: summary.netAmount >= 0 ? 'success.main' : 'error.main' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Net Amount
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={summary.netAmount >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${Math.abs(summary.netAmount).toLocaleString()}
                    {summary.netAmount < 0 && ' (Loss)'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Account Reports */}
        {reports.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No data found for the selected filters
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your date range or account filters
            </Typography>
          </Paper>
        ) : (
          reports.map((report) => (
            <Accordion key={report.account._id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mr: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {report.account.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={report.account.type.name}
                        size="small"
                        variant="outlined"
                      />
                      {report.account.isOwnerAccount && (
                        <Chip
                          label="Owner Account"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="success.main">
                      Credits: ${report.totalCredit.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Debits: ${report.totalDebit.toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={report.netAmount >= 0 ? 'success.main' : 'error.main'}
                    >
                      Net: ${Math.abs(report.netAmount).toLocaleString()}
                      {report.netAmount < 0 ? ' (Dr)' : ' (Cr)'}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Typography variant="h6" gutterBottom>
                  Transaction History ({report.transactions.length} transactions)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Credit</TableCell>
                        <TableCell align="right">Debit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.transactions.map((txn, index) => (
                        <TableRow key={`${txn.transaction._id}-${index}`}>
                          <TableCell>
                            <Chip
                              label={txn.transaction.transactionId}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(txn.transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell align="right">
                            {txn.type === 'credit' ? (
                              <Typography color="success.main" fontWeight="bold">
                                ${txn.amount.toLocaleString()}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {txn.type === 'debit' ? (
                              <Typography color="error.main" fontWeight="bold">
                                ${txn.amount.toLocaleString()}
                              </Typography>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;