# Sistema de Protección de Mensajes - Colombia Productiva

## Descripción

El sistema ahora incluye un mecanismo de protección que impide la edición de ciertas partes críticas de los mensajes oficiales, manteniendo el formato y la consistencia de la comunicación.

## Partes Protegidas (No Editables)

### Saludos Oficiales
Las siguientes partes están protegidas y no se pueden editar:

- `Estimado/a {nombre_apellidos}`
- `Estimado/a {NOMBRE_APELLIDOS}`
- `Estimado/a {nombre}`
- `Estimado/a {NOMBRE}`

### Propósito de la Protección

1. **Consistencia Oficial**: Mantener el formato estándar de saludo
2. **Personalización Automática**: Los nombres se insertan automáticamente
3. **Prevención de Errores**: Evitar modificaciones accidentales
4. **Cumplimiento Normativo**: Asegurar que se use el formato oficial

## Funcionalidades del Sistema

### 1. Editor Inteligente
- **Modo Visualización**: Muestra las partes protegidas resaltadas en amarillo
- **Modo Edición**: La primera línea se muestra fija, solo se puede editar el resto
- **Botón de Edición**: Acceso controlado al modo de edición

### 2. Vista Previa Mejorada
- **Resaltado Visual**: Las partes protegidas se muestran claramente
- **Leyenda**: Explicación de los colores y significados
- **Personalización**: Muestra cómo se verá con datos reales

### 3. Validación Automática
- **Detección**: Identifica automáticamente las partes protegidas
- **Preservación**: Mantiene las partes protegidas intactas
- **Feedback**: Informa al usuario sobre las restricciones

## Cómo Funciona

### 1. Selección de Plantilla
```
1. Usuario selecciona una plantilla
2. El sistema carga el mensaje con partes protegidas
3. Se muestran las partes protegidas resaltadas
```

### 2. Edición Controlada
```
1. Usuario hace clic en "Editar"
2. La primera línea (saludo) se muestra como fija y no editable
3. Solo se puede editar el resto del mensaje
4. Al guardar, se preserva la primera línea intacta
```

### 3. Vista Previa
```
1. Se muestra el mensaje con partes protegidas resaltadas
2. Se personaliza con datos del contacto
3. Se indica claramente qué partes son automáticas
```

## Configuración

### Agregar Nuevas Partes Protegidas

Para agregar nuevas partes protegidas, edita el archivo `src/lib/message-templates.ts`:

```typescript
export const READ_ONLY_PARTS = [
  'Estimado/a {nombre_apellidos}',
  'Estimado/a {NOMBRE_APELLIDOS}',
  'Estimado/a {nombre}',
  'Estimado/a {NOMBRE}',
  // Agregar nuevas partes aquí
  'Nueva parte protegida'
];
```

### Personalización de Variables

Las variables disponibles para personalización:

- `{nombre_apellidos}` - Nombre y apellido en MAYÚSCULAS
- `{NOMBRE_APELLIDOS}` - Mismo que anterior (compatibilidad)
- `{nombre}` - Solo nombre
- `{NOMBRE}` - Solo nombre en MAYÚSCULAS
- `{apellido}` - Solo apellido
- `{APELLIDO}` - Solo apellido en MAYÚSCULAS
- `{grupo}` - Grupo del contacto
- `{GRUPO}` - Grupo en MAYÚSCULAS
- `{gestor}` - Gestor asignado
- `{GESTOR}` - Gestor en MAYÚSCULAS

## Interfaz de Usuario

### Indicadores Visuales

1. **Primera Línea Fija**: Caja amarilla con etiqueta "PROTEGIDO"
2. **Área Editable**: Textarea normal para el resto del mensaje
3. **Botón de Edición**: Azul, ubicado en la esquina superior derecha
4. **Leyenda**: Explicación de restricciones en la parte inferior

### Mensajes Informativos

- **"🔒 Protegido"**: Indica que hay partes no editables
- **"💡 Nota"**: Explica las restricciones
- **"📝 Personalizado"**: Muestra la personalización activa

## Beneficios

### Para el Usuario
- **Claridad**: Sabe exactamente qué puede y no puede editar
- **Seguridad**: No puede romper el formato oficial accidentalmente
- **Eficiencia**: Personalización automática sin trabajo manual

### Para la Organización
- **Consistencia**: Todos los mensajes mantienen el formato oficial
- **Calidad**: Reduce errores en la comunicación
- **Cumplimiento**: Asegura el uso correcto de las plantillas

## Troubleshooting

### Problemas Comunes

1. **"No puedo editar la primera línea"**
   - ✅ Comportamiento esperado - está completamente protegida
   - 💡 La primera línea se personaliza automáticamente

2. **"La caja amarilla no se puede editar"**
   - ✅ Correcto - es la línea fija del saludo oficial
   - 💡 Solo se puede editar el resto del mensaje

3. **"¿Por qué no puedo cambiar el saludo?"**
   - ✅ El saludo está estandarizado oficialmente
   - 💡 Contacta al administrador si necesitas cambios

### Soluciones

1. **Editar contenido**: Usa el botón "Editar" para modificar partes permitidas
2. **Cambiar plantilla**: Selecciona una plantilla diferente si necesitas otro formato
3. **Contactar soporte**: Para cambios en partes protegidas, contacta al administrador

## Consideraciones Técnicas

### Rendimiento
- Detección eficiente de partes protegidas
- Renderizado optimizado de la vista previa
- Validación en tiempo real

### Seguridad
- Protección a nivel de interfaz
- Validación en el backend
- Preservación de integridad del mensaje

### Mantenibilidad
- Configuración centralizada
- Fácil agregado de nuevas partes protegidas
- Código modular y reutilizable 