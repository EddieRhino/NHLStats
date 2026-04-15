import express from "express"
const app = express()
const PORT = 5000
import {getGamesFromDate, getStandings, getTodaysBoxes, getTodaysGames, updateTodaysGames} from "./nhl_app.js"
import {insertGame} from "./nhl_app.js"
import {getBoxscore} from "./nhl_app.js"
import { pool } from "./db.js"
import { startCron } from "./cron.js"
import cors from "cors";


app.use(cors({
    origin: "http://localhost:3000"
}))

app.use(express.json())

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

app.get("/api/skaters/:gameId", async(req,res) => {
    try{
        const gameId = parseInt(req.params.gameId)

        if (!gameId) {
            return res.status(400).json({error: "Bad gameId"})
        }

        const result = await pool.query(
            `SELECT playerid, goals, assists, shots, toi
            FROM reg_stats_skater
            WHERE gameid = $1

            UNION ALL

            SELECT playerid, goals, assists, shots, toi
            FROM pre_stats_skater
            WHERE gameid = $1

            UNION ALL

            SELECT playerid, goals, assists, shots, toi
            FROM post_stats_skater
            WHERE gameid = $1

            ORDER BY goals DESC, assists DESC`,
            [gameId]
        )
        res.json(result.rows)
    }
    catch (err){
        console.error("bad fetch of skaters")
        res.status(500).json({error: "Failure"})
    }
})

app.get(["/api/games","/api/schedule"], async(req,res) => {
    //Maybe implement later something that only goes to the API if games are active (current time > time of a game) otherwise just go to the database
    try{
        const live = await updateTodaysGames()
        if(!live){
            return res.json({
                islive: true,
                games: await getTodaysBoxes()
            })
        }
        else{
            const result_db = await pool.query(
                `SELECT *
                FROM reg_games
                WHERE DATE(time) = CURRENT_DATE
                order BY time ASC`
            )
            if(result_db.rows.length > 0){
                return res.json({
                    islive: false,
                    games: result_db.rows
                })
            }
            else{
                return res.json([])
            }
        }
    }
    catch (err){
        console.error("bad fetch of todays games",err)
        res.status(500).json({error: "Failure"})
    }
})

app.get(["/api/games/:date","/api/schedule/:date"], async(req,res) => {
    try{
        const date = req.params.date
        const result_db = await pool.query(
            `SELECT *
            FROM reg_games
            WHERE DATE(time) = $1`,[date]
        )
        if(result_db.rows.length > 0){
            return res.json(result_db.rows)
        }
        const games_now = await getGamesFromDate(date)
        console.log(games_now)
        if (games_now === null) return;

        const games = []

        for(const day of games_now.gameWeek){
            for(const game of day.games){
                const gameDate = new Date(game.startTimeUTC)
                if(date != gameDate.toISOString().split('T')[0]) continue
                games.push(game)
                const box = await getBoxscore(game.id)
                if (!box) continue
                await insertGame(game,box)
            }
        }
        return res.json(games)
    }
    catch (err){
        console.error("format date as YYYY-MM-DD",err)
        res.status(500).json({error: "Failure"})
    }
})

app.get("/api/standings", async (req, res) => {
    try {
      const data = await getStandings()
      res.json(data)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: "Failed to fetch standings" })
    }
})

app.get("/api/standings/:date", async (req, res) => {
    try {
      const date = req.params
  
      const data = await getStandings(date)
      res.json(data)
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: "Failed to fetch standings" })
    }
})

app.get(["/api/stats","/api/leaders"], async (req, res) => {
    try{
        const result = await pool.query(
            `select * from reg_stats_skater
            order by (goals + assists) desc
            limit 100`
        )
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to get stats" })
    }
})

app.get("/api/boxscore/:gameid", async (req, res) => {
    try{
        const id = parseInt(req.params.gameid)
        const data = await getBoxscore(id)
        res.json(data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch boxscore" })
      }
})

startCron()