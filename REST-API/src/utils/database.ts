import pg from 'pg'

const { Pool } = pg
 
const pool = new Pool({
    user: 'postgres',
    password: '95854711',
    host: 'localhost',
    port: 5432,
    database: 'Unify',
})
 
export const query = (text, params) => pool.query(text, params)
export default pool
