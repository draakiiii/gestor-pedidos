// Claves para localStorage
const STORAGE_KEYS = {
  PEDIDOS_RESINA: 'pedidosResina',
  PEDIDOS_FIGURAS: 'pedidosFiguras',
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

// Función para calcular el dinero bruto entre fechas
export const calcularDineroBruto = (fechaInicio, fechaFin, pedidosFiguras) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  return pedidosFiguras
    .filter(pedido => {
      const fechaPedido = new Date(pedido.fecha);
      return fechaPedido >= inicio && fechaPedido <= fin;
    })
    .reduce((total, pedido) => total + Number(pedido.precio), 0);
}; 