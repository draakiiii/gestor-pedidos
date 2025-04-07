import { 
  guardarPedidoResina, 
  guardarPedidoFigura, 
  guardarCliente 
} from '../firebase/firestore';

// Claves para localStorage (para migración de datos)
const STORAGE_KEYS = {
  PEDIDOS_RESINA: 'pedidosResina',
  PEDIDOS_FIGURAS: 'pedidosFiguras',
  CLIENTES: 'clientes',
};

/**
 * Función que migra los datos de localStorage a Firebase
 * @param {string} userId ID del usuario al que se asignarán los datos
 * @returns {Promise<{resina: number, figuras: number, clientes: number}>} Número de elementos migrados
 */
export const migrarDatosAFirebase = async (userId) => {
  if (!userId) {
    throw new Error('Se requiere el ID de usuario para migrar datos');
  }

  try {
    // Migrar pedidos de resina
    const pedidosResinaStr = localStorage.getItem(STORAGE_KEYS.PEDIDOS_RESINA);
    const pedidosResina = pedidosResinaStr ? JSON.parse(pedidosResinaStr) : [];
    
    let contadorResina = 0;
    for (const pedido of pedidosResina) {
      try {
        const pedidoProcesado = {
          ...pedido,
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          fechaCompra: pedido.fechaCompra ? new Date(pedido.fechaCompra) : null,
          fechaFin: pedido.fechaFin ? new Date(pedido.fechaFin) : null,
          cantidad: Number(pedido.cantidad || 0),
          dineroBruto: Number(pedido.dineroBruto || 0),
          coste: Number(pedido.coste || 0),
          estado: pedido.estado || 'P',
        };
        
        if (pedidoProcesado.fechaCompra) {
          await guardarPedidoResina(pedidoProcesado, userId);
          contadorResina++;
        }
      } catch (error) {
        console.error('Error al migrar pedido de resina:', error);
      }
    }
    
    // Migrar pedidos de figuras
    const pedidosFigurasStr = localStorage.getItem(STORAGE_KEYS.PEDIDOS_FIGURAS);
    const pedidosFiguras = pedidosFigurasStr ? JSON.parse(pedidosFigurasStr) : [];
    
    let contadorFiguras = 0;
    for (const pedido of pedidosFiguras) {
      try {
        const pedidoProcesado = {
          ...pedido,
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          fecha: pedido.fecha ? new Date(pedido.fecha) : null,
          precio: Number(pedido.precio || 0),
          entregado: typeof pedido.entregado === 'boolean' ? pedido.entregado : false
        };
        
        if (pedidoProcesado.fecha && pedidoProcesado.figura) {
          await guardarPedidoFigura(pedidoProcesado, userId);
          contadorFiguras++;
        }
      } catch (error) {
        console.error('Error al migrar pedido de figura:', error);
      }
    }
    
    // Migrar clientes
    const clientesStr = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    const clientes = clientesStr ? JSON.parse(clientesStr) : [];
    
    let contadorClientes = 0;
    for (const cliente of clientes) {
      try {
        const clienteProcesado = {
          ...cliente,
          id: Date.now() + Math.random().toString(36).substring(2, 9), // Nuevo ID para evitar conflictos
          nombre: cliente.nombre || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || ''
        };
        
        if (clienteProcesado.nombre) {
          await guardarCliente(clienteProcesado, userId);
          contadorClientes++;
        }
      } catch (error) {
        console.error('Error al migrar cliente:', error);
      }
    }
    
    return {
      resina: contadorResina,
      figuras: contadorFiguras,
      clientes: contadorClientes
    };
    
  } catch (error) {
    console.error('Error al migrar datos:', error);
    throw error;
  }
};

/**
 * Verifica si hay datos en localStorage para migrar
 * @returns {boolean} true si hay datos para migrar
 */
export const hayDatosParaMigrar = () => {
  const pedidosResinaStr = localStorage.getItem(STORAGE_KEYS.PEDIDOS_RESINA);
  const pedidosFigurasStr = localStorage.getItem(STORAGE_KEYS.PEDIDOS_FIGURAS);
  const clientesStr = localStorage.getItem(STORAGE_KEYS.CLIENTES);
  
  const pedidosResina = pedidosResinaStr ? JSON.parse(pedidosResinaStr) : [];
  const pedidosFiguras = pedidosFigurasStr ? JSON.parse(pedidosFigurasStr) : [];
  const clientes = clientesStr ? JSON.parse(clientesStr) : [];
  
  return pedidosResina.length > 0 || pedidosFiguras.length > 0 || clientes.length > 0;
}; 