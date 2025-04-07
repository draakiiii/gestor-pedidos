import React, { useState, useEffect } from 'react';
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
  Stack,
  MenuItem,
  Chip,
  InputAdornment,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { usePedidos } from '../context/PedidosContext';
import { calcularDineroBrutoPedidoResina } from '../utils/storage';

const ESTADOS = [
  { codigo: 'P', nombre: 'Pendiente', color: '#ff9800' }, // Naranja
  { codigo: 'E', nombre: 'Entregado', color: '#4caf50' }, // Verde
  { codigo: 'C', nombre: 'Cancelado', color: '#f44336' }, // Rojo
];

const PedidosResina = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pedidosResina, actualizarPedidosResina, eliminarPedidoResina, pedidosFiguras } = usePedidos();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [dineroBruto, setDineroBruto] = useState('');
  const [coste, setCoste] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaCompra, setFechaCompra] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  // Calcular el dinero bruto automáticamente cuando cambian las fechas
  useEffect(() => {
    if (fechaCompra) {
      const pedidoTemp = {
        fechaCompra,
        fechaFin
      };
      const dineroBrutoCalculado = calcularDineroBrutoPedidoResina(pedidoTemp, pedidosFiguras);
      setDineroBruto(dineroBrutoCalculado.toString());
    }
  }, [fechaCompra, fechaFin, pedidosFiguras]);

  const handleSave = () => {
    if (!cantidad || !estado || !fechaCompra) return;

    // Recalculamos el dinero bruto justo antes de guardar
    const dineroBrutoFinal = calcularDineroBrutoPedidoResina({ fechaCompra, fechaFin }, pedidosFiguras);
    
    const newPedido = {
      id: currentPedido?.id || Date.now(),
      cantidad: Number(cantidad),
      dineroBruto: dineroBrutoFinal,
      coste: Number(coste || 0),
      estado,
      fechaCompra,
      fechaFin: fechaFin,
    };

    actualizarPedidosResina(newPedido);
    handleClose();
  };

  const handleEdit = (pedido) => {
    setCurrentPedido(pedido);
    setCantidad(pedido.cantidad.toString());
    // No establecemos dineroBruto aquí, se calculará automáticamente
    setCoste(pedido.coste ? pedido.coste.toString() : '0');
    setEstado(pedido.estado);
    setFechaCompra(pedido.fechaCompra ? new Date(pedido.fechaCompra) : null);
    setFechaFin(pedido.fechaFin ? new Date(pedido.fechaFin) : null);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setCurrentPedido(null);
    setCantidad('');
    setDineroBruto('');
    setCoste('');
    setEstado('');
    setFechaCompra(null);
    setFechaFin(null);
  };

  const getEstadoChip = (codigoEstado) => {
    const estadoData = ESTADOS.find(e => e.codigo === codigoEstado);
    if (estadoData) {
      return (
        <Chip
          label={estadoData.nombre}
          size="small"
          sx={{ backgroundColor: estadoData.color, color: 'white' }}
        />
      );
    }
    return <Chip label={codigoEstado || 'N/A'} size="small" />;
  };

  const columns = [
    {
      field: 'fechaCompra',
      headerName: 'F. Compra',
      type: 'date',
      flex: 1,
      minWidth: 110,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '',
    },
    {
      field: 'fechaFin',
      headerName: 'F. Fin',
      type: 'date',
      flex: 1,
      minWidth: 110,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '',
    },
    {
      field: 'cantidad',
      headerName: 'Cantidad',
      type: 'number',
      flex: 0.5,
      minWidth: 80,
      headerAlign: 'right',
      align: 'right',
    },
    {
      field: 'dineroBruto',
      headerName: 'Ing. Bruto',
      type: 'number',
      flex: 1,
      minWidth: 110,
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
      field: 'coste',
      headerName: 'Coste',
      type: 'number',
      flex: 1,
      minWidth: 100,
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
      field: 'beneficioNeto',
      headerName: 'Benef. Neto',
      type: 'number',
      flex: 1,
      minWidth: 110,
      valueGetter: (params) => {
        const bruto = params.row.dineroBruto || 0;
        const coste = params.row.coste || 0;
        return bruto - coste;
      },
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
      field: 'estado',
      headerName: 'Estado',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => getEstadoChip(params.value),
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton onClick={() => handleEdit(params.row)} size="small" sx={{ mr: 1 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton onClick={() => eliminarPedidoResina(params.row.id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const MobileCard = ({ pedido }) => {
    const beneficioNeto = (pedido.dineroBruto || 0) - (pedido.coste || 0);
    const estadoData = ESTADOS.find(e => e.codigo === pedido.estado) || { nombre: 'Desconocido', color: '#757575' };
    
    return (
      <Card 
        sx={{ 
          mb: 2, 
          boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Box 
          sx={{ 
            p: 0.5, 
            backgroundColor: estadoData.color,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
            {estadoData.nombre}
          </Typography>
        </Box>
        <CardContent sx={{ pt: 2, pb: 1 }}>
          <Grid container spacing={1.5}>
            {/* Fechas */}
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Fecha Compra
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {pedido.fechaCompra ? new Date(pedido.fechaCompra).toLocaleDateString('es-ES') : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Fecha Fin
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {pedido.fechaFin ? new Date(pedido.fechaFin).toLocaleDateString('es-ES') : '-'}
              </Typography>
            </Grid>
            
            {/* Datos económicos */}
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Cantidad
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {pedido.cantidad}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Ingresos Brutos
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(pedido.dineroBruto || 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Coste
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(pedido.coste || 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Beneficio Neto
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: beneficioNeto > 0 ? 'success.main' : beneficioNeto < 0 ? 'error.main' : 'text.primary'
                }}
              >
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(beneficioNeto)}
              </Typography>
            </Grid>
          </Grid>
          
          {/* Acciones */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 1, 
            mt: 1.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            pt: 1
          }}>
            <Button 
              variant="outlined"
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => handleEdit(pedido)}
            >
              Editar
            </Button>
            <Button 
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => eliminarPedidoResina(pedido.id)}
            >
              Eliminar
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: 'auto', minHeight: isMobile ? 'auto' : 600 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2, alignSelf: 'flex-start', px: 3 }}
      >
        Añadir Pedido Resina
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
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          disableSelectionOnClick
          getRowId={(row) => row.id}
          autoHeight
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto !important',
              minHeight: 500
            },
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
        <DialogTitle>
          {currentPedido ? 'Editar Pedido Resina' : 'Nuevo Pedido Resina'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <DatePicker
              label="Fecha Compra"
              value={fechaCompra}
              onChange={(newValue) => setFechaCompra(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="dense"
                  required
                  sx={{ mb: 2 }}
                />
              )}
            />

            <DatePicker
              label="Fecha Fin (opcional)"
              value={fechaFin}
              onChange={(newValue) => setFechaFin(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="dense"
                  sx={{ mb: 2 }}
                />
              )}
            />

            <TextField
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              fullWidth
              margin="dense"
              required
              InputProps={{
                inputProps: { min: 0 }
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Dinero Bruto (€)"
              type="number"
              value={dineroBruto}
              fullWidth
              margin="dense"
              required
              disabled={true}
              InputProps={{
                inputProps: { min: 0, step: 0.01 },
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title="El valor se calcula automáticamente sumando todos los pedidos de figuras entre las fechas seleccionadas. Se actualiza en tiempo real cuando cambias las fechas o cuando hay cambios en los pedidos de figuras.">
                      <InfoIcon color="primary" fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Coste (€)"
              type="number"
              value={coste}
              onChange={(e) => setCoste(e.target.value)}
              fullWidth
              margin="dense"
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              select
              label="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              fullWidth
              margin="dense"
              required
              sx={{ mb: 2 }}
            >
              {ESTADOS.map((opcion) => (
                <MenuItem key={opcion.codigo} value={opcion.codigo}>
                  {opcion.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PedidosResina; 