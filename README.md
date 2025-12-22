# Atlas One ERP demo

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/atlasonecontact-3393s-projects/v0-atlas-one-erp-demo)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/tNXb5L5hSY7)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/atlasonecontact-3393s-projects/v0-atlas-one-erp-demo](https://vercel.com/atlasonecontact-3393s-projects/v0-atlas-one-erp-demo)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/tNXb5L5hSY7](https://v0.app/chat/tNXb5L5hSY7)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Getting Started

### Variables de entorno (requerido para empleados y demo)

1) Copiá `.env.local.example` a `.env.local`

2) Completá como mínimo:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (requerido para crear usuarios de empleados y cuentas demo)

Opcional:
- `DEMO_PASSWORD` (si querés cambiar la contraseña de las cuentas demo)

### Cómo crear / usar usuarios demo

- Entrá a `/demo`
- Elegí el rubro (maxi kiosco, mini market, licorería, etc.)
- El sistema crea/asegura la cuenta `demo.<rubro>@atlasone.com` y te loguea automáticamente.
