import React, { useContext } from 'react';
import { Button, Box, Stack, useTheme, useMediaQuery } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { getPedidosResina, savePedidosResina, getPedidosFiguras, savePedidosFiguras } from '../utils/storage';
import { PedidosContext } from '../context/PedidosContext';

const ImportExport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useContext(PedidosContext);

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
    try {
      const pedidosResina = getPedidosResina();
      const pedidosFiguras = getPedidosFiguras();

      const wb = XLSX.utils.book_new();

      // Convertir pedidos de resina a worksheet
      const wsPedidosResina = XLSX.utils.json_to_sheet(pedidosResina.map(p => ({
        id: p.id,
        cantidad: p.cantidad,
        dineroBruto: p.dineroBruto,
        coste: p.coste,
        estado: p.estado,
        fechaCompra: p.fechaCompra ? new Date(p.fechaCompra).toLocaleDateString('es-ES') : '',
        fechaFin: p.fechaFin ? new Date(p.fechaFin).toLocaleDateString('es-ES') : '',
      })));
      XLSX.utils.book_append_sheet(wb, wsPedidosResina, "Pedidos Resina");

      // Convertir pedidos de figuras a worksheet
      const wsPedidosFiguras = XLSX.utils.json_to_sheet(pedidosFiguras.map(p => ({
        id: p.id,
        figura: p.figura,
        precio: p.precio,
        ubicacion: p.ubicacion,
        fecha: p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '',
        comprador: p.comprador,
        entregado: p.entregado
      })));
      XLSX.utils.book_append_sheet(wb, wsPedidosFiguras, "Pedidos Figuras");

      XLSX.writeFile(wb, "pedidos.xlsx");
      showSnackbar('Datos exportados a pedidos.xlsx con éxito.', 'success');
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      showSnackbar(`Error al exportar: ${error.message}`, 'error');
    }
  };

  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let importedResinaCount = 0;
        let importedFigurasCount = 0;

        // Importar pedidos de resina
        const sheetResina = workbook.Sheets["Pedidos Resina"];
        if (sheetResina) {
          const pedidosResina = XLSX.utils.sheet_to_json(sheetResina).map(p => ({
            id: p.id || Date.now() + Math.random(),
            cantidad: Number(p.cantidad || 0),
            dineroBruto: Number(p.dineroBruto || 0),
            coste: Number(p.coste || 0),
            estado: p.estado || 'P',
            fechaCompra: parseDate(p.fechaCompra),
            fechaFin: parseDate(p.fechaFin),
          })).filter(p => p.cantidad && p.fechaCompra !== null);
          savePedidosResina(pedidosResina);
          importedResinaCount = pedidosResina.length;
        }

        // Importar pedidos de figuras
        const sheetFiguras = workbook.Sheets["Pedidos Figuras"];
        if (sheetFiguras) {
          const pedidosFiguras = XLSX.utils.sheet_to_json(sheetFiguras).map(p => ({
            id: p.id || Date.now() + Math.random(),
            figura: p.figura,
            precio: Number(p.precio || 0),
            ubicacion: p.ubicacion,
            fecha: parseDate(p.fecha),
            comprador: p.comprador,
            entregado: typeof p.entregado === 'boolean' ? p.entregado : (p.entregado === 'TRUE' || p.entregado === 'true')
          })).filter(p => p.figura && p.fecha !== null);
          savePedidosFiguras(pedidosFiguras);
          importedFigurasCount = pedidosFiguras.length;
        }

        // Show success notification and reload
        showSnackbar(`Importación completada: ${importedResinaCount} pedidos de resina, ${importedFigurasCount} pedidos de figuras. Recargando...`, 'success');
        // Reload after a short delay to allow snackbar to be seen
        setTimeout(() => window.location.reload(), 1500);

      } catch (error) {
        console.error('Error al importar el archivo:', error);
        showSnackbar(`Error al importar: ${error.message}. Verifica el formato.`, 'error');
      }

      // Limpiar input
      event.target.value = null;
    };

    reader.onerror = (error) => {
        console.error("Error al leer el archivo:", error);
        showSnackbar('Error al leer el archivo.', 'error');
         event.target.value = null; // Clear input on error too
    }

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