import express from "express"
const app = express()
const PORT = 3000
import {getTodaysGames} from "./nhl_app.js"
import {insertGame} from "./nhl_app.js"
import {getBoxscore} from "./nhl_app.js"
import { pool } from "./db.js"
import { startCron } from "./cron.js"

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

app.get("/api/games/today", async(req,res) => {
    try{
        const result_db = await pool.query(
            `SELECT *
            FROM reg_games
            WHERE DATE(time) = CURRENT_DATE`
        )
        if(result_db.rows.length > 0){
            return res.json(result_db.rows)
        }
        const games_now = await getTodaysGames()
        if (games_now === null) return;

        const today = new Date().toDateString()
        const todaysGames = []

        for(const day of games_now.gameWeek){
            for(const game of day.games){
                const gameDate = new Date(game.startTimeUTC).toDateString()
                if(today != gameDate) continue
                todaysGames.push(game)
                const box = await getBoxscore(game.id)
                if (!box) continue
                await insertGame(game,box)
            }
        }
        return res.json(todaysGames)
    }
    catch (err){
        console.error("bad fetch of todays games",err)
        res.status(500).json({error: "Failure"})
    }
})
startCron()