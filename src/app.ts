import express from 'express'
import { Request, Response } from 'express'
import pg from 'pg'
import dotenv from 'dotenv'
import joi from 'joi'

const movieSchema = joi.object({
  name: joi.string().required(),
  plataformId: joi.number().required(),
  genreId: joi.number().required()
})

const reviewSchema = joi.object({
  score: joi.number().integer().min(1).max(5),
  description: joi.string().allow('')
})

type Movie = {
  id: number,
  name: string,
  plataformId: number,
  genreId: number,
  statusId: number,
  score?: number,
  description?: string
}

type NewMovie = {
  name: string,
  plataformId: number,
  genreId: number
}

type Review = { 
  score: number,
  description: string
}

dotenv.config()

const { Pool } = pg

const connection = new Pool({ host: 'localhost',
port: 5432,
user: 'postgres',
password: 'rayana',
database: 'cinelist'
 })

const server = express();
server.use(express.json())

server.get('/health', (req :Request , res : Response) => {
  res.send('ok')
})


server.post('/movies',async (req :Request , res : Response) => {

  const {name, plataformId, genreId} : NewMovie = req.body
  const validMovie = movieSchema.validate({name, plataformId, genreId})

  try {

    if (validMovie.error) {
      return res.send(400)
    }

    await connection.query('insert into movies (name,"plataformId","genreId") values ($1, $2, $3)',[name, plataformId, genreId])

    return res.send(200)
  } catch {
    return res.send(500)
  }
  
})

server.post('/review/:id', async (req :Request , res : Response) => {
  const movieId = req.params
  const {score, description}: Review = req.body

  const validReview = reviewSchema.validate({ score, description })

  try {
    const movieExist: pg.QueryResult<Movie> = await connection.query(
      'SELECT id FROM movies WHERE id = $1',
      [movieId.id]
    )

    if (movieExist.rows.length === 0) {
      return res.send(404)
    }

    if (validReview.error) {
      return res.send(400)
    }

    await connection.query('UPDATE movies SET "statusId" = 1, description = $1, score = $2 WHERE id=$3', [description, score, movieId.id])
    return res.send(200)
  } catch {
    return res.send(500)
  }
})

server.get('/movies', async (req :Request , res : Response) => {
  try{
    const movies: pg.QueryResult<Movie> = await connection.query('select movies.id, movies.name, plataform.name as plataform, genre.name as genre, status.name as status, movies.score, movies.description from movies JOIN plataform ON movies."plataformId" = plataform.id JOIN genre ON movies."genreId" = genre.id JOIN status ON movies."statusId" = status.id;')
    
    return res.send(movies.rows)
  }catch{return res.send(500)}
} )

server.get('/plataforms/:id',async (req :Request , res : Response) => {
  const plataformId = req.params

  try{
    
    const plataformExist: pg.QueryResult<Movie> = await connection.query(
    'SELECT * FROM movies WHERE id = $1',
    [plataformId.id])

  if (plataformExist.rows.length === 0) {
    return res.send(404)
  }

  const platformMovies: pg.QueryResult<Movie> = await connection.query('select movies.id, movies.name, plataform.name as plataform, genre.name as genre, status.name as status, movies.score, movies.description from movies JOIN plataform ON movies."plataformId" = plataform.id JOIN genre ON movies."genreId" = genre.id JOIN status ON movies."statusId" = status.id WHERE "plataformId" = $1;',[plataformId.id])

  return res.send(platformMovies.rows)
  
  }catch{
    return res.send(500)
  }
})

server.delete('/movies/:id',async (req :Request , res : Response) => {

  const movieId = req.params

  try {
    const movieExist: pg.QueryResult<Movie> = await connection.query(
      'SELECT * FROM movies WHERE id = $1',
      [movieId.id]
    )

    if (movieExist.rows.length === 0) {
      return res.send(404)
    }

    await connection.query('DELET * FOM movies WHERE id= $1', [movieId])

    return res.send(200)
  } catch {
    return res.send(500)
  }

})

server.listen(4000, ()=> {
  console.log('Listening!!!')
})