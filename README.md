# Pure LLM Front

Scaffold Angular para ejecutar un LLM pequeno en el navegador con una arquitectura desacoplada y preparada para cambiar de proveedor.

## Stack inicial

- Angular standalone
- TypeScript estricto
- `@mlc-ai/web-llm` como proveedor inicial
- Signals para estado de UI
- Repositorios y contratos para aislar infraestructura

## Scripts

```bash
npm install
npm start
npm run lint
npm run test
npm run check
```

## Estructura

- `src/app/domain`: contratos y entidades puras
- `src/app/application`: facades y estado de casos de uso
- `src/app/infrastructure`: proveedores LLM y persistencia
- `src/app/features`: pantallas y componentes de funcionalidad
- `src/app/shared`: UI reutilizable
- `src/app/core`: configuracion, DI y capacidades de plataforma

## Notas

- `WebLlmProvider` esta listo para evolucionar hacia worker dedicado.
- `TransformersProvider` queda scaffolded para un segundo proveedor.
- El catalogo de modelos esta centralizado en `src/app/infrastructure/repositories/browser-model.repository.ts`.
- Cada modelo puede declarar un `promptProfile` y capacidades operativas para evitar fugas del contrato interno al cambiar de familia.
- Se preservan bloques `<think>` cuando el modelo los emite, pero se eliminan artefactos internos como `system-reminder` y etiquetas del contrato antes de renderizar.
- La sesion activa del chat ahora se restaura entre recargas y se persiste en IndexedDB con fallback a `localStorage`.
