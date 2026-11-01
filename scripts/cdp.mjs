// Client minimal du protocole DevTools (CDP) pour piloter Obsidian lancé avec --remote-debugging-port.
// Sans dépendance : Node 22+ fournit WebSocket et fetch.

export async function connect(port = 9333) {
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find((p) => p.type === "page" && p.url.startsWith("app://obsidian.md"));
  if (!page) throw new Error("Aucune fenêtre Obsidian sur ce port.");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, ko) => ((ws.onopen = ok), (ws.onerror = ko)));
  let seq = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, ko } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? ko(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok, ko) => {
      const id = ++seq;
      pending.set(id, { ok, ko });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const cdp = {
    send,
    on(method, fn) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    },
    /** Évalue une expression (ou un corps de fonction async) dans la page d'Obsidian. */
    async eval(code) {
      const r = await send("Runtime.evaluate", { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async screenshot(clip) {
      const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      return Buffer.from(r.data, "base64");
    },
    async click(x, y) {
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
      }
    },
    async move(x, y) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    },
    async type(text) {
      await send("Input.insertText", { text });
    },
    close: () => ws.close(),
  };
  await send("Page.enable");
  return cdp;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
