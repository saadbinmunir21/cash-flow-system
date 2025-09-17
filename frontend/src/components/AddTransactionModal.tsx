import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { accountAPI, transactionAPI, Account, Transaction, CreateTransactionData } from '../services/api';

type DetailType = 'debit' | 'credit';

interface TransactionDetail {
  serialNo: number;
  account: string;
  description: string;
  /** Keep raw user input as string to avoid "jumping to 0" issues while typing */
  amountStr: string;
  type: DetailType;
}

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  editTransaction?: Transaction | null;
}

const toNumber = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onClose,
  onTransactionAdded,
  editTransaction,
}) => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [details, setDetails] = useState<TransactionDetail[]>([
    {
      serialNo: 1,
      account: '',
      description: '',
      amountStr: '',
      type: 'credit',
    },
  ]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isEditing = Boolean(editTransaction);

  useEffect(() => {
    if (!open) return;

    const init = async () => {
      setError('');
      await loadAccounts();

      if (editTransaction) {
        setDate(dayjs(editTransaction.date));
        setDetails(
          editTransaction.details.map((detail, index) => ({
            serialNo: index + 1,
            account:
              typeof detail.account === 'string'
                ? detail.account
                : detail.account.name,
            description: detail.description || '',
            amountStr: String(detail.amount ?? ''),
            type: detail.type as DetailType,
          }))
        );
      } else {
        setDate(dayjs());
        setDetails([
          {
            serialNo: 1,
            account: '',
            description: '',
            amountStr: '',
            type: 'credit',
          },
        ]);
      }
    };

    init();
  }, [open, editTransaction]);

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAll();
      setAccounts(response.data);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    }
  };

  const addDetailRow = () => {
    const newDetail: TransactionDetail = {
      serialNo: details.length + 1,
      account: '',
      description: '',
      amountStr: '',
      type: 'credit',
    };
    setDetails((prev) => [...prev, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails((prev) => {
      if (prev.length <= 1) return prev;
      const newDetails = prev.filter((_, i) => i !== index);
      // re-number serials
      return newDetails.map((d, i) => ({ ...d, serialNo: i + 1 }));
    });
  };

  const updateDetail = <K extends keyof TransactionDetail>(
    index: number,
    field: K,
    value: TransactionDetail[K]
  ) => {
    setDetails((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateTransaction = () => {
    const errors: string[] = [];

    details.forEach((detail, index) => {
      if (!detail.account) {
        errors.push(`Row ${index + 1}: Account is required`);
      }
      if (!detail.description.trim()) {
        errors.push(`Row ${index + 1}: Description is required`);
      }
      if (toNumber(detail.amountStr) <= 0) {
        errors.push(`Row ${index + 1}: Amount must be greater than 0`);
      }
    });

    const totalDebits = details
      .filter((d) => d.type === 'debit')
      .reduce((sum, d) => sum + toNumber(d.amountStr), 0);

    const totalCredits = details
      .filter((d) => d.type === 'credit')
      .reduce((sum, d) => sum + toNumber(d.amountStr), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push('Total debits must equal total credits');
    }

    return errors;
  };

  const getTotals = () => {
    const totalDebits = details
      .filter((d) => d.type === 'debit')
      .reduce((sum, d) => sum + toNumber(d.amountStr), 0);

    const totalCredits = details
      .filter((d) => d.type === 'credit')
      .reduce((sum, d) => sum + toNumber(d.amountStr), 0);

    return { totalDebits, totalCredits };
  };

  const handleSubmit = async () => {
    const validationErrors = validateTransaction();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transactionData: CreateTransactionData = {
        date: date.toISOString(),
        details: details.map((detail) => ({
          account: detail.account,
          description: detail.description.trim(),
          amount: toNumber(detail.amountStr),
          type: detail.type,
        })),
      };

      if (isEditing && editTransaction) {
        // Implement update in backend if needed
        // await transactionAPI.update(editTransaction._id, transactionData);
        console.log('Edit transaction:', transactionData);
      } else {
        await transactionAPI.create(transactionData);
      }

      onTransactionAdded();
      onClose();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setError(err?.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebits, totalCredits } = getTotals();
  const diff = Math.abs(totalCredits - totalDebits);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3, mt: 2 }}>
            <DatePicker
              label="Transaction Date"
              value={date}
              onChange={(newValue) => newValue && setDate(newValue)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Transaction Details
          </Typography>

          <Paper variant="outlined" sx={{ mb: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Credit Amount</TableCell>
                    <TableCell>Debit Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.map((detail, index) => (
                    <TableRow key={detail.serialNo}>
                      <TableCell>{detail.serialNo}</TableCell>

                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={detail.account}
                            onChange={(e) =>
                              updateDetail(index, 'account', e.target.value)
                            }
                            displayEmpty
                          >
                            <MenuItem value="">Select Account</MenuItem>
                            {accounts.map((account) => (
                              <MenuItem key={account._id} value={account.name}>
                                {account.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={detail.description}
                          onChange={(e) =>
                            updateDetail(index, 'description', e.target.value)
                          }
                          placeholder="Enter description"
                        />
                      </TableCell>

                      {/* Credit input controls the type=credit and keeps raw string */}
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={detail.type === 'credit' ? detail.amountStr : ''}
                          onChange={(e) => {
                            // switch to credit side if not already
                            if (detail.type !== 'credit') {
                              updateDetail(index, 'type', 'credit');
                            }
                            updateDetail(index, 'amountStr', e.target.value);
                          }}
                          placeholder="0"
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </TableCell>

                      {/* Debit input controls the type=debit and keeps raw string */}
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={detail.type === 'debit' ? detail.amountStr : ''}
                          onChange={(e) => {
                            if (detail.type !== 'debit') {
                              updateDetail(index, 'type', 'debit');
                            }
                            updateDetail(index, 'amountStr', e.target.value);
                          }}
                          placeholder="0"
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeDetailRow(index)}
                          disabled={details.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Button
              startIcon={<AddIcon />}
              onClick={addDetailRow}
              variant="outlined"
            >
              Add Row
            </Button>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">
                Total Credits:{' '}
                <strong>${totalCredits.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2">
                Total Debits:{' '}
                <strong>${totalDebits.toLocaleString()}</strong>
              </Typography>
              <Typography
                variant="body2"
                color={diff < 0.01 ? 'success.main' : 'error.main'}
              >
                Difference: <strong>${diff.toLocaleString()}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading
              ? isEditing
                ? 'Updating...'
                : 'Adding...'
              : isEditing
              ? 'Update Transaction'
              : 'Add Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTransactionModal;
