import React, { useContext } from 'react';
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
  useMediaQuery,
  Snackbar,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import PedidosResina from './components/PedidosResina';
import PedidosFiguras from './components/PedidosFiguras';
import ImportExport from './components/ImportExport';
import GananciasMensuales from './components/GananciasMensuales';
import Dashboard from './components/Dashboard';
import RankingCompradores from './components/RankingCompradores';
import ListaClientes from './components/ListaClientes';
import AuthForm from './components/AuthForm';
import MigracionDatos from './components/MigracionDatos';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PedidosProvider, PedidosContext } from './context/PedidosContext';

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
      fontSize: {
        xs: '1.5rem',
        sm: '2rem',
        md: '2.125rem',
      },
    },
    h6: {
      fontWeight: 500,
      color: '#1976d2',
      marginBottom: '1rem',
      fontSize: {
        xs: '1.1rem',
        sm: '1.25rem',
      },
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: {
            xs: 8,
            sm: 12,
          },
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
          width: {
            xs: 'auto',
            sm: 'auto',
          },
          padding: {
            xs: '8px 16px',
            sm: '8px 22px',
          },
          minHeight: {
            xs: '40px',
            sm: '40px',
          },
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
            padding: {
              xs: '10px 6px',
              sm: '16px 8px',
            },
            fontSize: {
              xs: '0.875rem',
              sm: '1rem',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: 'none',
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: {
              xs: '300px',
              sm: '400px',
            },
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: {
            xs: '14px',
            sm: '16px 24px',
          },
          '&:last-child': {
            paddingBottom: {
              xs: '14px',
              sm: '24px',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '8px',
          // Mejorando tamaño para táctiles
          '@media (pointer: coarse)': {
            padding: '10px',
            minWidth: '44px',
            minHeight: '44px',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <CssBaseline />
        <AuthProvider>
          <PedidosProvider>
            <AppContent />
          </PedidosProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

// Componente principal para el contenido de la aplicación
const AppContent = () => {
  const { currentUser, isAuthenticated, logout, loading: authLoading } = useAuth();
  const { loading: pedidosLoading, snackbar, closeSnackbar } = useContext(PedidosContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Manejar cierre de sesión
  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      console.error('Error al cerrar sesión:', result.error);
    }
  };
  
  // Mostrar spinner mientras se carga la autenticación
  if (authLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">Cargando...</Typography>
      </Box>
    );
  }
  
  // Si no está autenticado, mostrar formulario de inicio de sesión
  if (!isAuthenticated) {
    return <AuthForm />;
  }
  
  // Si está autenticado, mostrar la aplicación
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      pb: { xs: 2, sm: 4 }
    }}>
      <AppBar position="static" elevation={0} sx={{ mb: { xs: 2, sm: 4 }, backgroundColor: '#fff' }}>
        <Toolbar sx={{ flexDirection: { xs: 'column', sm: 'row' }, py: { xs: 2, sm: 1 } }}>
          
          {/* Información del usuario y botón de logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {currentUser?.email}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              size="small"
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Componente de migración de datos */}
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2, md: 3, lg: 4 } }}>
        <MigracionDatos />
      </Container>

      {/* Mostrar spinner mientras se cargan los pedidos */}
      {pedidosLoading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 100px)',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={50} />
          <Typography variant="h6">Cargando datos...</Typography>
        </Box>
      ) : (
        <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2, md: 3, lg: 4 } }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 3, sm: 4 }
          }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 },
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <ImportExport />
              </Box>
            </Paper>

            <Dashboard />

            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 },
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Grid container spacing={{ xs: 3, sm: 4 }}>
                <Grid item xs={12} lg={6} xl={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 2, sm: 3 },
                      height: '100%',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: { xs: 1.5, sm: 2 }
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        mb: { xs: 2, sm: 3 },
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        pb: 1
                      }}
                    >
                      Pedidos de Resina
                    </Typography>
                    <PedidosResina />
                  </Paper>
                </Grid>
                <Grid item xs={12} lg={6} xl={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 2, sm: 3 },
                      height: '100%',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: { xs: 1.5, sm: 2 }
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        mb: { xs: 2, sm: 3 },
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        pb: 1
                      }}
                    >
                      Pedidos de Figuras
                    </Typography>
                    <PedidosFiguras />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={6} xl={6}>
                  <RankingCompradores />
                </Grid>
                <Grid item xs={12} md={6} lg={6} xl={6}>
                  <ListaClientes />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      )}

      {/* Snackbar Component */}
      <Snackbar
          open={snackbar.open}
          autoHideDuration={6000} // Hide after 6 seconds
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position
      >
          <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
          </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
