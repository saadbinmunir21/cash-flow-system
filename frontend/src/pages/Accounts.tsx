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
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { accountAPI, Account } from '../services/api';
import AddAccountModal from '../components/AddAccountModal';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      const response = await accountAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountAdded = () => {
    loadAccounts(); // Refresh the accounts list
  };

  const handleEditClick = (account: Account) => {
    setSelectedAccount(account);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (account: Account) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAccount) return;

    setDeleteLoading(true);
    try {
      await accountAPI.delete(selectedAccount._id);
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
      loadAccounts(); // Refresh the accounts list
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedAccount(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Accounts</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAccounts}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Account
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
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Account No</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Owner Account</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No accounts found. Click "Add Account" to create your first account.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.accountId}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{account.name}</Typography>
                      {account.address && (
                        <Typography variant="caption" color="textSecondary">
                          {account.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.type?.name || 'N/A'} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{account.accountNo || '-'}</TableCell>
                    <TableCell>{account.branch || '-'}</TableCell>
                    <TableCell>{account.contact || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.isOwnerAccount ? 'Yes' : 'No'}
                        color={account.isOwnerAccount ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(account)}
                          title="Edit Account"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(account)}
                          title="Delete Account"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Account Modal */}
      <AddAccountModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAccountAdded={handleAccountAdded}
      />

      {/* Edit Account Modal */}
      <AddAccountModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        onAccountAdded={handleAccountAdded}
        editAccount={selectedAccount}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete the account "{selectedAccount?.name}"?
          <br />
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteDialogClose} 
            disabled={deleteLoading}
          >
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

export default Accounts;