# 📚 Documentación ATLAS ONE ERP

## 🎯 Inicio Rápido

### Para Usuarios Demo
Si eres un usuario demo y tienes problemas, empieza aquí:
- **[GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md)** - Solución rápida a problemas comunes

### Para Configurar Telegram
Si necesitas configurar Telegram con privacidad por usuario:
- **[TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt)** - Guía visual paso a paso
- **[RESUMEN_TELEGRAM_PRIVADO.md](RESUMEN_TELEGRAM_PRIVADO.md)** - Resumen con diagramas
- **[TELEGRAM_PRIVADO_POR_USUARIO.md](TELEGRAM_PRIVADO_POR_USUARIO.md)** - Guía completa detallada

---

## 📖 Documentación por Tema

### 🔧 Solución de Problemas
| Documento | Descripción |
|-----------|-------------|
| [GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md) | Solución paso a paso para los 3 problemas principales |
| [SOLUCION_PROBLEMAS_DEMO.md](SOLUCION_PROBLEMAS_DEMO.md) | Guía detallada con troubleshooting completo |

### 📱 Telegram
| Documento | Descripción |
|-----------|-------------|
| [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt) | ⭐ **RECOMENDADO** - Guía visual paso a paso |
| [TELEGRAM_PRIVADO_POR_USUARIO.md](TELEGRAM_PRIVADO_POR_USUARIO.md) | Explicación completa del sistema de Chat ID privado |
| [RESUMEN_TELEGRAM_PRIVADO.md](RESUMEN_TELEGRAM_PRIVADO.md) | Resumen rápido con diagramas visuales |
| [TELEGRAM_BOT.md](TELEGRAM_BOT.md) | Documentación técnica del bot |

### 🗄️ Base de Datos
| Documento | Descripción |
|-----------|-------------|
| [DATABASE.md](DATABASE.md) | Esquema completo de la base de datos |
| [scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql) | Script para reparar usuarios demo |
| [scripts/203_update_telegram_chat_id.sql](../scripts/203_update_telegram_chat_id.sql) | Script para configurar Chat ID individual |

---

## 🎓 Tutoriales

### Tutorial 1: Configuración Inicial Completa
1. Leer [GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md)
2. Ejecutar [scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql)
3. Configurar `.env.local`
4. Iniciar la app

### Tutorial 2: Configurar Telegram (Primera Vez)
1. Crear bot con @BotFather
2. Obtener TELEGRAM_BOT_TOKEN
3. Configurar en `.env.local`
4. Seguir [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt)

### Tutorial 3: Configurar Usuario Demo Individual
1. Login con usuario demo
2. Ir a Dashboard → Configuración → Notificaciones
3. Obtener Chat ID con @userinfobot
4. Pegar en el dashboard
5. Probar y guardar

---

## 🔍 Búsqueda Rápida

### ¿Cómo...?

**¿Cómo obtengo mi Chat ID de Telegram?**
→ Ver [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt) - Parte 2A

**¿Cómo creo un bot de Telegram?**
→ Ver [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt) - Parte 1, Paso 1

**¿Por qué todos los demos tenían el mismo Chat ID?**
→ Ver [TELEGRAM_PRIVADO_POR_USUARIO.md](TELEGRAM_PRIVADO_POR_USUARIO.md) - Sección "Problema Anterior"

**¿Cómo funciona la privacidad de Telegram?**
→ Ver [RESUMEN_TELEGRAM_PRIVADO.md](RESUMEN_TELEGRAM_PRIVADO.md)

**¿El usuario demo no tiene kiosko?**
→ Ejecutar [scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql)

**¿No funciona offline?**
→ Ver [GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md) - Problema 2

**¿Telegram no envía notificaciones?**
→ Ver [SOLUCION_PROBLEMAS_DEMO.md](SOLUCION_PROBLEMAS_DEMO.md) - Sección Troubleshooting

---

## 📊 Flujos Principales

### Flujo: Nuevo Usuario Demo

\`\`\`
1. Ejecutar script 202 (crear usuario y kiosko)
   ↓
2. Usuario obtiene su Chat ID (@userinfobot)
   ↓
3. Usuario hace login
   ↓
4. Usuario configura Telegram en Dashboard
   ↓
5. Usuario prueba notificación
   ↓
6. Usuario guarda configuración
   ↓
7. ✅ Usuario recibe notificaciones privadas
\`\`\`

### Flujo: Configurar Bot Telegram (Admin)

\`\`\`
1. Crear bot con @BotFather
   ↓
2. Obtener Token
   ↓
3. Configurar TELEGRAM_BOT_TOKEN en .env.local
   ↓
4. Reiniciar app
   ↓
5. ✅ Bot disponible para todos los usuarios
\`\`\`

### Flujo: Usuario Configura su Telegram

\`\`\`
1. @userinfobot → Obtener Chat ID
   ↓
2. Dashboard → Configuración → Telegram
   ↓
3. Pegar Chat ID
   ↓
4. Probar (recibe mensaje de prueba)
   ↓
5. Guardar
   ↓
6. @AtlasOneERP_bot → /start
   ↓
7. ✅ Recibe notificaciones automáticas
\`\`\`

---

## 🎯 Por Rol

### Soy Administrador
Necesito:
1. [GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md) - Para setup inicial
2. [DATABASE.md](DATABASE.md) - Para entender la estructura
3. [scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql) - Para crear usuarios

### Soy Usuario Demo
Necesito:
1. [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt) - Para configurar Telegram
2. Login: `demo.maxi-kiosco@atlasone.com` / `Demo123456!`
3. Dashboard → Configuración

### Soy Desarrollador
Necesito:
1. [DATABASE.md](DATABASE.md) - Esquema completo
2. [TELEGRAM_BOT.md](TELEGRAM_BOT.md) - API del bot
3. [TELEGRAM_PRIVADO_POR_USUARIO.md](TELEGRAM_PRIVADO_POR_USUARIO.md) - Arquitectura

---

## 🛠️ Scripts SQL

| Script | Propósito | Cuándo usar |
|--------|-----------|-------------|
| `200_create_demo_users.sql` | Crear usuarios demo desde cero | Primera vez |
| `201_seed_demo_data.sql` | Agregar datos a usuarios existentes | Si usuarios existen pero faltan datos |
| `202_fix_demo_complete.sql` | ⭐ **RECOMENDADO** - Reparación completa | Cuando hay cualquier problema |
| `203_update_telegram_chat_id.sql` | Actualizar Chat ID de un usuario | Para configuración manual avanzada |

---

## ❓ FAQ

**P: ¿Necesito ejecutar scripts en orden?**
R: No. Script 202 hace todo. Solo ejecútalo.

**P: ¿Puedo usar el mismo Chat ID para varios usuarios?**
R: Técnicamente sí, pero todos recibirían las mismas notificaciones. No recomendado.

**P: ¿Necesito un bot diferente por cada usuario?**
R: No. Un solo bot sirve para todos los usuarios.

**P: ¿Cómo sé si Telegram está configurado correctamente?**
R: Ejecuta la query de verificación en [TELEGRAM_PASO_A_PASO.txt](TELEGRAM_PASO_A_PASO.txt) - Parte 3.

**P: ¿Dónde está el token del bot?**
R: En `.env.local` → `TELEGRAM_BOT_TOKEN`

**P: ¿El modo offline ya funciona?**
R: Sí. Service Worker implementado automáticamente.

---

## 🚀 Empezar Ahora

### Opción 1: Configuración Rápida (5 minutos)
\`\`\`bash
1. Ejecutar en Supabase: scripts/202_fix_demo_complete.sql
2. Configurar .env.local con TELEGRAM_BOT_TOKEN
3. npm run dev
4. Login y probar
\`\`\`

### Opción 2: Configuración Completa (15 minutos)
\`\`\`bash
1. Leer GUIA_RAPIDA_SOLUCION.md
2. Crear bot de Telegram (@BotFather)
3. Ejecutar script 202
4. Configurar cada usuario (TELEGRAM_PASO_A_PASO.txt)
5. Verificar con queries SQL
\`\`\`

---

## 📞 Soporte

Si después de leer toda la documentación sigues con problemas:

1. Verificar que ejecutaste [scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql)
2. Verificar `.env.local` tiene las variables correctas
3. Revisar logs del navegador (F12 → Console)
4. Revisar [SOLUCION_PROBLEMAS_DEMO.md](SOLUCION_PROBLEMAS_DEMO.md) - Troubleshooting

---

## 📝 Cambios Recientes

### 22 Diciembre 2025
- ✅ Eliminado Chat ID hardcodeado compartido
- ✅ Implementado Chat ID privado por usuario
- ✅ Scripts actualizados (202, 203)
- ✅ Service Worker para modo offline
- ✅ Documentación completa creada

---

**Última actualización:** 22 Diciembre 2025
