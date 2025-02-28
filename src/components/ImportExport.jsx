import React from 'react';
import { Button, Box, Stack } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { getPedidosResina, savePedidosResina, getPedidosFiguras, savePedidosFiguras } from '../utils/storage';

const ImportExport = () => {
  const exportToExcel = () => {
    const pedidosResina = getPedidosResina();
    const pedidosFiguras = getPedidosFiguras();

    const wb = XLSX.utils.book_new();

    // Convertir pedidos de resina a worksheet
    const wsPedidosResina = XLSX.utils.json_to_sheet(pedidosResina.map(p => ({
      ...p,
      fechaCompra: new Date(p.fechaCompra).toLocaleDateString(),
      fechaFin: new Date(p.fechaFin).toLocaleDateString(),
    })));
    XLSX.utils.book_append_sheet(wb, wsPedidosResina, "Pedidos Resina");

    // Convertir pedidos de figuras a worksheet
    const wsPedidosFiguras = XLSX.utils.json_to_sheet(pedidosFiguras.map(p => ({
      ...p,
      fecha: new Date(p.fecha).toLocaleDateString(),
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

      // Importar pedidos de resina
      const sheetResina = workbook.Sheets["Pedidos Resina"];
      if (sheetResina) {
        const pedidosResina = XLSX.utils.sheet_to_json(sheetResina).map(p => ({
          ...p,
          fechaCompra: new Date(p.fechaCompra),
          fechaFin: new Date(p.fechaFin),
          cantidad: Number(p.cantidad),
          dineroBruto: Number(p.dineroBruto),
          id: p.id || Date.now()
        }));
        savePedidosResina(pedidosResina);
      }

      // Importar pedidos de figuras
      const sheetFiguras = workbook.Sheets["Pedidos Figuras"];
      if (sheetFiguras) {
        const pedidosFiguras = XLSX.utils.sheet_to_json(sheetFiguras).map(p => ({
          ...p,
          fecha: new Date(p.fecha),
          precio: Number(p.precio),
          id: p.id || Date.now()
        }));
        savePedidosFiguras(pedidosFiguras);
      }

      // Limpiar input
      event.target.value = null;
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Stack 
      direction="row" 
      spacing={2} 
      justifyContent="center"
      sx={{
        '& .MuiButton-root': {
          minWidth: '200px',
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
      >
        Exportar a Excel
      </Button>
      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadIcon />}
        color="primary"
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