import React, { createContext, useState, useContext, useEffect } from 'react';
import { getPedidosResina, savePedidosResina, getPedidosFiguras, savePedidosFiguras, calcularDineroBruto } from '../utils/storage';

const PedidosContext = createContext();

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

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = () => {
      console.log('Cargando datos iniciales...');
      const pedidosResinaGuardados = getPedidosResina();
      const pedidosFigurasGuardados = getPedidosFiguras();

      console.log('Pedidos de resina cargados:', pedidosResinaGuardados);

      const pedidosResinaConFechas = pedidosResinaGuardados.map(p => ({
        ...p,
        id: p.id || Date.now(),
        fechaCompra: new Date(p.fechaCompra),
        fechaFin: p.fechaFin ? new Date(p.fechaFin) : null,
        cantidad: Number(p.cantidad),
        dineroBruto: Number(p.dineroBruto || 0)
      }));

      const pedidosFigurasConFechas = pedidosFigurasGuardados.map(p => ({
        ...p,
        id: p.id || Date.now(),
        fecha: new Date(p.fecha),
        precio: Number(p.precio)
      }));

      console.log('Pedidos de resina procesados:', pedidosResinaConFechas);

      setPedidosResina(pedidosResinaConFechas);
      setPedidosFiguras(pedidosFigurasConFechas);
    };

    loadData();
  }, []);

  // Actualizar dinero bruto cuando cambian los pedidos de figuras
  useEffect(() => {
    const actualizarDineroBruto = () => {
      console.log('Actualizando dinero bruto...');
      const pedidosActualizados = pedidosResina.map(pedido => ({
        ...pedido,
        dineroBruto: calcularDineroBruto(
          pedido.fechaCompra,
          pedido.fechaFin || new Date('2100-01-01'),
          pedidosFiguras
        )
      }));

      console.log('Pedidos actualizados con dinero bruto:', pedidosActualizados);
      setPedidosResina(pedidosActualizados);
      savePedidosResina(pedidosActualizados);
    };

    if (pedidosResina.length > 0) {
      actualizarDineroBruto();
    }
  }, [pedidosFiguras]);

  const actualizarPedidosResina = (nuevoPedido) => {
    console.log('Actualizando pedido de resina:', nuevoPedido);
    
    // Asegurarse de que las fechas sean objetos Date
    const pedidoConFechas = {
      ...nuevoPedido,
      id: nuevoPedido.id || Date.now(),
      fechaCompra: nuevoPedido.fechaCompra instanceof Date ? 
        nuevoPedido.fechaCompra : new Date(nuevoPedido.fechaCompra),
      fechaFin: nuevoPedido.fechaFin ? 
        (nuevoPedido.fechaFin instanceof Date ? nuevoPedido.fechaFin : new Date(nuevoPedido.fechaFin)) 
        : null,
      cantidad: Number(nuevoPedido.cantidad)
    };

    // Calcular dinero bruto
    pedidoConFechas.dineroBruto = calcularDineroBruto(
      pedidoConFechas.fechaCompra,
      pedidoConFechas.fechaFin || new Date('2100-01-01'),
      pedidosFiguras
    );

    console.log('Pedido procesado:', pedidoConFechas);

    // Corregir la lógica de actualización
    const newPedidos = [...pedidosResina];
    const index = newPedidos.findIndex(p => p.id === pedidoConFechas.id);
    
    if (index !== -1) {
      newPedidos[index] = pedidoConFechas;
    } else {
      newPedidos.push(pedidoConFechas);
    }

    console.log('Nueva lista de pedidos:', newPedidos);
    setPedidosResina(newPedidos);
    savePedidosResina(newPedidos);
  };

  const actualizarPedidosFiguras = (nuevoPedido) => {
    const pedidoConFechas = {
      ...nuevoPedido,
      id: nuevoPedido.id || Date.now(),
      fecha: nuevoPedido.fecha instanceof Date ? 
        nuevoPedido.fecha : new Date(nuevoPedido.fecha),
      precio: Number(nuevoPedido.precio)
    };

    // Corregir la lógica de actualización
    const newPedidos = [...pedidosFiguras];
    const index = newPedidos.findIndex(p => p.id === pedidoConFechas.id);
    
    if (index !== -1) {
      newPedidos[index] = pedidoConFechas;
    } else {
      newPedidos.push(pedidoConFechas);
    }

    setPedidosFiguras(newPedidos);
    savePedidosFiguras(newPedidos);
  };

  const eliminarPedidoResina = (id) => {
    console.log('Eliminando pedido de resina:', id);
    const newPedidos = pedidosResina.filter(p => p.id !== id);
    setPedidosResina(newPedidos);
    savePedidosResina(newPedidos);
  };

  const eliminarPedidoFigura = (id) => {
    const newPedidos = pedidosFiguras.filter(p => p.id !== id);
    setPedidosFiguras(newPedidos);
    savePedidosFiguras(newPedidos);
  };

  return (
    <PedidosContext.Provider value={{
      pedidosResina,
      pedidosFiguras,
      actualizarPedidosResina,
      actualizarPedidosFiguras,
      eliminarPedidoResina,
      eliminarPedidoFigura
    }}>
      {children}
    </PedidosContext.Provider>
  );
}; 