const express = require("express")
const client = require("./db")
const app = express()
const PORT = 3000
const {getTodaysGames} = require("./nhl_app")
const {insertGame} = require("./nhl_app")
const {getBoxscore} = require("./nhl_app")

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

        const result = await client.query(
            `SELECT playerid, goals, assists, shots, toi
            FROM g_stats_skater
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
        const result_db = await client.query(
            `SELECT 
            FROM games
            WHERE DATE(start_time) = CURRENT_DATE`
        )
        if(result_db.rows.length > 0){
            return res.json(result_db)
        }
        const games_now = await getTodaysGames()
        if (games_now === null) return;

        const today = new Date().toDateString()

        for(const day of games_now.gameWeek){
            for(const game of day.games){
                const gameDate = new Date(game.startTimeUTC).toDateString()
                if(today != gameDate) continue
                const box = await getBoxscore(game.id)
                if (!box) continue
                await insertGame(game,box)
            }
        }
    }
    catch (err){
        console.error("bad fetch of todays games")
        res.status(500).json({error: "Failure"})
    }
})
