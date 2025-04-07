import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

// Helper to format currency for Tooltip
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

// Helper to format Month Name for XAxis
const formatMonth = (mesKey) => {
  try {
    // Input is 'YYYY-MM'
    const date = new Date(`${mesKey}-01T00:00:00`); // Add day/time to parse correctly
    const monthName = format(date, 'MMM yyyy', { locale: es });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  } catch (error) {
    console.error("Error formatting month key:", mesKey, error);
    return mesKey; // Fallback to key
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${formatMonth(label)}`}</p>
        <p style={{ margin: '5px 0 0', color: payload[0].color }}>{`Ganancia: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const GananciasChart = ({ data }) => {
  const theme = useTheme();

  // Prepare data for the chart: [{ mes: 'Ene 2023', Ganancia: 120 }, ...]
  const chartData = Object.entries(data)
    .map(([mesKey, ganancia]) => ({
      mesKey: mesKey, // Keep original key for sorting/tooltip
      mesNombre: formatMonth(mesKey),
      Ganancia: ganancia,
    }))
    .sort((a, b) => {
      // Sort chronologically
      const dateA = new Date(`${a.mesKey}-01T00:00:00`);
      const dateB = new Date(`${b.mesKey}-01T00:00:00`);
      return dateA - dateB;
    });

  if (chartData.length === 0) {
      return <Typography color="text.secondary" align="center" sx={{mt: 4}}>No hay datos suficientes para mostrar el gráfico.</Typography>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 20, // Add some right margin for labels
          left: 10, // Add some left margin for labels
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
            dataKey="mesNombre" 
            tick={{ fontSize: 11 }} // Smaller font size for month labels
            // angle={-30} // Angle labels if they overlap
            // textAnchor="end"
            interval={0} // Show all labels initially, adjust if needed
            height={50} // Increase height if labels are angled
        />
        <YAxis 
            tickFormatter={formatCurrency} 
            tick={{ fontSize: 11 }} // Smaller font size for currency
            width={80} // Adjust width for currency labels
         />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}/>
        {/* <Legend /> */}
        <Bar dataKey="Ganancia" fill={theme.palette.primary.main} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GananciasChart; 