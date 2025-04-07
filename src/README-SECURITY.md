# Seguridad en la aplicación

## Manejo de claves de API y secretos

Para mejorar la seguridad de la aplicación, se han implementado las siguientes medidas:

1. **Variables de entorno**: Todas las claves de API y secretos se almacenan en variables de entorno en un archivo `.env`.

2. **Archivo .gitignore**: El archivo `.env` está incluido en `.gitignore` para evitar que se suban secretos al repositorio.

3. **Archivo de ejemplo**: Se proporciona un archivo `.env.example` con los nombres de las variables necesarias pero sin valores reales.

## Configuración de entorno

Para configurar la aplicación correctamente:

1. Crea un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example`.
2. Rellena las variables con tus propias credenciales de Firebase.
3. Nunca compartas o subas el archivo `.env` a repositorios públicos.

## Rotación de secretos

Si sospechas que las claves se han filtrado:

1. Accede a la consola de Firebase.
2. Regenera las claves API necesarias.
3. Actualiza las nuevas claves en tu archivo `.env` local.

## Seguridad de Firebase

Las claves API de Firebase por sí solas tienen limitaciones de seguridad:

- Están restringidas por reglas de seguridad en Firestore/Auth.
- Deberías configurar restricciones de dominio en la consola de Firebase.
- El control de acceso real se maneja con la autenticación de usuarios y reglas de seguridad.

## Consejos adicionales

- Mantén siempre actualizadas las dependencias del proyecto.
- Utiliza autenticación adecuada para todas las operaciones de Firebase.
- Implementa reglas de seguridad estrictas en Firestore.
- Considera usar servicios como Firebase App Check para mayor seguridad.
