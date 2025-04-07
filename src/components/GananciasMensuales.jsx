import React, { useContext } from 'react';
import { PedidosContext } from '../context/PedidosContext';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Box,
  Divider 
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GananciasMensuales = () => {
  const { gananciasMensuales } = useContext(PedidosContext);

  // Ordenar los meses cronológicamente (de más reciente a más antiguo)
  const mesesOrdenados = Object.keys(gananciasMensuales)
    .map(mes => new Date(mes + '-01T00:00:00')) // Convertir 'YYYY-MM' a Date
    .sort((a, b) => b - a); // Ordenar descendente

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, height: '100%', border: '1px solid rgba(0,0,0,0.05)' }}>
      <Typography variant="h6" gutterBottom>
        Ganancias Mensuales (Pedidos Entregados)
      </Typography>
      {mesesOrdenados.length === 0 ? (
        <Typography>No hay datos de ganancias todavía.</Typography>
      ) : (
        <List dense>
          {mesesOrdenados.map((fechaMes) => {
            const mesKey = format(fechaMes, 'yyyy-MM');
            const nombreMes = format(fechaMes, 'MMMM yyyy', { locale: es });
            const ganancia = gananciasMensuales[mesKey];
            
            return (
              <React.Fragment key={mesKey}>
                <ListItem>
                  <ListItemText 
                    primary={nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} 
                    secondary={`${ganancia.toFixed(2)} €`} 
                    primaryTypographyProps={{ fontWeight: '500' }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default GananciasMensuales;