// Importar funciones de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase (reemplazar con tus propias credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyAC4WjcJWKHFLGwRp-42g3rvrtAKJ6rrfI",
  authDomain: "gesti-5ede7.firebaseapp.com",
  projectId: "gesti-5ede7",
  storageBucket: "gesti-5ede7.firebasestorage.app",
  messagingSenderId: "1071371432706",
  appId: "1:1071371432706:web:8f3ec72b1acb96b1e6881b",
  measurementId: "G-JBZ45FMGWK"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app; 