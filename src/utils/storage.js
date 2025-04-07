// Las siguientes funciones son mantenidas solo para compatibilidad, 
// pero el almacenamiento real ahora se hace con Firebase

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

// Estas funciones ya no se usan pero se mantienen para evitar errores en caso de que algo las siga llamando
export const getPedidosResina = () => {
  console.warn('getPedidosResina desde localStorage está obsoleto, usar Firebase');
  return [];
};

export const savePedidosResina = (pedidos) => {
  console.warn('savePedidosResina a localStorage está obsoleto, usar Firebase');
  return false;
};

export const getPedidosFiguras = () => {
  console.warn('getPedidosFiguras desde localStorage está obsoleto, usar Firebase');
  return [];
};

export const savePedidosFiguras = (pedidos) => {
  console.warn('savePedidosFiguras a localStorage está obsoleto, usar Firebase');
  return false;
};

export const getClientes = () => {
  console.warn('getClientes desde localStorage está obsoleto, usar Firebase');
  return [];
};

export const saveClientes = (clientes) => {
  console.warn('saveClientes a localStorage está obsoleto, usar Firebase');
  return false;
}; 