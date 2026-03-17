import pool from "@/infrastructure/db"
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

  if(req.method !== "PATCH" && req.method !== "POST"){
    return res.status(405).json({message:"Method not allowed"})
  }

  const auth = await ensureAdmin(req)

  if(!auth.ok){
    return res.status(auth.status).json({message:"Forbidden"})
  }

  const { lesson_id, sub_lesson_orders } = req.body

  if(!lesson_id || !Array.isArray(sub_lesson_orders)){
    return res.status(400).json({message:"lesson_id and sub_lesson_orders required"})
  }

  const client = await pool.connect()

  try{

    await client.query("BEGIN")

    for (const s of sub_lesson_orders) {
      const idNum = Number(s.id)
      const orderNum = Number(s.order_index)
      if (!Number.isFinite(idNum) || !Number.isFinite(orderNum)) {
        throw new Error("Invalid sub_lesson_orders data")
      }
      await client.query(
        `UPDATE sub_lessons SET order_index = $1, updated_at = NOW() WHERE id = $2 AND lesson_id = $3`,
        [orderNum, idNum, Number(lesson_id)]
      )
    }

    await client.query("COMMIT")

    return res.status(200).json({
      message:"Sub lesson order updated"
    })

  }catch(err){

    await client.query("ROLLBACK")

    console.error("Sub-lesson reorder error:", err)

    return res.status(500).json({
      message:"Internal server error"
    })

  }finally{

    client.release()

  }

}