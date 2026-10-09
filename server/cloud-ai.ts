import { Client } from "@gradio/client"

export function createCloudAI() {
  const space=process.env.HALO_HF_SPACE || "RJBee4u/halo-crew-ai"
  const token=process.env.HF_TOKEN
  const configured=!!token?.startsWith("hf_")
  let connection:Promise<Client>|undefined
  let cached:{ai:boolean;voices:string[];model:string|null}={ai:false,voices:[],model:null}
  let expires=0
  const connect=()=>{
    if(!configured)throw new Error("Private AI service not configured")
    if(!connection)connection=Client.connect(space,{token:token as `hf_${string}`}).catch(e=>{connection=undefined;throw e})
    return connection
  }
  const call=async(endpoint:string,payload:unknown[],timeout=120000)=>{
    let timer:ReturnType<typeof setTimeout>|undefined
    let timedOut=false
    let job:ReturnType<Client["submit"]>|undefined
    try {
      return await Promise.race([
        (async()=>{
          const app=await connect();if(timedOut)throw new Error("AI service timed out");job=app.submit(endpoint,payload)
          for await(const event of job){if(event.type==="data")return (event.data as unknown[])[0]}
          throw new Error("No AI result")
        })(),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>{timedOut=true;void job?.cancel();reject(new Error("AI service timed out"))},timeout)})
      ])
    }finally{if(timer)clearTimeout(timer)}
  }
  const status=async()=>{
    if(!configured)return cached
    if(Date.now()<expires)return cached
    try{
      const value=await call("/status",[],10000) as any
      cached={ai:value?.ai===true,voices:Array.isArray(value?.voices)?value.voices.filter((x:string)=>["family-0","family-1","family-2"].includes(x)):[],model:typeof value?.model==="string"?value.model:null}
    }catch{cached={ai:false,voices:[],model:null}}
    expires=Date.now()+20000;return cached
  }
  const chat=async(payload:unknown)=>{
    const answer=await call("/chat",[JSON.stringify(payload)])
    if(typeof answer!=="string" || !answer.trim() || answer.length>12000)throw new Error("Invalid AI reply")
    return answer
  }
  const speech=async(payload:unknown)=>{
    const value=await call("/speech",[JSON.stringify(payload)],180000)
    if(typeof value!=="string" || value.length>10_000_000)throw new Error("Invalid speech reply")
    const bytes=Buffer.from(value,"base64")
    if(bytes.toString("ascii",0,4)!=="RIFF" || bytes.toString("ascii",8,12)!=="WAVE")throw new Error("Invalid WAV")
    return bytes
  }
  return {configured,status,chat,speech}
}
