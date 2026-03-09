let userStates = {}; 

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- 1. DASHBOARD ADMIN (/admin) ---
    if (url.pathname === "/admin") {
      let isAuthenticated = false;

      if (request.method === "POST") {
        const formData = await request.formData();
        const action = formData.get("action");
        const user = formData.get("user");
        const pass = formData.get("pass");

        if (user === env.ADMIN_USER && pass === env.ADMIN_PASS) {
          isAuthenticated = true;
        } 
        
        if (action === "completar") {
          const id = formData.get("id");
          await env.DB.prepare("UPDATE citas SET estado = 'Atendido' WHERE id = ?").bind(id).run();
          isAuthenticated = true; 
        }
      }

      if (!isAuthenticated) {
        return new Response(generateLoginForm(), { headers: { "Content-Type": "text/html" } });
      }

      const { results } = await env.DB.prepare("SELECT * FROM citas ORDER BY estado DESC, id DESC").all();
      return new Response(generateDashboard(results), { headers: { "Content-Type": "text/html" } });
    }

    // --- 2. WEBHOOK TELEGRAM (POST) ---
    if (request.method === "POST") {
      const update = await request.json();
      const chat = update.message ? update.message.chat : update.callback_query?.message.chat;
      const userObj = update.message ? update.message.from : update.callback_query?.from;

      if (!chat) return new Response("ok");

      const chatId = chat.id;
      const userId = userObj.id;
      const userName = userObj.first_name;
      const userHandle = userObj.username ? `@${userObj.username}` : "Sin @";

      if (update.message?.text === "/start") {
        userStates[userId] = { step: "SERVICE" };
        await sendMessage(chatId, `¡Hola ${userName}! 🚀 ¿En qué área potenciamos tu negocio?`, [
          [{ text: "🌐 Desarrollo Web", callback_data: "svc:Desarrollo Web" }],
          [{ text: "📱 Meta & Bots RRSS", callback_data: "svc:Gestión RRSS" }],
          [{ text: "🤖 Automatización", callback_data: "svc:Automatización" }],
          [{ text: "💻 Soporte IT & Académico", callback_data: "svc:Soporte IT" }]
        ], env.TELEGRAM_TOKEN);
      }

      else if (update.callback_query) {
        const servicio = update.callback_query.data.split(":")[1];
        userStates[userId] = { servicio, step: "PROBLEM" };
        await sendMessage(chatId, `Elegiste *${servicio}*. Cuéntame los detalles del requerimiento:`, null, env.TELEGRAM_TOKEN);
      }

      else if (update.message && userStates[userId]?.step === "PROBLEM") {
        const state = userStates[userId];
        const detalles = update.message.text;

        await env.DB.prepare("INSERT INTO citas (nombre, user_id, servicio, problema) VALUES (?, ?, ?, ?)")
          .bind(userName, userId.toString(), state.servicio, detalles).run();

        // --- NOTIFICACIÓN PARA DANIEL CON LINK DE RESPUESTA ---
        const contactLink = userObj.username ? `https://t.me/${userObj.username}` : `tg://user?id=${userId}`;
        const aviso = `📢 *NUEVO CLIENTE*\n\n` +
                      `👤 *Cliente:* ${userName} (${userHandle})\n` +
                      `🛠 *Servicio:* ${state.servicio}\n` +
                      `📝 *Detalles:* ${detalles}\n\n` +
                      `🔗 [Responder al cliente](${contactLink})`;

        await sendMessage(env.MY_CHAT_ID, aviso, null, env.TELEGRAM_TOKEN);
        await sendMessage(chatId, "✅ ¡Información recibida! Daniel analizará tu caso y te contactará pronto.", null, env.TELEGRAM_TOKEN);
        delete userStates[userId];
      }
      return new Response("ok");
    }

    return new Response("Daniel Rojas Tech Solutions - Online", { status: 200 });
  }
};

async function sendMessage(chatId, text, buttons, token) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", reply_markup: buttons ? { inline_keyboard: buttons } : undefined })
  });
}

function generateLoginForm() {
  return `<!DOCTYPE html><html><head><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
  <body class="bg-dark text-white d-flex align-items-center vh-100"><div class="container text-center" style="max-width: 400px;">
    <h2 class="mb-4">Admin Login</h2>
    <form method="POST" class="p-4 bg-secondary rounded shadow">
      <input type="hidden" name="action" value="login">
      <input type="text" name="user" class="form-control mb-3" placeholder="Usuario" required>
      <input type="password" name="pass" class="form-control mb-3" placeholder="Password" required>
      <button class="btn btn-primary w-100">Entrar</button>
    </form>
  </div></body></html>`;
}

function generateDashboard(rows) {
  const tableRows = rows.map(r => `
    <tr style="${r.estado === 'Atendido' ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
      <td style="font-family: sans-serif;">${r.nombre}</td>
      <td><span class="badge bg-info text-dark">${r.servicio}</span></td>
      <td style="font-family: sans-serif;">${r.problema}</td>
      <td>
        <form method="POST" style="display:inline;">
          <input type="hidden" name="action" value="completar">
          <input type="hidden" name="id" value="${r.id}">
          <button class="btn btn-sm btn-success">Listo</button>
        </form>
        <a href="tg://user?id=${r.user_id}" class="btn btn-sm btn-primary ms-1">Chat</a>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style> body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; } </style></head>
  <body class="bg-dark text-white p-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Agenda de Citas</h2>
        <a href="/admin" class="btn btn-outline-light btn-sm">Refrescar</a>
    </div>
    <div class="table-responsive">
      <table class="table table-dark table-hover border-secondary">
        <thead><tr><th>Cliente</th><th>Servicio</th><th>Detalles</th><th>Acciones</th></tr></thead>
        <tbody>${tableRows.length > 0 ? tableRows : '<tr><td colspan="4" class="text-center">No hay registros</td></tr>'}</tbody>
      </table>
    </div>
  </body></html>`;
}
