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
  Tooltip
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
  const { pedidosFiguras, actualizarPedidosFiguras, eliminarPedidoFigura } = usePedidos();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [figura, setFigura] = useState('');
  const [precio, setPrecio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState(null);
  const [comprador, setComprador] = useState('');

  const handleSave = () => {
    if (!figura || !precio || !ubicacion || !fecha) return;

    const newPedido = {
      id: currentPedido?.id || Date.now(),
      figura,
      precio: Number(precio),
      ubicacion,
      fecha,
      comprador: comprador || null
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
    setComprador(pedido.comprador || '');
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setCurrentPedido(null);
    setFigura('');
    setPrecio('');
    setUbicacion('');
    setFecha(null);
    setComprador('');
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
      valueFormatter: (params) => {
        const ubicacion = UBICACIONES.find(u => u.codigo === params.value);
        return ubicacion ? ubicacion.nombre : params.value;
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

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: 'auto',
      minHeight: 600
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

      <Dialog 
        open={openDialog} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
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
            <TextField
              label="Comprador (Opcional)"
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              fullWidth
              placeholder="Ej: Desiree"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PedidosFiguras; 