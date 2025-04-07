import React, { useContext, useState } from 'react';
import { Button, Box, Stack, useTheme, useMediaQuery, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { PedidosContext } from '../context/PedidosContext';
import { AuthContext } from '../context/AuthContext';
import { 
  guardarPedidoResina, 
  guardarPedidoFigura, 
  obtenerPedidosResina, 
  obtenerPedidosFiguras 
} from '../firebase/firestore';

const ImportExport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pedidosResina, pedidosFiguras, showSnackbar } = useContext(PedidosContext);
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState({ resina: 0, figuras: 0 });

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
      // Usar los pedidos del contexto (que ya vienen de Firebase)
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

  const handleImportConfirm = async () => {
    setDialogOpen(false);
    setLoading(true);
    
    try {
      // Procesamiento de pedidos de resina
      if (importSummary.resina > 0) {
        let errores = 0;
        
        await Promise.all(
          importSummary.resinaData.map(async (pedido) => {
            try {
              // Los objetos ya no deberían tener campo id
              await guardarPedidoResina(pedido, currentUser.uid);
            } catch (e) {
              console.error(`Error al guardar pedido resina:`, e);
              errores++;
            }
          })
        );
        
        if (errores > 0) {
          showSnackbar(`Se encontraron ${errores} errores al importar resina. Ver consola para detalles.`, 'warning');
        }
      }
      
      // Procesamiento de pedidos de figuras
      if (importSummary.figuras > 0) {
        let errores = 0;
        
        await Promise.all(
          importSummary.figurasData.map(async (pedido) => {
            try {
              // Los objetos ya no deberían tener campo id
              await guardarPedidoFigura(pedido, currentUser.uid);
            } catch (e) {
              console.error(`Error al guardar pedido figura:`, e);
              errores++;
            }
          })
        );
        
        if (errores > 0) {
          showSnackbar(`Se encontraron ${errores} errores al importar figuras. Ver consola para detalles.`, 'warning');
        }
      }
      
      showSnackbar(`Importación completada: ${importSummary.resina} pedidos de resina, ${importSummary.figuras} pedidos de figuras.`, 'success');
      
      // Recargar la página para ver los cambios
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error al guardar datos importados:', error);
      showSnackbar(`Error al guardar datos: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const importFromExcel = (event) => {
    if (!currentUser) {
      showSnackbar('Debes iniciar sesión para importar datos', 'error');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let resinaData = [];
        let figurasData = [];

        // Procesar pedidos de resina
        const sheetResina = workbook.Sheets["Pedidos Resina"];
        if (sheetResina) {
          resinaData = XLSX.utils.sheet_to_json(sheetResina).map(p => ({
            // No incluimos el campo id para que Firestore asigne uno automáticamente
            cantidad: Number(p.cantidad || 0),
            dineroBruto: Number(p.dineroBruto || 0),
            coste: Number(p.coste || 0),
            estado: p.estado || 'P',
            fechaCompra: parseDate(p.fechaCompra),
            fechaFin: parseDate(p.fechaFin),
          })).filter(p => p.cantidad && p.fechaCompra !== null);
        }

        // Procesar pedidos de figuras
        const sheetFiguras = workbook.Sheets["Pedidos Figuras"];
        if (sheetFiguras) {
          figurasData = XLSX.utils.sheet_to_json(sheetFiguras).map(p => ({
            // No incluimos el campo id para que Firestore asigne uno automáticamente
            figura: p.figura,
            precio: Number(p.precio || 0),
            ubicacion: p.ubicacion || '',
            fecha: parseDate(p.fecha),
            comprador: p.comprador || '',
            entregado: typeof p.entregado === 'boolean' ? p.entregado : (p.entregado === 'TRUE' || p.entregado === 'true')
          })).filter(p => p.figura && p.fecha !== null);
        }
        
        // Guardar los datos procesados para usar después de la confirmación
        setImportSummary({
          resina: resinaData.length,
          figuras: figurasData.length,
          resinaData,
          figurasData
        });
        
        // Mostrar diálogo de confirmación
        setDialogOpen(true);

      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        showSnackbar(`Error al importar: ${error.message}. Verifica el formato.`, 'error');
      } finally {
        setLoading(false);
      }

      // Limpiar input
      event.target.value = null;
    };

    reader.onerror = (error) => {
      console.error("Error al leer el archivo:", error);
      showSnackbar('Error al leer el archivo.', 'error');
      event.target.value = null; // Clear input on error too
      setLoading(false);
    }

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
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
          startIcon={loading ? <CircularProgress size={24} /> : <DownloadIcon />}
          onClick={exportToExcel}
          color="primary"
          fullWidth={isMobile}
          disabled={loading || !currentUser}
        >
          Exportar a Excel
        </Button>
        <Button
          variant="outlined"
          component="label"
          startIcon={loading ? <CircularProgress size={24} /> : <UploadIcon />}
          color="primary"
          fullWidth={isMobile}
          disabled={loading || !currentUser}
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
      
      {/* Diálogo de confirmación para importar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirmar Importación</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Se importarán los siguientes datos:
          </Typography>
          <Typography variant="body2">
            • {importSummary.resina} pedidos de resina
          </Typography>
          <Typography variant="body2">
            • {importSummary.figuras} pedidos de figuras
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            ¿Deseas continuar con la importación?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleImportConfirm} color="primary" variant="contained">
            Importar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImportExport; 