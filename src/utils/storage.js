// Claves para localStorage
const STORAGE_KEYS = {
  PEDIDOS_RESINA: 'pedidosResina',
  PEDIDOS_FIGURAS: 'pedidosFiguras',
  CLIENTES: 'clientes',
};

// Funciones para manejar pedidos de resina
export const getPedidosResina = () => {
  const pedidos = localStorage.getItem(STORAGE_KEYS.PEDIDOS_RESINA);
  console.log('Leyendo pedidos de resina:', pedidos);
  return pedidos ? JSON.parse(pedidos) : [];
};

export const savePedidosResina = (pedidos) => {
  // Convertir las fechas a formato ISO para almacenamiento
  const pedidosParaGuardar = pedidos.map(p => ({
    ...p,
    fechaCompra: p.fechaCompra instanceof Date ? p.fechaCompra.toISOString() : p.fechaCompra,
    fechaFin: p.fechaFin instanceof Date ? p.fechaFin.toISOString() : p.fechaFin
  }));
  console.log('Guardando pedidos de resina:', pedidosParaGuardar);
  localStorage.setItem(STORAGE_KEYS.PEDIDOS_RESINA, JSON.stringify(pedidosParaGuardar));
};

// Funciones para manejar pedidos de figuras
export const getPedidosFiguras = () => {
  const pedidos = localStorage.getItem(STORAGE_KEYS.PEDIDOS_FIGURAS);
  return pedidos ? JSON.parse(pedidos) : [];
};

export const savePedidosFiguras = (pedidos) => {
  // Convertir las fechas a formato ISO para almacenamiento
  const pedidosParaGuardar = pedidos.map(p => ({
    ...p,
    fecha: p.fecha instanceof Date ? p.fecha.toISOString() : p.fecha
  }));
  localStorage.setItem(STORAGE_KEYS.PEDIDOS_FIGURAS, JSON.stringify(pedidosParaGuardar));
};

// Funciones para gestionar clientes
export const getClientes = () => {
  const clientes = localStorage.getItem(STORAGE_KEYS.CLIENTES);
  return clientes ? JSON.parse(clientes) : [];
};

export const saveClientes = (clientes) => {
  localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
};

// Función para calcular el dinero bruto entre fechas
export const calcularDineroBruto = (fechaInicio, fechaFin, pedidosFiguras) => {
  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date(); // Si no hay fecha fin, usamos la fecha actual
  
  return pedidosFiguras
    .filter(pedido => {
      const fechaPedido = new Date(pedido.fecha);
      // Si no hay fecha fin, tomamos todos los pedidos a partir de la fecha inicio
      return fechaFin 
        ? (fechaPedido >= inicio && fechaPedido <= fin)
        : (fechaPedido >= inicio);
    })
    .reduce((total, pedido) => total + Number(pedido.precio || 0), 0);
};

// Función para calcular automáticamente el dinero bruto de un pedido de resina
export const calcularDineroBrutoPedidoResina = (pedido, pedidosFiguras) => {
  if (!pedido || !pedido.fechaCompra) return 0;
  
  return calcularDineroBruto(
    pedido.fechaCompra,
    pedido.fechaFin,
    pedidosFiguras
  );
}; 