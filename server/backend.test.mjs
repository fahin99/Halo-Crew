import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import haloBackend from './backend.ts'

test('mission persistence, validation, confirmed inbox and conversation persistence', async () => {
  const original = process.cwd(), temp = await mkdtemp(path.join(tmpdir(), 'halo-backend-'))
  process.chdir(temp)
  let handler
  const plugin = haloBackend()
  plugin.configureServer({ middlewares: { use(fn) { handler = fn } } })
  const server = createServer((req,res)=>handler(req,res,()=>{res.statusCode=404;res.end()}))
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (route, value, method='POST') => fetch(base+route,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(value)})
  try {
    assert.equal((await request('/api/mission',{scenario:'Nominal',logs:[],checkin:{fatigue:99}},'PUT')).status,400)
    const state={scenario:'Nominal',logs:[{id:'a',text:'exercise',synced:false}],checkin:{fatigue:3,mood:'Calm'}}
    assert.equal((await request('/api/mission',state,'PUT')).status,200)
    assert.deepEqual((await (await fetch(base+'/api/mission')).json()).state,state)
    assert.deepEqual((await (await request('/api/sync',{logs:state.logs})).json()).ids,['a'])
    const reply=await (await request('/api/chat',{message:'hello',channel:'halo',context:{},fallback:'Recorded response'})).json()
    assert.ok(reply.answer)
    assert.equal((await (await fetch(base+'/api/chat')).json()).conversations.halo.length,2)
    assert.equal((await fetch(base+'/api/mission',{method:'PUT',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify(state)})).status,403)
  } finally {
    await new Promise(resolve=>server.close(resolve));process.chdir(original);await rm(temp,{recursive:true,force:true})
  }
})

import { createApp } from './start.ts'
test('hosted entry gate protects mission records, validates session, and serves the app', async () => {
  const original=process.cwd(),temp=await mkdtemp(path.join(tmpdir(),'halo-access-'))
  process.chdir(temp)
  const app=createApp({passcode:'test-team-passcode',secret:'isolated-test-secret'})
  const server=createServer((req,res)=>app.handler(req,res))
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${server.address().port}`
  try{
    assert.equal((await fetch(base+'/api/mission')).status,401)
    const rejected=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'passcode=wrong',redirect:'manual'})
    assert.equal(rejected.status,401)
    const response=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'passcode=test-team-passcode',redirect:'manual'})
    assert.equal(response.status,303)
    const cookie=response.headers.get('set-cookie').split(';')[0]
    assert.match(cookie,/halo_session=/)
    assert.equal((await fetch(base+'/api/mission',{headers:{Cookie:cookie}})).status,200)
    assert.equal((await fetch(base+'/api/mission',{headers:{Cookie:cookie+'forged'}})).status,401)
    assert.equal((await fetch(base+'/healthz')).status,200)
  }finally{await new Promise(resolve=>server.close(resolve));await app.close();process.chdir(original);await rm(temp,{recursive:true,force:true})}
})

import {Client} from '@gradio/client'
import {createCloudAI} from './cloud-ai.ts'
test('private cloud adapter validates status, chat and WAV output without exposing credentials',async(t)=>{
 const previous=process.env.HF_TOKEN
 process.env.HF_TOKEN='hf_isolated_test_token'
 const calls=[]
 t.mock.method(Client,'connect',async(space,options)=>{
   assert.equal(space,'RJBee4u/halo-crew-ai')
   assert.equal(options.token,'hf_isolated_test_token')
   return {submit(endpoint,payload){
     calls.push({endpoint,payload})
     const data=endpoint==='/status'?{ai:true,voices:['family-0','invalid'],model:'test-model'}:endpoint==='/chat'?'A generated reply':Buffer.from('RIFF0000WAVEtest').toString('base64')
     return {async *[Symbol.asyncIterator](){yield {type:'data',data:[data]}},cancel(){}}
   }}
 })
 try{
   const cloud=createCloudAI()
   assert.deepEqual(await cloud.status(),{ai:true,voices:['family-0'],model:'test-model'})
   assert.equal(await cloud.chat({message:'hello'}),'A generated reply')
   assert.equal((await cloud.speech({channel:'family-0',text:'hello'})).toString(),'RIFF0000WAVEtest')
   assert.equal(calls.length,3)
   assert.equal(calls.some(x=>JSON.stringify(x.payload).includes('hf_')),false)
 }finally{if(previous===undefined)delete process.env.HF_TOKEN;else process.env.HF_TOKEN=previous}
})
