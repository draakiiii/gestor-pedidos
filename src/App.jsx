import React from 'react';
import { 
  CssBaseline, 
  Box, 
  Container, 
  ThemeProvider, 
  createTheme,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  useMediaQuery
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import PedidosResina from './components/PedidosResina';
import PedidosFiguras from './components/PedidosFiguras';
import ImportExport from './components/ImportExport';
import { PedidosProvider } from './context/PedidosContext';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    }
  },
  typography: {
    h4: {
      fontWeight: 600,
      color: '#1976d2',
    },
    h6: {
      fontWeight: 500,
      color: '#1976d2',
      marginBottom: '1rem',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          backgroundColor: '#ffffff',
          '& .MuiDataGrid-cell': {
            borderColor: '#f0f0f0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: 'none',
          },
        },
      },
    },
  },
});

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <PedidosProvider>
          <Box sx={{ 
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            pb: 4
          }}>
            <AppBar position="static" elevation={0} sx={{ mb: 4, backgroundColor: '#fff' }}>
              <Toolbar>
                <Typography variant="h4" component="h1" sx={{ 
                  flexGrow: 1,
                  textAlign: 'center',
                  py: 2,
                  color: theme.palette.primary.main
                }}>
                  Gestor de Pedidos de Resina
                </Typography>
              </Toolbar>
            </AppBar>

            <Container maxWidth="xl">
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <ImportExport />
                  </Box>

                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 3,
                          height: '100%',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Pedidos de Resina
                        </Typography>
                        <PedidosResina />
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 3,
                          height: '100%',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Pedidos de Figuras
                        </Typography>
                        <PedidosFiguras />
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Container>
          </Box>
        </PedidosProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
