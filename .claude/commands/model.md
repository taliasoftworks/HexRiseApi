Crea un nuevo modelo de dominio siguiendo el patrón establecido en el proyecto.

Nombre y descripción: $ARGUMENTS

Sigue la estructura de los modelos existentes en `src/models/`:
- Clase con constructor tipado
- Tipos/enums propios en `src/types/` con su fichero `<nombre>.types.ts`
- Sin dependencias externas ni base de datos — lógica en memoria
- Exporta la clase como named export
- Si necesita generación/configuración, sepáralo en un modelo generator aparte (ver hexagongenerator.model.ts)

Devuelve: el fichero del modelo, el fichero de tipos, y un test unitario básico en `src/test/unit/`.
