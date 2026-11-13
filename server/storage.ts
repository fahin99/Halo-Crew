import { readFile, writeFile, mkdir, rename } from "node:fs/promises"
import path from "node:path"
import pg from "pg"

export default function createStorage(databaseUrl = process.env.DATABASE_URL, directory = path.resolve(".halo-data")) {
  const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl, max: 3 }) : null
  const ready = pool ? pool.query("CREATE TABLE IF NOT EXISTS halo_records (name TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())") : Promise.resolve()
  const read = async (name: string) => {
    await ready
    if(pool) {const result=await pool.query("SELECT value FROM halo_records WHERE name=$1",[name]);return result.rows[0]?.value ?? null}
    try { return JSON.parse(await readFile(path.join(directory,name+".json"),"utf8")) }
    catch(error: any){if(error.code==="ENOENT")return null;throw error}
  }
  const write = async (name: string, value: unknown) => {
    await ready
    if(pool){await pool.query("INSERT INTO halo_records(name,value) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[name,JSON.stringify(value)]);return}
    await mkdir(directory,{recursive:true,mode:0o700});const target=path.join(directory,name+".json")
    await writeFile(target+".tmp",JSON.stringify(value),{mode:0o600});await rename(target+".tmp",target)
  }
  return {read,write,ready,close:()=>pool?.end(),kind:pool?"shared-database":"local-server"}
}
