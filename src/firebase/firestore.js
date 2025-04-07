import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './config';

// Nombres de colecciones
const COLLECTIONS = {
  PEDIDOS_RESINA: 'pedidosResina',
  PEDIDOS_FIGURAS: 'pedidosFiguras',
  CLIENTES: 'clientes',
  USUARIOS: 'usuarios'
};

// Funciones para obtener datos
export const obtenerPedidosResina = async (userId) => {
  try {
    // Consulta simplificada sin orderBy
    const q = query(
      collection(db, COLLECTIONS.PEDIDOS_RESINA), 
      where('userId', '==', userId)
      // Eliminamos el orderBy para evitar necesitar índices
    );
    const snapshot = await getDocs(q);
    
    // Convertir datos y ordenar en el cliente
    const pedidos = snapshot.docs.map(doc => {
      // Siempre usamos el ID del documento, no el campo id del documento
      const data = doc.data();
      return {
        ...data,
        id: doc.id, // Sobrescribir cualquier campo id que pueda existir en el documento
        fechaCompra: data.fechaCompra?.toDate(),
        fechaFin: data.fechaFin?.toDate()
      };
    });
    
    // Ordenar por fechaCompra (descendente)
    return pedidos.sort((a, b) => {
      if (!a.fechaCompra) return 1;
      if (!b.fechaCompra) return -1;
      return b.fechaCompra - a.fechaCompra;
    });
  } catch (error) {
    console.error('Error al obtener pedidos de resina:', error);
    return [];
  }
};

export const obtenerPedidosFiguras = async (userId) => {
  try {
    // Consulta simplificada sin orderBy
    const q = query(
      collection(db, COLLECTIONS.PEDIDOS_FIGURAS), 
      where('userId', '==', userId)
      // Eliminamos el orderBy para evitar necesitar índices
    );
    const snapshot = await getDocs(q);
    
    // Convertir datos y ordenar en el cliente
    const pedidos = snapshot.docs.map(doc => {
      // Siempre usamos el ID del documento, no el campo id del documento
      const data = doc.data();
      return {
        ...data,
        id: doc.id, // Sobrescribir cualquier campo id que pueda existir en el documento
        fecha: data.fecha?.toDate()
      };
    });
    
    // Ordenar por fecha (descendente)
    return pedidos.sort((a, b) => {
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return b.fecha - a.fecha;
    });
  } catch (error) {
    console.error('Error al obtener pedidos de figuras:', error);
    return [];
  }
};

export const obtenerClientes = async (userId) => {
  try {
    // Consulta simplificada sin orderBy
    const q = query(
      collection(db, COLLECTIONS.CLIENTES), 
      where('userId', '==', userId)
      // Eliminamos el orderBy para evitar necesitar índices
    );
    const snapshot = await getDocs(q);
    
    // Convertir datos y ordenar en el cliente
    const clientes = snapshot.docs.map(doc => {
      // Siempre usamos el ID del documento, no el campo id del documento
      const data = doc.data();
      return {
        ...data,
        id: doc.id // Sobrescribir cualquier campo id que pueda existir en el documento
      };
    });
    
    // Ordenar por nombre (ascendente)
    return clientes.sort((a, b) => {
      if (!a.nombre) return 1;
      if (!b.nombre) return -1;
      return a.nombre.localeCompare(b.nombre);
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
};

// Funciones para guardar datos
export const guardarPedidoResina = async (pedido, userId) => {
  try {
    // Convertir fechas a timestamp
    const pedidoParaGuardar = {
      ...pedido,
      userId,
      fechaCompra: pedido.fechaCompra,
      fechaFin: pedido.fechaFin || null
    };
    
    // Remover el id del objeto a guardar si es null o undefined
    if (!pedido.id || pedido.id === null) {
      delete pedidoParaGuardar.id;
      // Crear nuevo documento con ID generado por Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.PEDIDOS_RESINA), pedidoParaGuardar);
      return { ...pedido, id: docRef.id }; // Devolver con el nuevo ID
    } else if (typeof pedido.id === 'string' && pedido.id.length > 10) {
      // Actualizar documento existente
      const docRef = doc(db, COLLECTIONS.PEDIDOS_RESINA, pedido.id);
      await updateDoc(docRef, pedidoParaGuardar);
      return { ...pedido, id: pedido.id };
    } else {
      // Si el ID no es válido, crear un nuevo documento
      delete pedidoParaGuardar.id;
      const docRef = await addDoc(collection(db, COLLECTIONS.PEDIDOS_RESINA), pedidoParaGuardar);
      return { ...pedido, id: docRef.id }; // Devolver con el nuevo ID
    }
  } catch (error) {
    console.error('Error al guardar pedido de resina:', error);
    throw error;
  }
};

export const guardarPedidosFiguras = async (pedidos, userId) => {
  try {
    // Guardar cada pedido individualmente
    const resultados = await Promise.all(
      pedidos.map(async (pedido) => {
        const pedidoParaGuardar = {
          ...pedido,
          userId,
          fecha: pedido.fecha
        };
        
        if (pedido.id && typeof pedido.id === 'string' && pedido.id.length > 10) {
          // Actualizar documento existente
          const docRef = doc(db, COLLECTIONS.PEDIDOS_FIGURAS, pedido.id);
          await updateDoc(docRef, pedidoParaGuardar);
          return { ...pedido, id: pedido.id };
        } else {
          // Crear nuevo documento
          const docRef = await addDoc(collection(db, COLLECTIONS.PEDIDOS_FIGURAS), pedidoParaGuardar);
          return { ...pedido, id: docRef.id };
        }
      })
    );
    
    return resultados;
  } catch (error) {
    console.error('Error al guardar pedidos de figuras:', error);
    throw error;
  }
};

export const guardarPedidoFigura = async (pedido, userId) => {
  try {
    const pedidoParaGuardar = {
      ...pedido,
      userId,
      fecha: pedido.fecha
    };
    
    // Remover el id del objeto a guardar si es null o undefined
    if (!pedido.id || pedido.id === null) {
      delete pedidoParaGuardar.id;
      // Crear nuevo documento con ID generado por Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.PEDIDOS_FIGURAS), pedidoParaGuardar);
      return { ...pedido, id: docRef.id }; // Devolver con el nuevo ID
    } else if (typeof pedido.id === 'string' && pedido.id.length > 10) {
      // Actualizar documento existente
      const docRef = doc(db, COLLECTIONS.PEDIDOS_FIGURAS, pedido.id);
      await updateDoc(docRef, pedidoParaGuardar);
      return { ...pedido, id: pedido.id };
    } else {
      // Si el ID no es válido, crear un nuevo documento
      delete pedidoParaGuardar.id;
      const docRef = await addDoc(collection(db, COLLECTIONS.PEDIDOS_FIGURAS), pedidoParaGuardar);
      return { ...pedido, id: docRef.id }; // Devolver con el nuevo ID
    }
  } catch (error) {
    console.error('Error al guardar pedido de figura:', error);
    throw error;
  }
};

export const guardarClientes = async (clientes, userId) => {
  try {
    // Guardar cada cliente individualmente
    const resultados = await Promise.all(
      clientes.map(async (cliente) => {
        const clienteParaGuardar = {
          ...cliente,
          userId
        };
        
        if (cliente.id && typeof cliente.id === 'string' && cliente.id.length > 10) {
          // Actualizar documento existente
          const docRef = doc(db, COLLECTIONS.CLIENTES, cliente.id);
          await updateDoc(docRef, clienteParaGuardar);
          return { ...cliente, id: cliente.id };
        } else {
          // Crear nuevo documento
          const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTES), clienteParaGuardar);
          return { ...cliente, id: docRef.id };
        }
      })
    );
    
    return resultados;
  } catch (error) {
    console.error('Error al guardar clientes:', error);
    throw error;
  }
};

export const guardarCliente = async (cliente, userId) => {
  try {
    const clienteParaGuardar = {
      ...cliente,
      userId
    };
    
    // Remover el id del objeto a guardar si es null o undefined
    if (!cliente.id || cliente.id === null) {
      delete clienteParaGuardar.id;
      // Crear nuevo documento con ID generado por Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTES), clienteParaGuardar);
      return { ...cliente, id: docRef.id }; // Devolver con el nuevo ID
    } else if (typeof cliente.id === 'string' && cliente.id.length > 10) {
      // Actualizar documento existente
      const docRef = doc(db, COLLECTIONS.CLIENTES, cliente.id);
      await updateDoc(docRef, clienteParaGuardar);
      return { ...cliente, id: cliente.id };
    } else {
      // Si el ID no es válido, crear un nuevo documento
      delete clienteParaGuardar.id;
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTES), clienteParaGuardar);
      return { ...cliente, id: docRef.id }; // Devolver con el nuevo ID
    }
  } catch (error) {
    console.error('Error al guardar cliente:', error);
    throw error;
  }
};

export const eliminarPedidoResina = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PEDIDOS_RESINA, id));
    return true;
  } catch (error) {
    console.error('Error al eliminar pedido de resina:', error);
    return false;
  }
};

export const eliminarPedidoFigura = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PEDIDOS_FIGURAS, id));
    return true;
  } catch (error) {
    console.error('Error al eliminar pedido de figura:', error);
    return false;
  }
};

export const eliminarCliente = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLIENTES, id));
    return true;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return false;
  }
}; 