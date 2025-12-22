# 🤖 Configuración del Bot de Telegram - Atlas ONE

## Paso 1: Crear el Bot

1. Abrí Telegram y buscá **@BotFather**
2. Mandá el comando `/newbot`
3. Seguí las instrucciones:
   - Elegí un nombre: `Atlas ONE Kiosco`
   - Elegí un username: `tuempresa_atlasone_bot` (debe terminar en `bot`)
4. BotFather te dará el **Token del bot** - Guardalo

## Paso 2: Agregar el Token como Variable de Entorno

En tu proyecto, agregá esta variable de entorno:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### En Vercel:
1. Ir a tu proyecto → Settings → Environment Variables
2. Agregar `TELEGRAM_BOT_TOKEN` con el valor del token

### En Railway/Render:
1. Ir a Variables de entorno
2. Agregar `TELEGRAM_BOT_TOKEN`

## Paso 3: Configurar el Webhook

Una vez desplegado tu proyecto, necesitás decirle a Telegram dónde enviar los mensajes.

### Opción A: Con cURL (Terminal)

```bash
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-dominio.vercel.app/api/telegram/webhook"}'
```

### Opción B: Desde el navegador

Visitá esta URL (reemplazando los valores):

```
https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://tu-dominio.vercel.app/api/telegram/webhook
```

### Verificar que funciona

Visitá:
```
https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

Deberías ver algo como:
```json
{
  "ok": true,
  "result": {
    "url": "https://tu-dominio.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Paso 4: Probar el Bot

1. Buscá tu bot en Telegram: `@tu_bot`
2. Mandá `/start`
3. El bot debe responder con tu Chat ID

## Comandos del Bot

| Comando | Descripción |
|---------|-------------|
| `/start` | Ver tu Chat ID para configurar |
| `/ventas` | Ver ventas del día |
| `/stock` | Ver productos con stock bajo |
| `/ayuda` | Ver comandos disponibles |

## Flujo del Usuario

1. Usuario va a **Configuración → Integraciones → Telegram**
2. Activa Telegram
3. Abre su Telegram y busca el bot
4. Manda `/start` y recibe su Chat ID
5. Copia el Chat ID en la app
6. Toca "Probar" para verificar
7. ¡Listo! Recibe notificaciones automáticas

## Solución de Problemas

### El bot no responde a /start
- Verificá que el webhook esté configurado correctamente
- Revisá los logs del servidor
- Asegurate de que `TELEGRAM_BOT_TOKEN` esté configurado

### El mensaje de test no llega
- Verificá que el Chat ID sea correcto (es un número)
- El usuario debe haber mandado `/start` al bot primero
- Telegram no permite que bots escriban primero

### Error 401 Unauthorized
- El token del bot es incorrecto
- Regenerá el token con BotFather: `/revoke` y luego `/newtoken`

### Error 400 Bad Request: chat not found
- El Chat ID es incorrecto
- El usuario bloqueó al bot
- El usuario nunca inició chat con el bot

## Estructura del Endpoint

```
app/api/telegram/webhook/route.ts
```

Este endpoint:
1. Recibe los mensajes de Telegram via webhook
2. Procesa comandos (`/start`, `/ventas`, `/stock`, `/ayuda`)
3. Responde automáticamente al usuario
4. Para `/ventas` y `/stock`, busca el kiosko vinculado al Chat ID

## Notificaciones de Ventas

Cuando se hace una venta, el endpoint `/api/notifications/sale` automáticamente:
1. Busca la configuración de notificaciones del kiosko
2. Si Telegram está habilitado y verificado, envía el mensaje
3. Usa el Chat ID configurado por el usuario

---

*Última actualización: Diciembre 2024*
