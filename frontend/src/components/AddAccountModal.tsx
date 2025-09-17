import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
} from '@mui/material';
import { accountAPI, accountTypeAPI, CreateAccountData, AccountType, Account } from '../services/api';

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
  editAccount?: Account | null; // New prop for editing
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ 
  open, 
  onClose, 
  onAccountAdded, 
  editAccount 
}) => {
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: '',
    accountNo: '',
    branch: '',
    address: '',
    contact: '',
    isOwnerAccount: false,
  });
  
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isEditing = Boolean(editAccount);

  useEffect(() => {
    if (open) {
      loadAccountTypes();
      
      if (editAccount) {
        // Pre-fill form with existing account data
        setFormData({
          name: editAccount.name || '',
          type: editAccount.type?.name || '',
          accountNo: editAccount.accountNo || '',
          branch: editAccount.branch || '',
          address: editAccount.address || '',
          contact: editAccount.contact || '',
          isOwnerAccount: editAccount.isOwnerAccount || false,
        });
      } else {
        // Reset form for new account
        setFormData({
          name: '',
          type: '',
          accountNo: '',
          branch: '',
          address: '',
          contact: '',
          isOwnerAccount: false,
        });
      }
      setError('');
    }
  }, [open, editAccount]);

  const loadAccountTypes = async () => {
    try {
      const response = await accountTypeAPI.getAll();
      setAccountTypes(response.data);
    } catch (error) {
      console.error('Error loading account types:', error);
      setError('Failed to load account types');
    }
  };

  const handleInputChange = (field: keyof CreateAccountData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.type) {
      setError('Account type is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean up the data before sending
      const cleanData: CreateAccountData = {
        name: formData.name.trim(),
        type: formData.type,
        isOwnerAccount: formData.isOwnerAccount,
      };

      // Only include optional fields if they have values
      if (formData.accountNo?.trim()) cleanData.accountNo = formData.accountNo.trim();
      if (formData.branch?.trim()) cleanData.branch = formData.branch.trim();
      if (formData.address?.trim()) cleanData.address = formData.address.trim();
      if (formData.contact?.trim()) cleanData.contact = formData.contact.trim();

      if (isEditing && editAccount) {
        // Update existing account
        await accountAPI.update(editAccount._id, cleanData);
      } else {
        // Create new account
        await accountAPI.create(cleanData);
      }

      onAccountAdded(); // Refresh the accounts list
      onClose(); // Close the modal
    } catch (error: any) {
      console.error('Error saving account:', error);
      setError(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} account`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Account' : 'Add New Account'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {/* Row 1: Account Name and Type */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Account Name *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Meezan Bank, John Doe, Cash in Hand"
            />
            <FormControl fullWidth>
              <InputLabel>Account Type *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Account Type *"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type._id} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Row 2: Account Number and Branch */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Account Number"
              value={formData.accountNo || ''}
              onChange={(e) => handleInputChange('accountNo', e.target.value)}
              placeholder="e.g., 12345-67890-001"
            />
            <TextField
              fullWidth
              label="Branch"
              value={formData.branch || ''}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              placeholder="e.g., Main Branch Karachi"
            />
          </Box>

          {/* Row 3: Address (full width) */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="e.g., I.I. Chundrigar Road, Karachi"
              multiline
              rows={2}
            />
          </Box>

          {/* Row 4: Contact and Owner Account Checkbox */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Contact"
              value={formData.contact || ''}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              placeholder="e.g., +92-21-111-331-962"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isOwnerAccount}
                  onChange={(e) => handleInputChange('isOwnerAccount', e.target.checked)}
                />
              }
              label="This is my own account"
              sx={{ minWidth: '200px' }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading 
            ? (isEditing ? 'Updating...' : 'Adding...')
            : (isEditing ? 'Update Account' : 'Add Account')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAccountModal;