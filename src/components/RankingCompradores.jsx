import React, { useContext } from 'react';
import { PedidosContext } from '../context/PedidosContext';
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
} from '@mui/material';
import { deepOrange, deepPurple, green, blue, red, amber, cyan } from '@mui/material/colors';

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

// Helper to get consistent avatar colors based on name
const stringToColor = (string) => {
  let hash = 0;
  let i;
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

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const RankingCompradores = () => {
  const { pedidosFiguras } = useContext(PedidosContext);

  // Calculate spending per buyer
  const gastoPorComprador = pedidosFiguras.reduce((acc, pedido) => {
    const comprador = pedido.comprador ? pedido.comprador.trim() : null;
    const precio = Number(pedido.precio) || 0;

    if (comprador && precio > 0) { // Only consider orders with a buyer and price
      if (!acc[comprador]) {
        acc[comprador] = { totalGastado: 0, nombre: comprador };
      }
      acc[comprador].totalGastado += precio;
    }
    return acc;
  }, {});

  // Convert to array and sort
  const ranking = Object.values(gastoPorComprador)
    .sort((a, b) => b.totalGastado - a.totalGastado);

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Ranking de Compradores (Figuras)</Typography>
      {ranking.length === 0 ? (
        <Typography>No hay datos de compradores todavía.</Typography>
      ) : (
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {ranking.map((comprador, index) => (
            <React.Fragment key={comprador.nombre}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: stringToColor(comprador.nombre), width: 32, height: 32, fontSize: '0.875rem' }}>
                    {getInitials(comprador.nombre)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={comprador.nombre}
                  secondary={formatCurrency(comprador.totalGastado)}
                  primaryTypographyProps={{ fontWeight: '500' }}
                />
              </ListItem>
              {index < ranking.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RankingCompradores; 