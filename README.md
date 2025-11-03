# Lotería en Línea - Juego Multijugador en Tiempo Real

Proyecto Full Stack que implementa el tradicional juego de Lotería Mexicana en versión digital, permitiendo que varios jugadores participen en una misma sala en tiempo real mediante WebSockets

---

[![My Skills](https://skillicons.dev/icons?i=react,nextjs,tailwind,nodejs,aws,nginx)](https://skillicons.dev)

## Cómo funciona el juego

1. **Ingresas tu nombre** para identificarte dentro del juego.
2. Puedes **crear una sala de juego** y recibes un **código único**.
3. Otros jugadores pueden **unirse a tu sala** ingresando dicho código.
4. Cada jugador marca su estado con un botón de **"Listo"**.
5. Cuando todos estén listos:
   * El servidor comienza a **mostrar las cartas una por una**.
   * Cada jugador ve el flujo de cartas en tiempo real.
6. Si un jugador completa su tabla, presiona **"¡Lotería!"**.
7. El servidor valida y **termina la partida**, mostrando al ganador.
8. En todo momento puedes **ver la lista de jugadores**, quién está listo y quién falta por estar listo para la partida.

--

## Características principales

* Salas privadas mediante código.
* Sincronización en tiempo real con WebSockets.
* UI reactiva y optimizada.
* Control de estado de jugadores (conectado/listo).
* Emisión progresiva de cartas desde el servidor.
* Botón de "Lotería" para finalizar partida.
* Arquitectura cliente-servidor limpia.
* Deploy profesional (Vercel + EC2 + Nginx).


## Estructura del proyecto

`/client` -> Next.js (UI, sala, tablero).
`/server` -> Node + Express (lógica del juego, websockets).

### Arquitectura

[Next.js - Vercel] <-- WebSockets --> [Node/Express - EC2]
(via Nginx reverse proxy)

### Cómo ejecutar localmente

### 1. Clonar repositorio

```bash
git clone https://github.com/angelsr16/loteria.git
cd loteria
```

#### 2. Server

```bash
cd server
npm install
npm run dev
```

#### 3. Client

```bash
cd client
npm install
npm run dev
```

---

## Deploy

**Frontend**

Deploy automático en **Vercel**.

**Server**

* EC2 Amazon Linux / Ubuntu
* Node + PM2
* Nginx como reverse proxy
* WebSocket pass-through configurado
