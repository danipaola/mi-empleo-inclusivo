# Mi Empleo Inclusivo — LinkedIn automático

## Qué hace

- Lee las personas configuradas en `personas_linkedin.json`.
- Una acción de GitHub busca diariamente publicaciones públicas indexadas.
- Guarda los resultados nuevos en `linkedin.json`.
- El botón **Actualizar publicaciones** vuelve a leer `linkedin.json` sin usar la caché.

## Cómo agregar una persona para la automatización

Editar `personas_linkedin.json` y agregar:

```json
{
  "name": "Nombre completo",
  "profile": "https://www.linkedin.com/in/perfil",
  "keywords": [
    "oportunidad laboral",
    "vacante",
    "inclusión",
    "discapacidad"
  ],
  "active": true
}
```

## Ejecutar la búsqueda ahora

En GitHub:

1. Abrir la pestaña **Actions**.
2. Elegir **Actualizar publicaciones de LinkedIn**.
3. Presionar **Run workflow**.

## Importante

La búsqueda encuentra solo publicaciones públicas que Bing haya indexado. LinkedIn
puede ocultar algunas publicaciones o impedir su indexación; por eso no existe una
garantía del 100 %.
