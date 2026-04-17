Añade un nuevo endpoint REST siguiendo el patrón del proyecto.

Descripción del endpoint: $ARGUMENTS

Sigue la estructura existente en `src/`:
- Crea o actualiza el controller en `src/controllers/` extendiendo BaseController
- Registra la ruta en `src/routes/` usando el helper `useController`
- Monta la ruta en `src/app.ts` si es un router nuevo
- Tipos de request/response en `src/types/` si son no triviales
- El controller no contiene lógica de negocio — delega al modelo correspondiente

Devuelve los ficheros modificados/creados con el código completo listo para usar.
