import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { transactionAPI, Transaction } from '../services/api';
import AddTransactionModal from '../components/AddTransactionModal';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const response = await transactionAPI.getAll();
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    loadTransactions();
  };

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;

    setDeleteLoading(true);
    try {
      await transactionAPI.delete(selectedTransaction._id);
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      loadTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      setError(error.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleRowExpanded = (transactionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTransactions}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No transactions found. Click "Add Transaction" to create your first transaction.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <React.Fragment key={transaction._id}>
                    <TableRow>
                      <TableCell>{transaction.transactionId}</TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>${transaction.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={
                            transaction.status === 'completed'
                              ? 'success'
                              : transaction.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(transaction)}
                            title="Edit Transaction"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(transaction)}
                            title="Delete Transaction"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpanded(transaction._id)}
                        >
                          {expandedRows.has(transaction._id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Details Row */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse
                          in={expandedRows.has(transaction._id)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Transaction Details
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>S.No</TableCell>
                                  <TableCell>Account</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Credit Amount</TableCell>
                                  <TableCell>Debit Amount</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {transaction.details.map((detail, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{detail.serialNo}</TableCell>
                                    <TableCell>
                                      {typeof detail.account === 'string'
                                        ? detail.account
                                        : detail.account.name}
                                    </TableCell>
                                    <TableCell>{detail.description}</TableCell>
                                    <TableCell>
                                      {detail.type === 'credit'
                                        ? `$${detail.amount.toLocaleString()}`
                                        : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {detail.type === 'debit'
                                        ? `$${detail.amount.toLocaleString()}`
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        onTransactionAdded={handleTransactionAdded}
        editTransaction={selectedTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete Transaction ID: {selectedTransaction?.transactionId}?
          <br />
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;