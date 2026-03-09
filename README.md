# Telegram-bot
CRM Serverless y Bot de Telegram desarrollado con Cloudflare Workers y base de datos D1. Incluye un panel de administración seguro, protección contra inyección SQL y notificaciones de clientes potenciales (leads) en tiempo real.
---
# 🚀 Daniel Rojas Tech Solutions - Bot & CRM

Sistema automatizado de gestión de servicios digitales (Desarrollo Web, Meta Business Suite, Soporte IT y Ayuda Académica) diseñado para centralizar la atención al cliente y la gestión de proyectos profesionales.

Este proyecto utiliza una arquitectura **Serverless** de alto rendimiento basada en el ecosistema de Cloudflare para garantizar disponibilidad 24/7 sin costes de servidor fijo.

---

## 🛠️ Tecnologías Utilizadas

* **Cloudflare Workers:** Entorno de ejecución de funciones JavaScript en el borde (Edge).
* **Cloudflare D1:** Base de Datos SQL nativa de Cloudflare para persistencia de datos.
* **Telegram Bot API:** Interfaz principal de interacción y notificaciones.
* **Bootstrap 5:** Framework de interfaz para el Dashboard administrativo.

---

## ✨ Características Principales

* **Flujo de Usuario Inteligente:** El bot categoriza el servicio (Web, RRSS, Soporte) y solicita detalles del requerimiento de forma estructurada.
* **Notificaciones en Tiempo Real:** El administrador recibe un aviso inmediato con un enlace directo (`tg://user?id=`) para responder al cliente al instante.
* **Dashboard CRM Seguro:** Panel `/admin` protegido por credenciales (Variables de Entorno) para gestionar la cartera de prospectos.
* **Gestión de Estados:** Sistema de marcado "Atendido" con persistencia en base de datos para seguimiento de tareas.
* **Optimización de Conversión:** Botón de chat integrado en la tabla para reducir la fricción en el contacto comercial.

---

## ⚙️ Configuración y Despliegue

### 1. Variables de Entorno (Secrets)
Configurar las siguientes variables en el panel de Cloudflare para la ejecución del Worker:

* `TELEGRAM_TOKEN`: Token generado por @BotFather.
* `MY_CHAT_ID`: ID numérico de Telegram del administrador.
* `ADMIN_USER`: Usuario definido para el login del panel.
* `ADMIN_PASS`: Contraseña definida para el login del panel.

### 2. Estructura de Base de Datos (SQL)
Ejecutar el siguiente script en la consola de **Cloudflare D1** para inicializar la tabla:
```
CREATE TABLE citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  user_id TEXT,
  servicio TEXT,
  problema TEXT,
  estado TEXT DEFAULT 'Pendiente',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
---

## 📂 Componentes del Sistema

* `worker.js`: Lógica unificada que procesa Webhooks de Telegram y sirve el Dashboard HTML.
* `Admin Panel`: Interfaz responsiva para visualización y control de leads.
* `D1 Binding`: Conexión segura entre el código y la capa de datos SQL.

---

## 👤 Autor

**Daniel Rojas** *Software Developer & IT Support* Estudiante de Informática - IUTAR Maracay, Venezuela.

---

> **Aviso de Seguridad:** Este repositorio es público. Las credenciales, tokens y IDs sensibles deben gestionarse exclusivamente a través de las variables de entorno cifradas de Cloudflare y nunca hardcodearse en el archivo `worker.js`.
