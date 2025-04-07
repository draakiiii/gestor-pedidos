import React, { useContext } from 'react';
import { PedidosContext } from '../context/PedidosContext';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { format, getMonth, getYear, isSameMonth, isSameYear } from 'date-fns';
import { es } from 'date-fns/locale';
import GananciasChart from './GananciasChart';

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const Dashboard = () => {
  const { pedidosResina, pedidosFiguras, gananciasMensuales } = useContext(PedidosContext);

  // --- Calculate Metrics ---
  const hoy = new Date();
  const mesActual = getMonth(hoy);
  const anioActual = getYear(hoy);

  // Pedidos Counts
  const pedidosPendientesResina = pedidosResina.filter(p => p.estado === 'P').length;
  const pedidosPendientesFiguras = pedidosFiguras.filter(p => !p.entregado).length;
  const totalPendientes = pedidosPendientesResina + pedidosPendientesFiguras;

  const pedidosEntregadosResina = pedidosResina.filter(p => p.estado === 'E').length;
  const pedidosEntregadosFiguras = pedidosFiguras.filter(p => p.entregado).length;
  const totalEntregados = pedidosEntregadosResina + pedidosEntregadosFiguras;

  // Ganancias (using Net Profit from context)
  let ingresosMesActual = 0;
  let ingresosAnioActual = 0;

  Object.entries(gananciasMensuales).forEach(([mesKey, ganancia]) => {
    const [year, month] = mesKey.split('-').map(Number);
    // date-fns months are 0-indexed, keys are 1-indexed
    if (year === anioActual && month === mesActual + 1) {
      ingresosMesActual += ganancia;
    }
    if (year === anioActual) {
      ingresosAnioActual += ganancia;
    }
  });

  // Pedidos Recientes (Combine, Sort, Take top 5)
  // Agrupar pedidos de figuras por fecha y cliente (comprador)
  const pedidosFigurasAgrupados = [];
  const pedidosPorGrupo = {};

  // Agrupar por fecha (yyyy-MM-dd) y comprador
  pedidosFiguras.forEach(pedido => {
    if (!(pedido.fecha instanceof Date) || isNaN(pedido.fecha)) return;
    
    const fechaKey = format(pedido.fecha, 'yyyy-MM-dd');
    const compradorKey = pedido.comprador || 'Sin comprador';
    const grupoKey = `${fechaKey}-${compradorKey}`;
    
    if (!pedidosPorGrupo[grupoKey]) {
      pedidosPorGrupo[grupoKey] = {
        id: grupoKey,
        fechaOrden: pedido.fecha,
        comprador: compradorKey,
        nombreMostrado: `Pedido de ${compradorKey}`,
        items: [],
        valor: 0,
        esEntregado: true // Inicialmente true, se cambiará si alguno no está entregado
      };
      pedidosFigurasAgrupados.push(pedidosPorGrupo[grupoKey]);
    }
    
    pedidosPorGrupo[grupoKey].items.push(pedido);
    pedidosPorGrupo[grupoKey].valor += Number(pedido.precio || 0);
    
    // Si algún pedido no está entregado, el paquete no está entregado
    if (!pedido.entregado) {
      pedidosPorGrupo[grupoKey].esEntregado = false;
    }
  });

  const pedidosRecientes = pedidosFigurasAgrupados
    .sort((a, b) => b.fechaOrden - a.fechaOrden) // Sort descending
    .slice(0, 5); // Take top 5

  // --- Render Component ---
  return (
    <Box sx={{ flexGrow: 1, mb: 4, width: '100%' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'primary.dark', fontWeight: 'bold' }}>
            Resumen General
        </Typography>
      <Grid container spacing={3}>
        {/* Metric Cards */}
        <Grid item xs={6} sm={6} md={3} lg={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">Pendientes</Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{totalPendientes}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3} lg={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">Entregados</Typography>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>{totalEntregados}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3} lg={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">Ingresos Mes</Typography>
             <Typography variant="h4" sx={{ fontWeight: 'bold', color: ingresosMesActual >= 0 ? 'success.dark' : 'error.main' }}>
               {formatCurrency(ingresosMesActual)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3} lg={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">Ingresos Año</Typography>
             <Typography variant="h4" sx={{ fontWeight: 'bold', color: ingresosAnioActual >= 0 ? 'success.dark' : 'error.main' }}>
              {formatCurrency(ingresosAnioActual)}
            </Typography>
          </Paper>
        </Grid>

        {/* Pedidos Recientes List */}
        <Grid item xs={12} md={6} lg={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: 350 }}>
            <Typography variant="h6" gutterBottom>Últimos Pedidos</Typography>
            {pedidosRecientes.length === 0 ? (
              <Typography>No hay pedidos recientes.</Typography>
            ) : (
              <List dense sx={{ maxHeight: 350, overflow: 'auto' }}>
                {pedidosRecientes.map((pedido, index) => (
                  <React.Fragment key={pedido.id || index}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" component="span" sx={{ fontWeight: 500, flexGrow: 1, mr: 1 }} noWrap>
                                {pedido.nombreMostrado}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(pedido.fechaOrden, 'dd/MM/yy')}
                            </Typography>
                          </Box>
                        }
                        secondary={
                           <Typography variant="body2" color="text.primary">
                             {`${pedido.items.length} figuras - Total: ${formatCurrency(pedido.valor)}`}
                             {pedido.esEntregado ? <Chip label="Entregado" size="small" color="success" sx={{ ml: 1, fontSize: '0.7rem' }}/> : <Chip label="Pendiente" size="small" sx={{ ml: 1, fontSize: '0.7rem' }}/>}
                           </Typography>
                        }
                      />
                    </ListItem>
                    {index < pedidosRecientes.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Monthly Earnings Chart */}
        <Grid item xs={12} md={6} lg={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Ganancias Mensuales (Bruto)</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 350 }}>
                 <GananciasChart data={gananciasMensuales} />
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Dashboard; 