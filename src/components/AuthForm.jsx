import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Stack,
  Alert,
  Link,
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { iniciarSesion, registrarUsuario, restablecerContrasena } from '../firebase/auth';

// Modos del formulario
const MODOS = {
  LOGIN: 'login',
  REGISTRO: 'registro',
  RESET: 'reset'
};

const AuthForm = () => {
  const [modo, setModo] = useState(MODOS.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Cambiar entre modos
  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError(''); // Limpiar errores al cambiar de modo
    setMensaje(''); // Limpiar mensajes al cambiar de modo
  };

  // Validar formulario
  const validarFormulario = () => {
    // Validar email básico
    if (!email || !email.includes('@')) {
      setError('Por favor, introduce un email válido');
      return false;
    }

    // Validar contraseña para login y registro
    if ((modo === MODOS.LOGIN || modo === MODOS.REGISTRO) && !password) {
      setError('Por favor, introduce tu contraseña');
      return false;
    }

    // Validación adicional para registro
    if (modo === MODOS.REGISTRO) {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    
    if (!validarFormulario()) return;
    
    setLoading(true);
    
    try {
      switch (modo) {
        case MODOS.LOGIN:
          const loginResult = await iniciarSesion(email, password);
          if (loginResult.error) {
            setError(traducirErrorFirebase(loginResult.error));
          }
          break;
          
        case MODOS.REGISTRO:
          const registerResult = await registrarUsuario(email, password);
          if (registerResult.error) {
            setError(traducirErrorFirebase(registerResult.error));
          } else {
            setMensaje('¡Registro exitoso! Ya puedes iniciar sesión.');
            // Cambiar al modo login después de un registro exitoso
            setTimeout(() => cambiarModo(MODOS.LOGIN), 2000);
          }
          break;
          
        case MODOS.RESET:
          const resetResult = await restablecerContrasena(email);
          if (resetResult.error) {
            setError(traducirErrorFirebase(resetResult.error));
          } else {
            setMensaje('Se ha enviado un correo para restablecer tu contraseña.');
          }
          break;
          
        default:
          break;
      }
    } catch (err) {
      setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para traducir los mensajes de error de Firebase
  const traducirErrorFirebase = (error) => {
    if (error.includes('user-not-found') || error.includes('wrong-password')) {
      return 'Email o contraseña incorrectos';
    } else if (error.includes('email-already-in-use')) {
      return 'Este email ya está registrado';
    } else if (error.includes('weak-password')) {
      return 'La contraseña es demasiado débil';
    } else if (error.includes('invalid-email')) {
      return 'Email no válido';
    } else if (error.includes('too-many-requests')) {
      return 'Demasiados intentos fallidos. Inténtalo más tarde.';
    }
    return 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
  };

  // Contenido según el modo
  const renderContenido = () => {
    switch (modo) {
      case MODOS.LOGIN:
        return (
          <>
            <Typography variant="h5" align="center" gutterBottom>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
              Accede a tu cuenta para gestionar tus pedidos
            </Typography>
          </>
        );
        
      case MODOS.REGISTRO:
        return (
          <>
            <Typography variant="h5" align="center" gutterBottom>
              Crear Cuenta
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
              Registra una nueva cuenta para gestionar tus pedidos
            </Typography>
          </>
        );
        
      case MODOS.RESET:
        return (
          <>
            <Typography variant="h5" align="center" gutterBottom>
              Restablecer Contraseña
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
              Introduce tu email para recibir un enlace de recuperación
            </Typography>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {modo === MODOS.REGISTRO ? (
            <PersonAddIcon color="primary" sx={{ fontSize: 40 }} />
          ) : (
            <LockOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          )}
        </Box>
        
        {renderContenido()}
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          {modo !== MODOS.RESET && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete={modo === MODOS.LOGIN ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          
          {modo === MODOS.REGISTRO && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Contraseña"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              modo === MODOS.LOGIN
                ? "Iniciar Sesión"
                : modo === MODOS.REGISTRO
                  ? "Registrarse"
                  : "Enviar Email"
            )}
          </Button>
          
          <Stack spacing={1} divider={<Divider flexItem />}>
            {modo === MODOS.LOGIN && (
              <>
                <Typography variant="body2" align="center">
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={() => cambiarModo(MODOS.RESET)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Typography>
                <Typography variant="body2" align="center">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={() => cambiarModo(MODOS.REGISTRO)}
                  >
                    Regístrate
                  </Link>
                </Typography>
              </>
            )}
            
            {(modo === MODOS.REGISTRO || modo === MODOS.RESET) && (
              <Typography variant="body2" align="center">
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={() => cambiarModo(MODOS.LOGIN)}
                >
                  Volver a Iniciar Sesión
                </Link>
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthForm; 