const axios = require("axios");
const client = require("./db")

async function getTodaysGames() {
    try {
        const resp = await axios.get("https://api-web.nhle.com/v1/schedule/now");
        return resp.data;
    } catch (error) {
        console.error("Error", error);
        return null;
    }
}

async function getGameIDs(schedule){
    return schedule.gameWeek
        .flatMap(day => day.games)
        .map(game => game.id)
}

async function getBoxscore(gameID){
    try {
        const resp = await axios.get(`https://api-web.nhle.com/v1/gamecenter/${gameID}/boxscore`)
        return resp.data
    }
    catch (error){
        console.log("error", error)
        return null
    }
}

function toiToSeconds(toi){
    const [min,sec] = toi.split(":").map(Number)
    return min * 60 + sec
}

async function insertSkaterStats(gameId, data){
    const skaters = [
        ...data.playerByGameStats.homeTeam.forwards,
        ...data.playerByGameStats.homeTeam.defense,
        ...data.playerByGameStats.awayTeam.forwards,
        ...data.playerByGameStats.awayTeam.defense
    ]
    for(const player of skaters){
        await client.query(
            `INSERT INTO g_stats_skater
            (playerid, gameid, goals, assists, shots, toi)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (playerid, gameid) DO NOTHING`,
        [
            player.playerId,
            gameId,
            player.goals || 0,
            player.assists || 0,
            player.sog || 0,
            toiToSeconds(player.toi) || 0
        ]
        )
    }
}

async function insertGoalieStats(gameId,data){
    const goalies = [
        ...data.playerByGameStats.homeTeam.goalies,
        ...data.playerByGameStats.awayTeam.goalies
    ]

    for(const player of goalies){
        await client.query(
            `INSERT INTO g_stats_goalie
            (playerid, gameid, shots_faced, saves)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (playerid, gameid) DO NOTHING`,
        [
            player.playerId,
            gameId,
            player.shotsAgainst || 0,
            player.saves || 0
        ]
        )
    }
}

async function ingestStats(){
    const schedule = await getTodaysGames();
    if (schedule === null) return;

    const todaysGames = []
    const today = new Date().toDateString();

    schedule.gameWeek.forEach(day => {
        day.games.forEach(game => {
            const gameDate = new Date(game.startTimeUTC).toDateString();

            if (today === gameDate) {
                todaysGames.push({
                    gameId: game.id,
                });
            }
        });
    });
    for (const game of todaysGames){
        const box = await getBoxscore(game.gameId)
        if(!box) continue

        await insertSkaterStats(game.gameId,box)
        await insertGoalieStats(game.gameId,box)
    }

    client.end()

}








async function printTodaysGames() {
    const schedule = await getTodaysGames();
    if (schedule === null) return;

    const todaysGames = []
    const today = new Date().toDateString();

    schedule.gameWeek.forEach(day => {
        day.games.forEach(game => {
            const gameDate = new Date(game.startTimeUTC).toDateString();

            if (today === gameDate) {
                todaysGames.push({
                    gameId: game.id,
                    homeTeam: game.homeTeam.abbrev,
                    awayTeam: game.awayTeam.abbrev,
                    startTime: game.startTimeUTC
                });
            }
        });
    });

    if (todaysGames.length === 0) {
        console.log("No games today!");
    } else {
        console.log("Today's Games:");
        todaysGames.forEach(game => {
            const localTime = new Date(game.startTime).toLocaleString()

            console.log(`${game.awayTeam} @ ${game.homeTeam} | Start: ${localTime}`);
        });
    }
}

printTodaysGames()
ingestStats()