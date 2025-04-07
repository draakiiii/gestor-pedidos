import React, { createContext, useState, useContext, useEffect } from 'react';
import { getPedidosResina, savePedidosResina, getPedidosFiguras, savePedidosFiguras, getClientes, saveClientes, calcularDineroBrutoPedidoResina } from '../utils/storage';
import { format } from 'date-fns';

export const PedidosContext = createContext();

export const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidos debe ser usado dentro de un PedidosProvider');
  }
  return context;
};

export const PedidosProvider = ({ children }) => {
  const [pedidosResina, setPedidosResina] = useState([]);
  const [pedidosFiguras, setPedidosFiguras] = useState([]);
  const [gananciasMensuales, setGananciasMensuales] = useState({});
  const [clientes, setClientes] = useState([]); // Estado para los clientes

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

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = () => {
      const pedidosResinaGuardados = getPedidosResina();
      const pedidosFigurasGuardados = getPedidosFiguras();
      const clientesGuardados = getClientes();

      const pedidosResinaConFechas = pedidosResinaGuardados.map(p => ({
        id: p.id || Date.now(),
        fechaCompra: p.fechaCompra ? new Date(p.fechaCompra) : null,
        fechaFin: p.fechaFin ? new Date(p.fechaFin) : null,
        cantidad: Number(p.cantidad || 0),
        dineroBruto: Number(p.dineroBruto || 0),
        coste: Number(p.coste || 0),
        estado: p.estado || 'P',
      })).filter(p => p.fechaCompra instanceof Date && !isNaN(p.fechaCompra));

      const pedidosFigurasConFechas = pedidosFigurasGuardados.map(p => ({
        ...p,
        id: p.id || Date.now(),
        fecha: p.fecha ? new Date(p.fecha) : null,
        precio: Number(p.precio || 0),
        entregado: typeof p.entregado === 'boolean' ? p.entregado : false
      })).filter(p => p.fecha instanceof Date && !isNaN(p.fecha));

      setPedidosResina(pedidosResinaConFechas);
      setPedidosFiguras(pedidosFigurasConFechas);
      setClientes(clientesGuardados || []);
    };

    loadData();
  }, []);

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

  // Recalcular automáticamente el dinero bruto de todos los pedidos de resina cuando cambian los pedidos de figuras
  useEffect(() => {
    // Solo proceder si hay pedidos de resina y pedidos de figuras
    if (pedidosResina.length === 0 || pedidosFiguras.length === 0) return;

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

    // Si hay cambios, actualizamos el estado y guardamos
    if (hayActualizaciones) {
      setPedidosResina(pedidosActualizados);
      savePedidosResina(pedidosActualizados);
      showSnackbar('Se han actualizado automáticamente los ingresos brutos de los pedidos de resina', 'info');
    }
  }, [pedidosFiguras]); // Solo se ejecuta cuando cambian los pedidos de figuras

  const actualizarPedidosResina = (nuevoPedido) => {
    const pedidoProcesado = {
      id: nuevoPedido.id || Date.now(),
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

    const index = pedidosResina.findIndex(p => p.id === pedidoProcesado.id);
    let newPedidos;
    if (index !== -1) {
      newPedidos = [
        ...pedidosResina.slice(0, index),
        pedidoProcesado,
        ...pedidosResina.slice(index + 1)
      ];
    } else {
      newPedidos = [...pedidosResina, pedidoProcesado];
    }

    setPedidosResina(newPedidos);
    savePedidosResina(newPedidos);
    // Add notification on success
    // const action = index !== -1 ? 'actualizado' : 'añadido';
    // showSnackbar(`Pedido de resina ${action}.`, 'success');
  };

  const actualizarPedidosFiguras = (nuevoPedido) => {
    const pedidoProcesado = {
      ...nuevoPedido,
      id: nuevoPedido.id || Date.now(),
      fecha: nuevoPedido.fecha instanceof Date ?
        nuevoPedido.fecha : new Date(nuevoPedido.fecha),
      precio: Number(nuevoPedido.precio || 0),
      entregado: typeof nuevoPedido.entregado === 'boolean' ? nuevoPedido.entregado : false
    };

    const index = pedidosFiguras.findIndex(p => p.id === pedidoProcesado.id);
    let newPedidos;
    if (index !== -1) {
      newPedidos = [
        ...pedidosFiguras.slice(0, index),
        pedidoProcesado,
        ...pedidosFiguras.slice(index + 1)
      ];
    } else {
      newPedidos = [...pedidosFiguras, pedidoProcesado];
    }

    setPedidosFiguras(newPedidos);
    savePedidosFiguras(newPedidos);
    // Add notification on success
    // showSnackbar(`Pedido de figura "${pedidoProcesado.figura}" ${index !== -1 ? 'actualizado' : 'añadido'}.`, 'success');
  };

  const eliminarPedidoResina = (id) => {
    const newPedidos = pedidosResina.filter(p => p.id !== id);
    setPedidosResina(newPedidos);
    savePedidosResina(newPedidos);
    // Add notification on success
    // showSnackbar('Pedido de resina eliminado.', 'info');
  };

  const eliminarPedidoFigura = (id) => {
    const pedidoEliminado = pedidosFiguras.find(p => p.id === id);
    const newPedidos = pedidosFiguras.filter(p => p.id !== id);
    setPedidosFiguras(newPedidos);
    savePedidosFiguras(newPedidos);
    // Add notification on success
    // if (pedidoEliminado) {
    //     showSnackbar(`Pedido de figura "${pedidoEliminado.figura}" eliminado.`, 'info');
    // }
  };

  // Funciones para gestionar clientes
  const actualizarCliente = (nuevoCliente) => {
    const clienteProcesado = {
      id: nuevoCliente.id || Date.now(),
      nombre: nuevoCliente.nombre,
      email: nuevoCliente.email || '',
      telefono: nuevoCliente.telefono || '',
      direccion: nuevoCliente.direccion || ''
    };

    const index = clientes.findIndex(c => c.id === clienteProcesado.id);
    let nuevosClientes;
    
    if (index !== -1) {
      nuevosClientes = [
        ...clientes.slice(0, index),
        clienteProcesado,
        ...clientes.slice(index + 1)
      ];
    } else {
      nuevosClientes = [...clientes, clienteProcesado];
    }

    setClientes(nuevosClientes);
    saveClientes(nuevosClientes);
    showSnackbar(`Cliente ${clienteProcesado.nombre} ${index !== -1 ? 'actualizado' : 'añadido'}.`, 'success');
  };

  const eliminarCliente = (id) => {
    const clienteEliminado = clientes.find(c => c.id === id);
    const nuevosClientes = clientes.filter(c => c.id !== id);
    setClientes(nuevosClientes);
    saveClientes(nuevosClientes);
    
    if (clienteEliminado) {
      showSnackbar(`Cliente ${clienteEliminado.nombre} eliminado.`, 'info');
    }
  };

  // Función para obtener los pedidos de figuras de un cliente
  const getPedidosByCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return [];
    
    return pedidosFiguras.filter(pedido => 
      // Buscar por clienteId si está disponible
      (pedido.clienteId && pedido.clienteId === clienteId) ||
      // O por nombre si coincide
      (pedido.comprador && pedido.comprador.trim().toLowerCase() === cliente.nombre.trim().toLowerCase())
    );
  };

  return (
    <PedidosContext.Provider value={{
      pedidosResina,
      pedidosFiguras,
      gananciasMensuales,
      clientes,
      actualizarPedidosResina,
      actualizarPedidosFiguras,
      eliminarPedidoResina,
      eliminarPedidoFigura,
      actualizarCliente,
      eliminarCliente,
      getPedidosByCliente,
      // Snackbar related values
      snackbar,          // The state object { open, message, severity }
      showSnackbar,      // Function to trigger the snackbar
      closeSnackbar      // Function to close it (passed to Snackbar component)
    }}>
      {children}
    </PedidosContext.Provider>
  );
}; 