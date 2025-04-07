import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  DataObject as DataIcon,
  People as PeopleIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { migrarDatosAFirebase, hayDatosParaMigrar } from '../utils/migracion';
import { useAuth } from '../context/AuthContext';
import { PedidosContext } from '../context/PedidosContext';

const MigracionDatos = () => {
  const { currentUser } = useAuth();
  const { showSnackbar } = useContext(PedidosContext);
  
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultadoMigracion, setResultadoMigracion] = useState(null);
  
  useEffect(() => {
    // Comprobar si hay datos para migrar
    if (currentUser && hayDatosParaMigrar()) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [currentUser]);
  
  const handleMigrarClick = () => {
    setDialogOpen(true);
  };
  
  const handleConfirmarMigracion = async () => {
    setDialogOpen(false);
    setLoading(true);
    
    try {
      const resultado = await migrarDatosAFirebase(currentUser.uid);
      setResultadoMigracion(resultado);
      
      // Mostrar notificación
      showSnackbar(`Migración completada con éxito. Se migrarán ${resultado.resina} pedidos de resina, ${resultado.figuras} pedidos de figuras y ${resultado.clientes} clientes.`, 'success');
      
      // Recargar después de un momento
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error("Error al migrar datos:", error);
      showSnackbar(`Error al migrar datos: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (!visible) return null;
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        mb: 4,
        borderLeft: '4px solid #f57c00',
        backgroundColor: '#fff8e1'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <InfoIcon color="warning" sx={{ mt: 0.5, mr: 2 }} />
        <Box>
          <Typography variant="h6" gutterBottom>
            Datos locales detectados
          </Typography>
          <Typography variant="body2" paragraph>
            Se han detectado datos almacenados localmente en este navegador. 
            Puedes migrarlos a la nube para acceder a ellos desde cualquier dispositivo.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            disabled={loading}
            onClick={handleMigrarClick}
          >
            Migrar datos a la nube
          </Button>
          
          {resultadoMigracion && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Migración completada. Recargando...
            </Alert>
          )}
        </Box>
      </Box>
      
      {/* Diálogo de confirmación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirmar migración de datos</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Se migrarán los siguientes datos a tu cuenta {currentUser?.email}:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <DataIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Pedidos de resina" />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemIcon>
                <CategoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Pedidos de figuras" />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemIcon>
                <PeopleIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Clientes" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            Los datos locales se conservarán después de la migración.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarMigracion} 
            color="primary" 
            variant="contained"
            startIcon={<CloudUploadIcon />}
          >
            Migrar datos
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MigracionDatos; 