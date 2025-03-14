import React from 'react';
import { Button, Box, Stack, useTheme, useMediaQuery } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { getPedidosResina, savePedidosResina, getPedidosFiguras, savePedidosFiguras } from '../utils/storage';

const ImportExport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Si es un número (fecha de Excel), convertir a fecha
    if (typeof dateStr === 'number') {
      // Excel usa un sistema de fechas basado en días desde 1/1/1900
      const excelEpoch = new Date(1900, 0, 1);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      return new Date(excelEpoch.getTime() + (dateStr - 1) * millisecondsPerDay);
    }

    // Si es string, intentar parsear el formato dd/mm/yyyy
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    // Si no se puede parsear, retornar null
    return null;
  };

  const exportToExcel = () => {
    const pedidosResina = getPedidosResina();
    const pedidosFiguras = getPedidosFiguras();

    const wb = XLSX.utils.book_new();

    // Convertir pedidos de resina a worksheet
    const wsPedidosResina = XLSX.utils.json_to_sheet(pedidosResina.map(p => ({
      ...p,
      fechaCompra: p.fechaCompra ? new Date(p.fechaCompra).toLocaleDateString('es-ES') : '',
      fechaFin: p.fechaFin ? new Date(p.fechaFin).toLocaleDateString('es-ES') : '',
    })));
    XLSX.utils.book_append_sheet(wb, wsPedidosResina, "Pedidos Resina");

    // Convertir pedidos de figuras a worksheet
    const wsPedidosFiguras = XLSX.utils.json_to_sheet(pedidosFiguras.map(p => ({
      ...p,
      fecha: p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '',
    })));
    XLSX.utils.book_append_sheet(wb, wsPedidosFiguras, "Pedidos Figuras");

    // Guardar archivo
    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  const importFromExcel = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      try {
        // Importar pedidos de resina
        const sheetResina = workbook.Sheets["Pedidos Resina"];
        if (sheetResina) {
          const pedidosResina = XLSX.utils.sheet_to_json(sheetResina).map(p => ({
            ...p,
            id: p.id || Date.now(),
            fechaCompra: parseDate(p.fechaCompra),
            fechaFin: parseDate(p.fechaFin),
            cantidad: Number(p.cantidad),
            dineroBruto: Number(p.dineroBruto || 0)
          })).filter(p => p.fechaCompra !== null); // Solo guardar pedidos con fecha válida
          savePedidosResina(pedidosResina);
        }

        // Importar pedidos de figuras
        const sheetFiguras = workbook.Sheets["Pedidos Figuras"];
        if (sheetFiguras) {
          const pedidosFiguras = XLSX.utils.sheet_to_json(sheetFiguras).map(p => ({
            ...p,
            id: p.id || Date.now(),
            fecha: parseDate(p.fecha),
            precio: Number(p.precio || 0)
          })).filter(p => p.fecha !== null); // Solo guardar pedidos con fecha válida
          savePedidosFiguras(pedidosFiguras);
        }

        // Recargar la página para mostrar los datos actualizados
        window.location.reload();
      } catch (error) {
        console.error('Error al importar el archivo:', error);
        alert('Error al importar el archivo. Por favor, verifica el formato.');
      }

      // Limpiar input
      event.target.value = null;
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Stack 
      direction={isMobile ? "column" : "row"} 
      spacing={2} 
      justifyContent="center"
      sx={{
        width: '100%',
        '& .MuiButton-root': {
          minWidth: isMobile ? '100%' : '200px',
          py: 1.5,
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          }
        }
      }}
    >
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={exportToExcel}
        color="primary"
        fullWidth={isMobile}
      >
        Exportar a Excel
      </Button>
      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadIcon />}
        color="primary"
        fullWidth={isMobile}
      >
        Importar desde Excel
        <input
          type="file"
          hidden
          accept=".xlsx,.xls"
          onChange={importFromExcel}
        />
      </Button>
    </Stack>
  );
};

export default ImportExport; 