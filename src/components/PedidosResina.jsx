import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { calcularDineroBruto } from '../utils/storage';
import { usePedidos } from '../context/PedidosContext';

const PedidosResina = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pedidosResina, pedidosFiguras, actualizarPedidosResina, eliminarPedidoResina } = usePedidos();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [fechaCompra, setFechaCompra] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [cantidad, setCantidad] = useState('');

  const handleSave = () => {
    if (!fechaCompra || !cantidad) return;

    const dineroBruto = calcularDineroBruto(
      fechaCompra,
      fechaFin || new Date('2100-01-01'),
      pedidosFiguras
    );

    const newPedido = {
      id: currentPedido?.id || Date.now(),
      fechaCompra: fechaCompra,
      fechaFin: fechaFin,
      cantidad: Number(cantidad),
      dineroBruto
    };

    actualizarPedidosResina(newPedido);
    handleClose();
  };

  const handleEdit = (pedido) => {
    setCurrentPedido(pedido);
    setFechaCompra(new Date(pedido.fechaCompra));
    setFechaFin(pedido.fechaFin ? new Date(pedido.fechaFin) : null);
    setCantidad(pedido.cantidad.toString());
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setCurrentPedido(null);
    setFechaCompra(null);
    setFechaFin(null);
    setCantidad('');
  };

  const columns = [
    { 
      field: 'fechaCompra', 
      headerName: 'Fecha Compra', 
      type: 'date',
      flex: 1,
      minWidth: 130,
      valueGetter: (params) => {
        return params.value ? new Date(params.value) : null;
      },
      valueFormatter: (params) => {
        if (params.value) {
          return params.value.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        return '';
      }
    },
    { 
      field: 'fechaFin', 
      headerName: 'Fecha Fin', 
      type: 'date',
      flex: 1,
      minWidth: 130,
      valueGetter: (params) => {
        return params.value ? new Date(params.value) : null;
      },
      valueFormatter: (params) => {
        if (params.value) {
          return params.value.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        return 'Pendiente';
      }
    },
    { 
      field: 'cantidad', 
      headerName: 'Cantidad', 
      type: 'number', 
      flex: 1,
      minWidth: 110,
      valueFormatter: (params) => {
        return params.value ? `${params.value} KG` : '';
      },
      headerAlign: 'right',
      align: 'right',
    },
    { 
      field: 'dineroBruto', 
      headerName: 'Dinero Bruto', 
      type: 'number', 
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        if (params.value != null) {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
          }).format(params.value);
        }
        return '';
      },
      headerAlign: 'right',
      align: 'right',
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton 
              onClick={() => handleEdit(params.row)}
              size="small"
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              onClick={() => eliminarPedidoResina(params.row.id)}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const MobileCard = ({ pedido }) => (
    <Card sx={{ mb: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <CardContent>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Fecha Compra
            </Typography>
            <Typography>
              {new Date(pedido.fechaCompra).toLocaleDateString('es-ES')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Fecha Fin
            </Typography>
            <Typography>
              {pedido.fechaFin ? new Date(pedido.fechaFin).toLocaleDateString('es-ES') : 'Pendiente'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Cantidad
            </Typography>
            <Typography>
              {pedido.cantidad} KG
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Dinero Bruto
            </Typography>
            <Typography>
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(pedido.dineroBruto)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <IconButton 
              onClick={() => handleEdit(pedido)}
              size="small"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={() => eliminarPedidoResina(pedido.id)}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ 
          mb: 2,
          alignSelf: 'flex-start',
          px: 3
        }}
      >
        Añadir Pedido
      </Button>

      {isMobile ? (
        <Box sx={{ mt: 2 }}>
          {pedidosResina.map((pedido) => (
            <MobileCard key={pedido.id} pedido={pedido} />
          ))}
        </Box>
      ) : (
        <DataGrid
          rows={pedidosResina}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          getRowId={(row) => row.id}
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        />
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 2 }}>
          {currentPedido ? 'Editar Pedido' : 'Nuevo Pedido'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            pt: 2 
          }}>
            <DatePicker
              label="Fecha Compra"
              value={fechaCompra}
              onChange={setFechaCompra}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              inputFormat="dd/MM/yyyy"
            />
            <DatePicker
              label="Fecha Fin (Opcional)"
              value={fechaFin}
              onChange={setFechaFin}
              renderInput={(params) => <TextField {...params} fullWidth />}
              inputFormat="dd/MM/yyyy"
            />
            <TextField
              label="Cantidad (KG)"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              fullWidth
              InputProps={{
                inputProps: { min: 0, step: 0.1 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth={isMobile}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" fullWidth={isMobile}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PedidosResina; 