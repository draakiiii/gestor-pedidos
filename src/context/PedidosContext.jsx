import React, { createContext, useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { 
  obtenerPedidosResina, 
  obtenerPedidosFiguras, 
  obtenerClientes,
  guardarPedidoResina,
  guardarPedidoFigura,
  guardarCliente,
  eliminarPedidoResina,
  eliminarPedidoFigura,
  eliminarCliente as eliminarClienteFirestore
} from '../firebase/firestore';
import { calcularDineroBruto } from '../utils/storage'; // Mantenemos esta función de utilidad

export const PedidosContext = createContext();

export const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidos debe ser usado dentro de un PedidosProvider');
  }
  return context;
};

export const PedidosProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [pedidosResina, setPedidosResina] = useState([]);
  const [pedidosFiguras, setPedidosFiguras] = useState([]);
  const [gananciasMensuales, setGananciasMensuales] = useState({});
  const [clientes, setClientes] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' }); // success, error, warning, info

  // Function to show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Function to close snackbar
  const closeSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Cargar datos cuando cambia el usuario autenticado
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !currentUser) {
        setPedidosResina([]);
        setPedidosFiguras([]);
        setClientes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Obtener datos de Firestore para el usuario actual
        const userId = currentUser.uid;
        
        const [pedidosResinaData, pedidosFigurasData, clientesData] = await Promise.all([
          obtenerPedidosResina(userId),
          obtenerPedidosFiguras(userId),
          obtenerClientes(userId)
        ]);

        // Las funciones de obtenerX ya aseguran que los documentos tengan IDs correctos
        // asignados desde el ID del documento de Firestore, así que ya no necesitamos filtrar
        setPedidosResina(pedidosResinaData);
        setPedidosFiguras(pedidosFigurasData);
        
        // Detectar y fusionar clientes duplicados
        const clientesUnicos = fusionarClientesDuplicados(clientesData);
        setClientes(clientesUnicos);
        
        // Si se encontraron duplicados, actualizar en Firestore
        if (clientesUnicos.length < clientesData.length) {
          showSnackbar('Se han detectado y fusionado clientes duplicados', 'info');
          
          // Eliminar clientes duplicados
          const clientesIds = new Set(clientesUnicos.map(c => c.id));
          const clientesDuplicados = clientesData.filter(c => !clientesIds.has(c.id));
          
          for (const cliente of clientesDuplicados) {
            try {
              await eliminarClienteFirestore(cliente.id);
              console.log(`Cliente duplicado eliminado: ${cliente.nombre} (ID: ${cliente.id})`);
            } catch (err) {
              console.error(`Error al eliminar cliente duplicado: ${cliente.nombre}`, err);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showSnackbar('Error al cargar los datos. Inténtelo de nuevo.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, isAuthenticated]);

  // Función para fusionar clientes duplicados
  const fusionarClientesDuplicados = (clientesData) => {
    const clientesPorNombre = {};
    const clientesUnicos = [];
    
    // Agrupar clientes por nombre normalizado
    for (const cliente of clientesData) {
      if (!cliente.nombre) continue;
      
      const nombreNormalizado = cliente.nombre.trim().toLowerCase();
      if (!clientesPorNombre[nombreNormalizado]) {
        clientesPorNombre[nombreNormalizado] = [];
      }
      clientesPorNombre[nombreNormalizado].push(cliente);
    }
    
    // Para cada grupo de clientes con el mismo nombre, quedarnos con el más completo
    for (const nombreNormalizado in clientesPorNombre) {
      const clientesConMismoNombre = clientesPorNombre[nombreNormalizado];
      
      if (clientesConMismoNombre.length === 1) {
        // Si solo hay uno, lo añadimos directamente
        clientesUnicos.push(clientesConMismoNombre[0]);
      } else {
        // Si hay varios, fusionamos la información
        // Nos quedamos con el cliente que tenga más campos rellenados
        let clienteMasCompleto = clientesConMismoNombre[0];
        
        for (let i = 1; i < clientesConMismoNombre.length; i++) {
          const cliente = clientesConMismoNombre[i];
          
          // Quedarnos con el email, teléfono y dirección no vacíos
          if (cliente.email && !clienteMasCompleto.email) clienteMasCompleto.email = cliente.email;
          if (cliente.telefono && !clienteMasCompleto.telefono) clienteMasCompleto.telefono = cliente.telefono;
          if (cliente.direccion && !clienteMasCompleto.direccion) clienteMasCompleto.direccion = cliente.direccion;
        }
        
        clientesUnicos.push(clienteMasCompleto);
      }
    }
    
    return clientesUnicos;
  };

  // Recalcular ganancias mensuales cuando cambian CUALQUIERA de los pedidos
  useEffect(() => {
    const calcularGanancias = () => {
      const ganancias = {};

      // Ganancias de Figuras Entregadas
      pedidosFiguras
        .filter(pedido => pedido.entregado && pedido.fecha instanceof Date && !isNaN(pedido.fecha))
        .forEach(pedido => {
          try {
            const mesAnio = format(pedido.fecha, 'yyyy-MM');
            if (!ganancias[mesAnio]) {
              ganancias[mesAnio] = 0;
            }
            ganancias[mesAnio] += Number(pedido.precio) || 0;
          } catch (error) {
            console.error("Error al formatear fecha (figuras) para ganancias:", pedido.fecha, error);
          }
        });

      // Ganancias (Beneficio Neto) de Resina Entregados
      pedidosResina
        .filter(pedido => pedido.estado === 'E' && pedido.fechaFin instanceof Date && !isNaN(pedido.fechaFin))
        .forEach(pedido => {
          try {
            const mesAnio = format(pedido.fechaFin, 'yyyy-MM');
            const beneficioNeto = (Number(pedido.dineroBruto) || 0) - (Number(pedido.coste) || 0);
            if (!ganancias[mesAnio]) {
              ganancias[mesAnio] = 0;
            }
            ganancias[mesAnio] += beneficioNeto;
          } catch (error) {
            console.error("Error al formatear fechaFin (resina) para ganancias:", pedido.fechaFin, error);
          }
        });

      setGananciasMensuales(ganancias);
    };

    calcularGanancias();
  }, [pedidosResina, pedidosFiguras]);

  // Funciones para calcular automáticamente el dinero bruto de un pedido de resina
  const calcularDineroBrutoPedidoResina = (pedido, pedidosFiguras) => {
    if (!pedido || !pedido.fechaCompra) return 0;
    
    return calcularDineroBruto(
      pedido.fechaCompra,
      pedido.fechaFin,
      pedidosFiguras
    );
  };

  // Recalcular automáticamente el dinero bruto de todos los pedidos de resina cuando cambian los pedidos de figuras
  useEffect(() => {
    // Solo proceder si hay pedidos de resina y pedidos de figuras
    if (pedidosResina.length === 0 || pedidosFiguras.length === 0 || !isAuthenticated) return;

    // Recalcular dinero bruto para cada pedido de resina
    const pedidosActualizados = pedidosResina.map(pedido => {
      // Calculamos el nuevo dinero bruto
      const nuevoDineroBruto = calcularDineroBrutoPedidoResina(pedido, pedidosFiguras);
      
      // Si ha cambiado el dinero bruto, actualizamos el pedido
      if (nuevoDineroBruto !== pedido.dineroBruto) {
        return {
          ...pedido,
          dineroBruto: nuevoDineroBruto
        };
      }
      
      // Si no ha cambiado, devolvemos el pedido original
      return pedido;
    });

    // Verificar si hay cambios en algún pedido
    const hayActualizaciones = pedidosActualizados.some(
      (pedido, index) => pedido.dineroBruto !== pedidosResina[index].dineroBruto
    );

    // Si hay cambios, actualizamos el estado y guardamos en Firestore
    if (hayActualizaciones && currentUser) {
      setPedidosResina(pedidosActualizados);
      
      // Actualizar en Firestore
      pedidosActualizados.forEach(async (pedido) => {
        if (pedido.dineroBruto !== pedidosResina.find(p => p.id === pedido.id)?.dineroBruto) {
          try {
            await guardarPedidoResina(pedido, currentUser.uid);
          } catch (error) {
            console.error('Error al actualizar pedido en Firestore:', error);
          }
        }
      });
      
      showSnackbar('Se han actualizado automáticamente los ingresos brutos de los pedidos de resina', 'info');
    }
  }, [pedidosFiguras, currentUser, isAuthenticated]);

  const actualizarPedidosResina = async (nuevoPedido) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return;
    }

    try {
      const pedidoProcesado = {
        id: nuevoPedido.id || Date.now().toString(),
        fechaCompra: nuevoPedido.fechaCompra instanceof Date ?
          nuevoPedido.fechaCompra : new Date(nuevoPedido.fechaCompra),
        fechaFin: nuevoPedido.fechaFin ?
          (nuevoPedido.fechaFin instanceof Date ? nuevoPedido.fechaFin : new Date(nuevoPedido.fechaFin))
          : null,
        cantidad: Number(nuevoPedido.cantidad || 0),
        dineroBruto: Number(nuevoPedido.dineroBruto || 0),
        coste: Number(nuevoPedido.coste || 0),
        estado: nuevoPedido.estado || 'P',
      };

      // Guardar en Firestore
      const pedidoGuardado = await guardarPedidoResina(pedidoProcesado, currentUser.uid);

      // Actualizar estado local
      const index = pedidosResina.findIndex(p => p.id === pedidoGuardado.id);
      if (index !== -1) {
        const newPedidos = [
          ...pedidosResina.slice(0, index),
          pedidoGuardado,
          ...pedidosResina.slice(index + 1)
        ];
        setPedidosResina(newPedidos);
      } else {
        setPedidosResina([...pedidosResina, pedidoGuardado]);
      }

      // Mostrar notificación
      const action = index !== -1 ? 'actualizado' : 'añadido';
      showSnackbar(`Pedido de resina ${action} correctamente.`, 'success');
    } catch (error) {
      console.error('Error al actualizar pedido de resina:', error);
      showSnackbar('Error al guardar el pedido de resina', 'error');
    }
  };

  const actualizarPedidosFiguras = async (nuevoPedido) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return;
    }

    try {
      // Si hay comprador pero no clienteId, intentamos encontrar o crear el cliente
      if (nuevoPedido.comprador && !nuevoPedido.clienteId) {
        // Normalizar el nombre del comprador
        const nombreComprador = nuevoPedido.comprador.trim();
        
        if (nombreComprador) {
          // Buscar si ya existe un cliente con este nombre
          const clienteExistente = clientes.find(c => 
            c.nombre && c.nombre.trim().toLowerCase() === nombreComprador.toLowerCase()
          );
          
          if (clienteExistente) {
            // Si existe, vinculamos el pedido con este cliente
            console.log(`Cliente existente encontrado para "${nombreComprador}": ${clienteExistente.id}`);
            nuevoPedido.clienteId = clienteExistente.id;
          } else {
            // Si no existe, creamos un nuevo cliente silenciosamente
            const nuevoCliente = await actualizarCliente({
              nombre: nombreComprador,
              showNotification: false // No mostrar notificación para esta creación automática
            });
            
            if (nuevoCliente) {
              nuevoPedido.clienteId = nuevoCliente.id;
              console.log(`Nuevo cliente creado para "${nombreComprador}": ${nuevoCliente.id}`);
            }
          }
        }
      }

      const pedidoProcesado = {
        ...nuevoPedido,
        id: nuevoPedido.id || Date.now().toString(),
        fecha: nuevoPedido.fecha instanceof Date ?
          nuevoPedido.fecha : new Date(nuevoPedido.fecha),
        precio: Number(nuevoPedido.precio || 0),
        entregado: typeof nuevoPedido.entregado === 'boolean' ? nuevoPedido.entregado : false
      };

      // Guardar en Firestore
      const pedidoGuardado = await guardarPedidoFigura(pedidoProcesado, currentUser.uid);

      // Actualizar estado local
      const index = pedidosFiguras.findIndex(p => p.id === pedidoGuardado.id);
      if (index !== -1) {
        const newPedidos = [
          ...pedidosFiguras.slice(0, index),
          pedidoGuardado,
          ...pedidosFiguras.slice(index + 1)
        ];
        setPedidosFiguras(newPedidos);
      } else {
        setPedidosFiguras([...pedidosFiguras, pedidoGuardado]);
      }

      // Mostrar notificación
      const action = index !== -1 ? 'actualizado' : 'añadido';
      showSnackbar(`Pedido de figura "${pedidoGuardado.figura}" ${action} correctamente.`, 'success');
    } catch (error) {
      console.error('Error al actualizar pedido de figura:', error);
      showSnackbar('Error al guardar el pedido de figura', 'error');
    }
  };

  const eliminarPedidoResina = async (id) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return;
    }

    try {
      // Eliminar de Firestore
      const result = await eliminarPedidoResina(id);
      
      if (result) {
        // Actualizar estado local
        const newPedidos = pedidosResina.filter(p => p.id !== id);
        setPedidosResina(newPedidos);
        showSnackbar('Pedido de resina eliminado correctamente.', 'success');
      } else {
        showSnackbar('No se pudo eliminar el pedido de resina.', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar pedido de resina:', error);
      showSnackbar('Error al eliminar el pedido de resina', 'error');
    }
  };

  const eliminarPedidoFigura = async (id) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return;
    }

    try {
      const pedidoEliminado = pedidosFiguras.find(p => p.id === id);
      
      // Eliminar de Firestore
      const result = await eliminarPedidoFigura(id);
      
      if (result) {
        // Actualizar estado local
        const newPedidos = pedidosFiguras.filter(p => p.id !== id);
        setPedidosFiguras(newPedidos);
        
        if (pedidoEliminado) {
          showSnackbar(`Pedido de figura "${pedidoEliminado.figura}" eliminado correctamente.`, 'success');
        } else {
          showSnackbar('Pedido de figura eliminado correctamente.', 'success');
        }
      } else {
        showSnackbar('No se pudo eliminar el pedido de figura.', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar pedido de figura:', error);
      showSnackbar('Error al eliminar el pedido de figura', 'error');
    }
  };

  // Funciones para gestionar clientes
  const actualizarCliente = async (nuevoCliente) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return null;
    }

    try {
      const clienteProcesado = {
        id: nuevoCliente.id || null,
        nombre: nuevoCliente.nombre ? nuevoCliente.nombre.trim() : '',
        email: nuevoCliente.email || '',
        telefono: nuevoCliente.telefono || '',
        direccion: nuevoCliente.direccion || ''
      };

      // Si el nombre está vacío, mostrar error
      if (!clienteProcesado.nombre) {
        showSnackbar('El nombre del cliente no puede estar vacío', 'error');
        return null;
      }

      // Verificar si ya existe un cliente con el mismo nombre (mejorado)
      // Buscar duplicados sin importar si tiene ID o no
      const nombreNormalizado = clienteProcesado.nombre.toLowerCase();
      const clienteExistente = clientes.find(c => 
        c.nombre && c.nombre.trim().toLowerCase() === nombreNormalizado && c.id !== clienteProcesado.id
      );
      
      if (clienteExistente) {
        console.log(`Cliente con nombre "${clienteProcesado.nombre}" ya existe (ID: ${clienteExistente.id}), se usa el existente`);
        
        // Si estamos intentando actualizar datos de contacto, actualizamos el cliente existente
        if (
          (clienteProcesado.email && clienteProcesado.email !== clienteExistente.email) ||
          (clienteProcesado.telefono && clienteProcesado.telefono !== clienteExistente.telefono) ||
          (clienteProcesado.direccion && clienteProcesado.direccion !== clienteExistente.direccion)
        ) {
          // Usar el ID del cliente existente pero actualizar sus datos
          return actualizarCliente({
            ...clienteExistente,
            email: clienteProcesado.email || clienteExistente.email,
            telefono: clienteProcesado.telefono || clienteExistente.telefono,
            direccion: clienteProcesado.direccion || clienteExistente.direccion,
            showNotification: nuevoCliente.showNotification
          });
        }
        
        // Si no hay datos nuevos para actualizar, simplemente devolver el existente
        return clienteExistente;
      }

      // Guardar en Firestore con límite de reintentos
      let intentos = 0;
      const maxIntentos = 2;
      let clienteGuardado = null;
      
      while (intentos < maxIntentos && !clienteGuardado) {
        try {
          intentos++;
          clienteGuardado = await guardarCliente(clienteProcesado, currentUser.uid);
        } catch (err) {
          console.warn(`Intento ${intentos}/${maxIntentos} falló al guardar cliente:`, err);
          if (intentos >= maxIntentos) throw err;
          // Pequeña pausa antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!clienteGuardado) {
        throw new Error('No se pudo guardar el cliente después de varios intentos');
      }

      // Actualizar estado local
      const index = clientes.findIndex(c => c.id === clienteGuardado.id);
      if (index !== -1) {
        const nuevosClientes = [
          ...clientes.slice(0, index),
          clienteGuardado,
          ...clientes.slice(index + 1)
        ];
        setClientes(nuevosClientes);
      } else {
        setClientes([...clientes, clienteGuardado]);
      }

      // Mostrar notificación solo si es una operación manual (no auto-creación)
      if (nuevoCliente.showNotification !== false) {
        const action = index !== -1 ? 'actualizado' : 'añadido';
        showSnackbar(`Cliente ${clienteGuardado.nombre} ${action} correctamente.`, 'success');
      }
      
      return clienteGuardado;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      if (nuevoCliente.showNotification !== false) {
        showSnackbar('Error al guardar el cliente', 'error');
      }
      return null;
    }
  };

  const eliminarCliente = async (id) => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return;
    }

    try {
      const clienteEliminado = clientes.find(c => c.id === id);
      
      // Eliminar de Firestore
      const result = await eliminarClienteFirestore(id);
      
      if (result) {
        // Actualizar estado local
        const nuevosClientes = clientes.filter(c => c.id !== id);
        setClientes(nuevosClientes);
        
        if (clienteEliminado) {
          showSnackbar(`Cliente ${clienteEliminado.nombre} eliminado correctamente.`, 'success');
        } else {
          showSnackbar('Cliente eliminado correctamente.', 'success');
        }
      } else {
        showSnackbar('No se pudo eliminar el cliente.', 'error');
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      showSnackbar('Error al eliminar el cliente', 'error');
    }
  };

  // Función para obtener los pedidos de figuras de un cliente
  const getPedidosByCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return [];
    
    // Normalizar el nombre del cliente para buscar coincidencias
    const nombreClienteNormalizado = cliente.nombre ? cliente.nombre.trim().toLowerCase() : '';
    
    return pedidosFiguras.filter(pedido => 
      // Buscar por clienteId si está disponible
      (pedido.clienteId && pedido.clienteId === clienteId) ||
      // O por nombre si coincide (normalizado)
      (pedido.comprador && pedido.comprador.trim().toLowerCase() === nombreClienteNormalizado)
    );
  };

  // Función que permite limpiar clientes duplicados manualmente
  const limpiarClientesDuplicados = async () => {
    if (!isAuthenticated || !currentUser) {
      showSnackbar('Debes iniciar sesión para realizar esta acción', 'error');
      return false;
    }
    
    try {
      setLoading(true);
      
      // Fusionar clientes duplicados
      const clientesUnicos = fusionarClientesDuplicados([...clientes]);
      
      // Si no hay duplicados, terminar
      if (clientesUnicos.length === clientes.length) {
        showSnackbar('No se encontraron clientes duplicados', 'info');
        return true;
      }
      
      // Guardar los clientes fusionados
      const clientesIds = new Set(clientesUnicos.map(c => c.id));
      const clientesDuplicados = clientes.filter(c => !clientesIds.has(c.id));
      
      // Eliminar los duplicados
      let eliminados = 0;
      for (const cliente of clientesDuplicados) {
        try {
          await eliminarClienteFirestore(cliente.id);
          eliminados++;
        } catch (err) {
          console.error(`Error al eliminar cliente duplicado: ${cliente.nombre}`, err);
        }
      }
      
      // Actualizar clientes en el state
      setClientes(clientesUnicos);
      
      // Actualizar los pedidos para que usen el ID correcto de cliente
      let pedidosActualizados = 0;
      const pedidosFigurasActualizados = [...pedidosFiguras];
      
      for (const cliente of clientesUnicos) {
        // Nombre normalizado para comparar
        const nombreNormalizado = cliente.nombre.trim().toLowerCase();
        
        // Buscar pedidos que deberían estar asociados a este cliente
        for (let i = 0; i < pedidosFigurasActualizados.length; i++) {
          const pedido = pedidosFigurasActualizados[i];
          
          if (
            (pedido.comprador && pedido.comprador.trim().toLowerCase() === nombreNormalizado) && 
            (!pedido.clienteId || !clientesIds.has(pedido.clienteId))
          ) {
            // Actualizar la referencia al cliente
            pedidosFigurasActualizados[i] = {
              ...pedido,
              clienteId: cliente.id
            };
            
            // Guardar en Firestore
            await guardarPedidoFigura(pedidosFigurasActualizados[i], currentUser.uid);
            pedidosActualizados++;
          }
        }
      }
      
      // Actualizar el estado de los pedidos
      if (pedidosActualizados > 0) {
        setPedidosFiguras(pedidosFigurasActualizados);
      }
      
      showSnackbar(`Se han fusionado ${clientesDuplicados.length} clientes duplicados y actualizado ${pedidosActualizados} pedidos`, 'success');
      return true;
    } catch (error) {
      console.error('Error al limpiar clientes duplicados:', error);
      showSnackbar('Error al limpiar clientes duplicados', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PedidosContext.Provider value={{
      pedidosResina,
      pedidosFiguras,
      gananciasMensuales,
      clientes,
      loading,
      actualizarPedidosResina,
      actualizarPedidosFiguras,
      eliminarPedidoResina,
      eliminarPedidoFigura,
      actualizarCliente,
      eliminarCliente,
      getPedidosByCliente,
      limpiarClientesDuplicados,
      // Snackbar related values
      snackbar,          // The state object { open, message, severity }
      showSnackbar,      // Function to trigger the snackbar
      closeSnackbar      // Function to close it (passed to Snackbar component)
    }}>
      {children}
    </PedidosContext.Provider>
  );
}; 