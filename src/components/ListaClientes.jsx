import React, { useState, useMemo } from 'react';
import { usePedidos } from '../context/PedidosContext';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon, Phone as PhoneIcon, Home as HomeIcon } from '@mui/icons-material';

// Helper to get consistent avatar colors based on name
const stringToColor = (string) => {
  let hash = 0;
  let i;
  if (!string) return '#bdbdbd'; // Grey for undefined/null names
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

// Helper to get initials
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (name.length > 0) {
       return name.substring(0, Math.min(2, name.length)).toUpperCase();
    }
    return '?';
}

const ListaClientes = () => {
  const { 
    pedidosFiguras, 
    clientes, 
    actualizarCliente, 
    eliminarCliente,
    getPedidosByCliente,
    showSnackbar
  } = usePedidos();

  // Estados para gestionar clientes
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPedidosDialog, setOpenPedidosDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [clientePedidos, setClientePedidos] = useState([]);
  // Añadir estado para controlar el proceso de auto-creación
  const [autoCreationProcessed, setAutoCreationProcessed] = useState(false);

  // Procesar nombres de compradores y convertirlos a clientes si no existen
  const clientesComprador = useMemo(() => {
    // Si ya hemos procesado la auto-creación o no hay datos cargados, devolver los clientes sin modificar
    if (autoCreationProcessed || !pedidosFiguras || pedidosFiguras.length === 0 || !clientes) {
      return clientes || [];
    }
    
    // Verificar si hay datos válidos para procesar
    if (!Array.isArray(clientes) || !Array.isArray(pedidosFiguras)) {
      console.warn("Datos inválidos para procesar clientes automáticos", { clientes, pedidosFiguras });
      setAutoCreationProcessed(true);
      return clientes || [];
    }
    
    const nombresSet = new Set();
    pedidosFiguras.forEach(pedido => {
      if (pedido && pedido.comprador && typeof pedido.comprador === 'string' && pedido.comprador.trim()) {
        nombresSet.add(pedido.comprador.trim());
      }
    });
    
    // Lista de nombres que hay en pedidos pero no en clientes
    const nombresCompradores = Array.from(nombresSet);
    const nombresNoRegistrados = nombresCompradores.filter(nombre => {
      // Verificar si ya existe un cliente con este nombre (comparación insensible a mayúsculas/minúsculas)
      return !clientes.some(cliente => 
        cliente && cliente.nombre && 
        typeof cliente.nombre === 'string' && 
        cliente.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );
    });
    
    // Crear clientes automáticamente para los nombres no registrados
    if (nombresNoRegistrados.length > 0) {
      console.log(`Creando ${nombresNoRegistrados.length} clientes automáticos:`, nombresNoRegistrados);
      
      // Limitamos la creación a una operación secuencial para evitar problemas
      (async () => {
        try {
          for (const nombre of nombresNoRegistrados) {
            // Crear cliente con bandera especial para mostrar notificación
            await actualizarCliente({
              nombre,
              email: '',
              telefono: '',
              direccion: '',
              showNotification: false // No mostrar notificación para estos clientes automáticos
            });
          }
        } catch (err) {
          console.error("Error al crear clientes automáticos:", err);
        } finally {
          // Marcar como procesado incluso si hay errores
          setAutoCreationProcessed(true);
        }
      })();
    } else {
      // Si no hay nada que crear, también marcamos como procesado
      setAutoCreationProcessed(true);
    }
    
    return clientes;
  }, [pedidosFiguras, clientes, actualizarCliente, autoCreationProcessed]);

  const handleSelectCliente = (cliente) => {
    setSelectedClienteId(cliente.id);
    const pedidos = getPedidosByCliente(cliente.id);
    setClientePedidos(pedidos);
    setOpenPedidosDialog(true);
  };

  const handleOpenEditDialog = (cliente = null) => {
    if (cliente) {
      setFormData({
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || ''
      });
    } else {
      setFormData({
        id: null,
        nombre: '',
        email: '',
        telefono: '',
        direccion: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      id: null,
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    });
  };

  const handleClosePedidosDialog = () => {
    setOpenPedidosDialog(false);
    setSelectedClienteId(null);
    setClientePedidos([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveCliente = () => {
    if (!formData.nombre.trim()) {
      showSnackbar('El nombre del cliente es obligatorio', 'error');
      return;
    }

    actualizarCliente(formData);
    handleCloseDialog();
  };

  const handleDeleteCliente = (id) => {
    eliminarCliente(id);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Clientes</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="small" 
          startIcon={<EditIcon />}
          onClick={() => handleOpenEditDialog()}
        >
          Nuevo
        </Button>
      </Box>

      {clientesComprador.length === 0 ? (
        <Typography>No hay clientes registrados.</Typography>
      ) : (
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {clientesComprador.map((cliente, index) => (
            <React.Fragment key={cliente.id}> 
              <ListItem 
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit" size="small" onClick={() => handleOpenEditDialog(cliente)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteCliente(cliente.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                button
                onClick={() => handleSelectCliente(cliente)}
              > 
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: stringToColor(cliente.nombre), width: 32, height: 32, fontSize: '0.875rem' }}>
                    {getInitials(cliente.nombre)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={cliente.nombre} 
                  secondary={
                    <Box display="flex" gap={1}>
                      {cliente.email && <EmailIcon fontSize="small" sx={{ fontSize: 14 }} />}
                      {cliente.telefono && <PhoneIcon fontSize="small" sx={{ fontSize: 14 }} />}
                      {cliente.direccion && <HomeIcon fontSize="small" sx={{ fontSize: 14 }} />}
                    </Box>
                  }
                />
              </ListItem>
              {index < clientesComprador.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Diálogo para editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="nombre"
                label="Nombre"
                fullWidth
                variant="outlined"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="telefono"
                label="Teléfono"
                fullWidth
                variant="outlined"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="direccion"
                label="Dirección"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={formData.direccion}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveCliente} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para mostrar pedidos del cliente */}
      <Dialog 
        open={openPedidosDialog} 
        onClose={handleClosePedidosDialog} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        {selectedClienteId && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Pedidos de {clientes.find(c => c.id === selectedClienteId)?.nombre || 'Cliente'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    const cliente = clientes.find(c => c.id === selectedClienteId);
                    if (cliente) handleOpenEditDialog(cliente);
                  }}
                >
                  Editar Datos
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Datos de contacto */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>Datos de Contacto</Typography>
                <Grid container spacing={2}>
                  {clientes.find(c => c.id === selectedClienteId)?.email && (
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center">
                        <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>{clientes.find(c => c.id === selectedClienteId)?.email}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {clientes.find(c => c.id === selectedClienteId)?.telefono && (
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>{clientes.find(c => c.id === selectedClienteId)?.telefono}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {clientes.find(c => c.id === selectedClienteId)?.direccion && (
                    <Grid item xs={12} sm={4}>
                      <Box display="flex" alignItems="center">
                        <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography>{clientes.find(c => c.id === selectedClienteId)?.direccion}</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Typography variant="subtitle1" gutterBottom>Pedidos de Figuras</Typography>
              {clientePedidos.length === 0 ? (
                <Typography>No hay pedidos registrados para este cliente.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {clientePedidos.map(pedido => (
                    <Grid item xs={12} sm={6} md={4} key={pedido.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>{pedido.figura}</Typography>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR'
                              }).format(pedido.precio)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip 
                              label={pedido.entregado ? "Entregado" : "Pendiente"} 
                              color={pedido.entregado ? "success" : "warning"} 
                              size="small" 
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePedidosDialog}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default ListaClientes; 