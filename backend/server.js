const express = require("express")
const client = require("./db")
const app = express()
const PORT = 3000

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

app.get("/test", (req, res) => {
    console.log("TEST HIT");
    res.send("Server works");
})