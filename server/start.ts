import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { readFile } from "node:fs/promises"
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto"
import path from "node:path"
import { createApiHandler } from "./backend.ts"

export function createApp({ hosted = false, passcode = process.env.HALO_TEAM_PASSCODE, secret = process.env.HALO_SESSION_SECRET || randomBytes(32).toString("hex") } = {}) {
  if(hosted && (!passcode || passcode.length<12))throw new Error("Set HALO_TEAM_PASSCODE to at least 12 characters before publishing")
  if(hosted && !process.env.DATABASE_URL)throw new Error("DATABASE_URL is required for durable hosted records")
  const api=createApiHandler(hosted)
  const dist=path.resolve("dist")
  const attempts=new Map<string,{count:number,at:number}>()
  const signed=(payload:string)=>createHmac("sha256",secret).update(payload).digest("hex")
  const secureCompare=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
  const authenticated=(req:IncomingMessage)=>{
    if(!passcode)return true
    const token=req.headers.cookie?.match(/(?:^|; )halo_session=([^;]+)/)?.[1]
    if(!token)return false
    const [expiry,signature]=token.split(".")
    return Number(expiry)>Date.now() && !!signature && secureCompare(signature,signed(expiry))
  }
  const loginHtml=(failed=false)=>`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HALO Crew · Team access</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#21182b;color:#f4e6fa;font:16px system-ui}main{padding:36px;width:min(340px,75vw);border:1px solid #bd91d44d;border-radius:28px;background:linear-gradient(135deg,#49314f,#291e36)}h1{font-size:32px}p{line-height:1.6;color:#cdb4d9}input,button{box-sizing:border-box;width:100%;padding:15px;border-radius:13px;border:1px solid #bc94cd;background:#21182b;color:#f4e6fa;font:inherit;margin-top:12px}button{background:#d3ace1;color:#392241;font-weight:700}</style><main><b>HALO CREW</b><h1>Your shared mission space.</h1><p>Enter your team passcode to open the astronaut workspace.</p>${failed?'<p role="alert">Passcode not accepted. Try again.</p>':''}<form method="post" action="/login"><label>Team passcode<input name="passcode" type="password" required autocomplete="current-password" maxlength="200"></label><button>Enter HALO →</button></form></main></html>`
  const handler=async(req:IncomingMessage,res:ServerResponse)=>{
    res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Referrer-Policy","same-origin");res.setHeader("X-Frame-Options","DENY")
    const route=req.url?.split("?")[0] || "/"
    if(route==="/healthz"){try{await api.ready;res.end("ok")}catch{res.statusCode=503;res.end("unavailable")}return}
    if(route==="/login" && req.method==="POST"){
      const host=req.headers.host; if(req.headers.origin && req.headers.origin!==`https://${host}` && req.headers.origin!==`http://${host}`){res.statusCode=403;res.end();return}
      const ip=req.socket.remoteAddress || "unknown", now=Date.now(), previous=attempts.get(ip)
      const attempt=previous&&now-previous.at<60000?previous:{count:0,at:now}
      if(attempt.count>=10){res.statusCode=429;res.end("Wait one minute before trying again");return}
      let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>2000){res.statusCode=413;res.end();return}}
      if(!passcode || secureCompare(new URLSearchParams(raw).get("passcode")||"",passcode)){
        attempts.delete(ip);const expiry=String(Date.now()+7*86400000)
        res.setHeader("Set-Cookie",`halo_session=${expiry}.${signed(expiry)}; Path=/; HttpOnly; SameSite=Strict${hosted?"; Secure":""}; Max-Age=604800`)
        res.writeHead(303,{Location:"/"});res.end();return
      }
      attempt.count++;attempts.set(ip,attempt);res.statusCode=401;res.setHeader("Content-Type","text/html");res.end(loginHtml(true));return
    }
    if(!authenticated(req)){
      res.setHeader("Cache-Control","no-store");res.statusCode=route.startsWith("/api/")?401:200
      res.setHeader("Content-Type",route.startsWith("/api/")?"application/json":"text/html");res.end(route.startsWith("/api/")?JSON.stringify({error:"Team access required"}):loginHtml());return
    }
    if(route.startsWith("/api/")){await api.handler(req,res,()=>{res.statusCode=404;res.end()});return}
    if(req.method!=="GET" && req.method!=="HEAD"){res.statusCode=405;res.end();return}
    try{
      const decoded=decodeURIComponent(route), filename=path.resolve(dist,"."+decoded)
      if(!filename.startsWith(dist+path.sep)&&filename!==dist){res.statusCode=403;res.end();return}
      const extension=path.extname(filename)
      const target=extension?filename:path.join(dist,"index.html")
      const data=await readFile(target)
      const types:Record<string,string>={".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".woff2":"font/woff2",".json":"application/json"}
      res.setHeader("Content-Type",types[path.extname(target)]||"application/octet-stream")
      res.setHeader("Cache-Control",target.includes(path.sep+"assets"+path.sep)?"public,max-age=31536000,immutable":"no-cache")
      res.end(req.method==="HEAD"?undefined:data)
    }catch{res.statusCode=404;res.end("Not found")}
  }
  return {handler,ready:api.ready,close:api.close}
}

if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const app=createApp({hosted:process.env.NODE_ENV==="production"})
  await app.ready
  createServer((req,res)=>{app.handler(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end("Service unavailable")})}).listen(Number(process.env.PORT)||8443,"0.0.0.0",()=>console.log("HALO shared server ready"))
}
