import type { Plugin } from "vite"
import createStorage from "./storage.ts"
import type { IncomingMessage } from "node:http"

// Local single-astronaut backend. Bind behind localhost; not a public multi-user service.
export function createApiHandler(hosted = false) {
  const storage = createStorage()
  let queue = Promise.resolve()
  const read = storage.read
  const save = (name: string, value: unknown) => {
    const task = queue.then(()=>storage.write(name,value))
    queue=task.catch(()=>{})
    return task
  }
  const body = async (req: IncomingMessage) => {
    let data = ""
    for await (const chunk of req) {
      data += chunk
      if (data.length > 1_000_000) throw new Error("Request too large")
    }
    return JSON.parse(data || "{}")
  }
  const handler = async (req: IncomingMessage, res: any, next: () => void) => {
    const route = req.url?.split("?")[0]
    if (!route?.startsWith("/api/")) return next()
    const json = (status: number, value: unknown) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(value)) }
    // Reject remote hosts and cross-site writes to this private local service.
    const host = req.headers.host || ""
    if (!hosted && !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return json(403, { error: "Local access only" })
    if (req.headers.origin && req.headers.origin !== `http://${host}` && req.headers.origin !== `https://${host}`) return json(403, { error: "Origin rejected" })
    try {
      if (route === "/api/status" && req.method === "GET") {
        let ai = false
        try { const result = await fetch(`${process.env.HALO_MODEL_URL || "http://127.0.0.1:11434"}/api/tags`, { signal: AbortSignal.timeout(800) }); const models = await result.json(); ai = !!models.models?.some((m: any) => m.name === (process.env.HALO_LOCAL_MODEL || "llama3.2:3b")) } catch {}
        return json(200, { storage: storage.kind, ai: ai ? "local-model" : "rules", model: ai ? process.env.HALO_LOCAL_MODEL || "llama3.2:3b" : null })
      }
      if (route === "/api/mission") {
        if (req.method === "GET") return json(200, { state: await read("mission") })
        if (req.method === "PUT") {
          const value = await body(req)
          if (!value || !Array.isArray(value.logs) || value.logs.length > 250 || !value.checkin || !Number.isFinite(value.checkin.fatigue) || value.checkin.fatigue < 0 || value.checkin.fatigue > 10 || !["Nominal","Recovery shift","Poor contact","Immune review","Exercise gap","Habitat alert"].includes(value.scenario)) return json(400, { error: "Invalid mission record" })
          await save("mission", value); return json(200, { saved: true })
        }
      }
      if (route === "/api/sync" && req.method === "POST") {
        const value = await body(req)
        if (!Array.isArray(value.logs) || value.logs.length > 250) return json(400, { error: "Invalid records" })
        await save("inbox", value.logs); return json(200, { ids: value.logs.map((x: any) => x.id) })
      }
      if (route === "/api/chat" && req.method === "GET") return json(200, { conversations: await read("conversations") || {} })
      if (route === "/api/chat" && req.method === "POST") {
        const value = await body(req)
        const { message, channel, context, fallback } = value
        if (typeof message !== "string" || message.length > 4000 || !["halo", "family-0", "family-1", "family-2"].includes(channel) || typeof fallback !== "string" || fallback.length > 12000) return json(400, { error: "Invalid message" })
        const conversations = await read("conversations") || {}
        const history = conversations[channel] || []
        let answer = fallback, engine = "rules"
        // No cloud API or credentials required. Optional locally installed model.
        try {
          const instruction = channel === "halo" ? "You are HALO, a concise astronaut wellbeing companion. Use only supplied records. Never invent readings, diagnose disease, infer immune function or bone density, prescribe drugs or doses, or claim validated predictions. Explain missing evidence. Suggest mission medical review for urgent symptoms." : `You are a clearly identified AI family companion using a preconfigured ${["mother","father","sibling"][Number(channel.slice(-1))]} persona. Be warm and brief, never claim to be the actual relative or invent their real memories. Do not diagnose or prescribe. Acknowledge medical concerns and recommend mission medical review.`
          const result = await fetch(`${process.env.HALO_MODEL_URL || "http://127.0.0.1:11434"}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(45000), body: JSON.stringify({ model: process.env.HALO_LOCAL_MODEL || "llama3.2:3b", stream: false, messages: [{ role: "system", content: instruction + "\nIllustrative mission context: " + JSON.stringify(context) }, ...history.slice(-10).map((x: any) => ({ role: x.role === "You" ? "user" : "assistant", content: x.text })), { role: "user", content: message }] }) })
          if (result.ok) { const generated = await result.json(); if (generated.message?.content) { answer = generated.message.content; engine = "local-model" } }
        } catch {}
        const updated = [...history, { role: "You", text: message }, { role: channel === "halo" ? "HALO" : value.name || "Family companion", text: answer }].slice(-100)
        // Serialize chat writes so two conversation channels cannot overwrite each other.
        const task = queue.then(async () => {
          const latest = await read("conversations") || {}
          latest[channel] = updated
          await storage.write("conversations", latest)
        }); queue = task.catch(() => {}); await task
        return json(200, { answer, engine, messages: updated })
      }
      return json(404, { error: "Unknown endpoint" })
    } catch { return json(500, { error: "Local service could not complete this request" }) }
  }
  return {handler,ready:storage.ready,close:storage.close}
}

export default function haloBackend(): Plugin {
  const api=createApiHandler()
  return { name: "halo-local-backend", configureServer(server) { server.middlewares.use(api.handler) }, configurePreviewServer(server) { server.middlewares.use(api.handler) } }
}
