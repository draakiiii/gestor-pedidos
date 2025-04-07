# Gestor de Pedidos con Firebase

Esta aplicación permite gestionar pedidos de resina y figuras con almacenamiento en la nube mediante Firebase. Los datos se sincronizan entre dispositivos y se requiere iniciar sesión para acceder a la aplicación.

## Requisitos Previos

- Node.js (versión 14 o superior)
- Npm o Yarn
- Una cuenta de Google para acceder a Firebase

## Configuración de Firebase

Para configurar la aplicación con tu propio proyecto de Firebase, sigue estos pasos:

1. Accede a [Firebase Console](https://console.firebase.google.com/) e inicia sesión con tu cuenta de Google.

2. Haz clic en "Añadir proyecto" y sigue los pasos para crear un nuevo proyecto.

3. Una vez creado el proyecto, haz clic en "Web" (icono </>) para añadir una aplicación web.

4. Ingresa un nombre para tu aplicación y haz clic en "Registrar aplicación".

5. Copia la configuración de Firebase que aparece (objeto `firebaseConfig`).

6. En el proyecto, abre el archivo `src/firebase/config.js` y reemplaza el objeto `firebaseConfig` con tu propia configuración:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

7. En la consola de Firebase, ve a "Authentication" en el menú lateral y habilita el método de autenticación "Correo electrónico/contraseña".

8. Ve a "Firestore Database" en el menú lateral y haz clic en "Crear base de datos". Puedes comenzar en modo de prueba para desarrollo.

9. Para configurar las reglas de seguridad, ve a la pestaña "Reglas" en Firestore y establece las siguientes reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Instalación y Ejecución

1. Clona este repositorio:

```bash
git clone [URL_DEL_REPOSITORIO]
cd gestor-pedidos
```

2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Inicia la aplicación en modo desarrollo:

```bash
npm run dev
# o
yarn dev
```

4. Abre tu navegador en `http://localhost:5173` (o el puerto que indique la consola).

## Migración desde la versión anterior

Si estabas utilizando la versión anterior de la aplicación (que usaba localStorage), puedes migrar tus datos a Firebase siguiendo estos pasos:

1. Exporta tus datos desde la versión anterior usando la función de exportar.

2. Crea una cuenta nueva en la versión con Firebase.

3. Importa tus datos utilizando la función de importar.

## Funcionalidades

- Autenticación de usuarios con email y contraseña
- Gestión de pedidos de resina
- Gestión de pedidos de figuras
- Gestión de clientes
- Cálculo automático de ganancias
- Sincronización de datos entre dispositivos

## Licencia

Este proyecto es software de código abierto bajo la licencia MIT.
