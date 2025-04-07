import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Checkbox,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { usePedidos } from '../context/PedidosContext';

const UBICACIONES = [
  { codigo: 'W', nombre: 'Wallapop' },
  { codigo: 'T', nombre: 'Tienda' },
  { codigo: 'P', nombre: 'Personal' },
  { codigo: 'A', nombre: 'Amigos' }
];

const PedidosFiguras = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pedidosFiguras, actualizarPedidosFiguras, eliminarPedidoFigura, clientes, actualizarCliente } = usePedidos();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [figura, setFigura] = useState('');
  const [precio, setPrecio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [entregado, setEntregado] = useState(false);

  const handleSave = () => {
    if (!figura || !precio || !ubicacion || !fecha) return;

    // Si el cliente seleccionado es un string (nuevo cliente), lo creamos
    let clienteId = null;
    let nombreComprador = "";

    if (clienteSeleccionado) {
      if (typeof clienteSeleccionado === 'string') {
        // Es un nuevo cliente, lo creamos
        const nuevoCliente = {
          nombre: clienteSeleccionado,
          email: '',
          telefono: '',
          direccion: ''
        };
        actualizarCliente(nuevoCliente);
        
        // Intentamos encontrar el cliente recién creado por su nombre
        const clienteCreado = clientes.find(c => c.nombre === clienteSeleccionado);
        if (clienteCreado) {
          clienteId = clienteCreado.id;
          nombreComprador = clienteCreado.nombre;
        } else {
          // Si no lo encontramos (puede pasar por asincronía), usamos solo el nombre
          nombreComprador = clienteSeleccionado;
        }
      } else {
        // Es un cliente existente
        clienteId = clienteSeleccionado.id;
        nombreComprador = clienteSeleccionado.nombre;
      }
    }

    const newPedido = {
      id: currentPedido?.id || Date.now(),
      figura,
      precio: Number(precio),
      ubicacion,
      fecha,
      comprador: nombreComprador,
      clienteId: clienteId, // Guardamos el ID del cliente si existe
      entregado: entregado
    };

    actualizarPedidosFiguras(newPedido);
    handleClose();
  };

  const handleEdit = (pedido) => {
    setCurrentPedido(pedido);
    setFigura(pedido.figura);
    setPrecio(pedido.precio.toString());
    setUbicacion(pedido.ubicacion);
    setFecha(pedido.fecha);
    
    // Buscamos el cliente por ID o por nombre
    const cliente = pedido.clienteId 
      ? clientes.find(c => c.id === pedido.clienteId)
      : clientes.find(c => c.nombre === pedido.comprador);
    
    setClienteSeleccionado(cliente || null);
    setEntregado(pedido.entregado || false);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setCurrentPedido(null);
    setFigura('');
    setPrecio('');
    setUbicacion('');
    setFecha(null);
    setClienteSeleccionado(null);
    setEntregado(false);
  };

  const handleEntregadoChange = (pedido, isChecked) => {
    const pedidoActualizado = {
      ...pedido,
      entregado: isChecked
    };
    actualizarPedidosFiguras(pedidoActualizado);
  };

  const getUbicacionColor = (codigo) => {
    switch (codigo) {
      case 'W':
        return '#4CAF50';
      case 'T':
        return '#2196F3';
      case 'P':
        return '#9C27B0';
      case 'A':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const columns = [
    { 
      field: 'figura', 
      headerName: 'Figura', 
      flex: 2,
      minWidth: 150
    },
    { 
      field: 'precio', 
      headerName: 'Precio', 
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
      field: 'ubicacion', 
      headerName: 'Ubicación', 
      flex: 1,
      minWidth: 110,
      renderCell: (params) => {
        const ubicacion = UBICACIONES.find(u => u.codigo === params.value);
        return (
          <Chip
            label={ubicacion ? ubicacion.nombre : params.value}
            size="small"
            sx={{
              backgroundColor: getUbicacionColor(params.value),
              color: 'white'
            }}
          />
        );
      }
    },
    { 
      field: 'fecha', 
      headerName: 'Fecha', 
      type: 'date', 
      flex: 1,
      minWidth: 110,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        return '';
      }
    },
    {
      field: 'comprador',
      headerName: 'Comprador',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => params.value || 'Sin comprador'
    },
    {
      field: 'entregado',
      headerName: 'Entregado',
      width: 110,
      type: 'boolean',
      renderCell: (params) => (
        <Checkbox
          checked={params.value || false}
          onChange={(event) => handleEntregadoChange(params.row, event.target.checked)}
          size="small"
        />
      ),
      headerAlign: 'center',
      align: 'center',
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
              onClick={() => eliminarPedidoFigura(params.row.id)}
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

  const MobileCard = ({ pedido }) => {
    const ubicacion = UBICACIONES.find(u => u.codigo === pedido.ubicacion);
    
    return (
      <Card sx={{ mb: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" noWrap sx={{ mb: 1 }}>
              {pedido.figura}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Precio
              </Typography>
              <Typography variant="h6" color="primary">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(pedido.precio)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Ubicación
              </Typography>
              <Chip
                label={ubicacion ? ubicacion.nombre : pedido.ubicacion}
                size="small"
                sx={{
                  backgroundColor: getUbicacionColor(pedido.ubicacion),
                  color: 'white'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha
              </Typography>
              <Typography>
                {new Date(pedido.fecha).toLocaleDateString('es-ES')}
              </Typography>
            </Box>
            {pedido.comprador && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Comprador
                </Typography>
                <Typography>
                  {pedido.comprador}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Entregado
              </Typography>
              <Checkbox
                checked={pedido.entregado || false}
                onChange={(event) => handleEntregadoChange(pedido, event.target.checked)}
                size="small"
              />
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
                onClick={() => eliminarPedidoFigura(pedido.id)}
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
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: 'auto',
      minHeight: isMobile ? 'auto' : 600
    }}>
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
        Añadir Figura
      </Button>

      {isMobile ? (
        <Box sx={{ mt: 2 }}>
          {pedidosFiguras.map((pedido) => (
            <MobileCard key={pedido.id} pedido={pedido} />
          ))}
        </Box>
      ) : (
        <DataGrid
          rows={pedidosFiguras}
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
            width: '100%',
            '& .MuiDataGrid-main': {
              width: '100%'
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto !important',
              minHeight: 500
            },
            '& .MuiDataGrid-row': {
              minHeight: '48px !important'
            }
          }}
          initialState={{
            pagination: {
              pageSize: 10,
            },
            columns: {
              columnVisibilityModel: {}
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
        <DialogTitle sx={{ pb: 2 }}>
          {currentPedido ? 'Editar Figura' : 'Nueva Figura'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            pt: 2 
          }}>
            <TextField
              label="Nombre de la Figura"
              value={figura}
              onChange={(e) => setFigura(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Precio (€)"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              fullWidth
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
            />
            <TextField
              select
              label="Ubicación"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              required
              fullWidth
            >
              {UBICACIONES.map((ubi) => (
                <MenuItem key={ubi.codigo} value={ubi.codigo}>
                  {ubi.nombre}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={setFecha}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              inputFormat="dd/MM/yyyy"
            />
            <Autocomplete
              id="cliente-autocomplete"
              options={clientes}
              getOptionLabel={(option) => {
                // Manejar casos cuando option es string (nueva entrada) u objeto (cliente existente)
                return typeof option === 'string' ? option : option.nombre || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof option === 'string' || typeof value === 'string') {
                  return option === value;
                }
                return option.id === value.id;
              }}
              value={clienteSeleccionado}
              onChange={(event, newValue) => {
                setClienteSeleccionado(newValue);
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  variant="outlined"
                  fullWidth
                  margin="dense"
                  sx={{ mb: 2 }}
                />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={entregado}
                  onChange={(e) => setEntregado(e.target.checked)}
                  name="entregado"
                  color="primary"
                />
              }
              label="Pedido Entregado"
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

export default PedidosFiguras; 