import pool from "@/utils/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function ensureAdmin(req){

  const authHeader = req.headers.authorization

  if(!authHeader?.startsWith("Bearer ")){
    return { ok:false, status:401 }
  }

  const token = authHeader.split(" ")[1]

  const {
    data:{ user },
    error
  } = await supabase.auth.getUser(token)

  if(error || !user){
    return { ok:false, status:401 }
  }

  const roleCheck = await pool.query(
    `SELECT role FROM users WHERE id=$1`,
    [user.id]
  )

  if(roleCheck.rows[0]?.role !== "admin"){
    return { ok:false, status:403 }
  }

  return { ok:true }

}

export default async function handler(req,res){

  if(req.method !== "PATCH"){
    return res.status(405).json({message:"Method not allowed"})
  }

  const auth = await ensureAdmin(req)

  if(!auth.ok){
    return res.status(auth.status).json({message:"Forbidden"})
  }

  const { lesson_id, sub_lesson_orders } = req.body

  const client = await pool.connect()

  try{

    await client.query("BEGIN")

    const cases = sub_lesson_orders
      .map(s => `WHEN ${s.id} THEN ${s.order_index}`)
      .join(" ")

    const ids = sub_lesson_orders.map(s=>s.id)

    const query = `
      UPDATE sub_lessons
      SET order_index = CASE id
        ${cases}
      END,
      updated_at = NOW()
      WHERE id = ANY($1)
      AND lesson_id = $2
    `

    await client.query(query,[ids,lesson_id])

    await client.query("COMMIT")

    return res.status(200).json({
      message:"Sub lesson order updated"
    })

  }catch(err){

    await client.query("ROLLBACK")

    console.error(err)

    return res.status(500).json({
      message:"Internal server error"
    })

  }finally{

    client.release()

  }

}