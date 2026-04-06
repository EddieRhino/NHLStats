import axios from "axios"
import { pool } from "./db.js"


/**
 * Gets all the games being played today.
 * @returns {array} The data of all the games being played today.
 */
export async function getTodaysGames() {
    try {
        const resp = await axios.get("https://api-web.nhle.com/v1/schedule/now");
        return resp.data;
    } catch (error) {
        console.error("Error", error);
        return null;
    }
}

export async function getGamesFromDate(date){
    try {
        const resp = await axios.get(`https://api-web.nhle.com/v1/schedule/${date}`);
        return resp.data;
    } catch (error) {
        console.error("Error", error);
        return null;
    }
}

/**
 * Gets all the game IDs being played today.
 * @param {array} The schedule of the games, returned from getTodaysGames()
 * @returns {array} The gameIDs of all the games being played today.
 */
async function getGameIDs(schedule){
    return schedule.gameWeek
        .flatMap(day => day.games)
        .map(game => game.id)
}

/**
 * Gets a boxscore from the game ID
 * @param {number} The game ID of the requested boxscore
 * @returns {array} The boxscore of the game
 */
export async function getBoxscore(gameID){
    try {
        const resp = await axios.get(`https://api-web.nhle.com/v1/gamecenter/${gameID}/boxscore`)
        return resp.data
    }
    catch (error){
        console.log("error", error)
        return null
    }
}

/**
 * Converts a player's time on ice into seconds
 * @param {number} The time on ice of a player in MM:SS
 * @returns {number} The time on ice of a player in seconds
 */
function toiToSeconds(toi){
    if(toi === undefined){
        return 0
    }
    const [min,sec] = toi.split(":").map(Number)
    return min * 60 + sec
}

/**
 * Adds all skater stats to the SQL database from the game
 * @param {number} The game object of the requested game
 * @param {array} The boxscore of the game
 */
export async function insertSkaterStats(game, data){
    if (!data?.playerByGameStats?.homeTeam) {
        return
    }
    const gameNum = game.gameType
    let gameType = ""

    if(gameNum == 1){
        gameType = "pre_stats_skater"
    }
    else if(gameNum == 2){
        gameType = "reg_stats_skater"
    }
    else{
        gameType = "post_stats_skater"
    }

    const skaters = [
        ...data.playerByGameStats.homeTeam.forwards,
        ...data.playerByGameStats.homeTeam.defense,
        ...data.playerByGameStats.awayTeam.forwards,
        ...data.playerByGameStats.awayTeam.defense
    ]
    for(const player of skaters){
        await pool.query(
            `INSERT INTO ${gameType}
            (playerid, gameid, goals, assists, shots, toi)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (playerid, gameid) DO NOTHING`,
        [
            player.playerId,
            game.id,
            player.goals || 0,
            player.assists || 0,
            player.sog || 0,
            toiToSeconds(player.toi) || 0
        ]
        )
    }
}

/**
 * Adds all goalie stats to the SQL database from the game
 * @param {number} The game object of the requested game
 * @param {array} The boxscore of the game
 */
export async function insertGoalieStats(game,data){
    if (!data?.playerByGameStats?.homeTeam?.goalies) {
        return
    }

    const gameNum = game.gameType
    let gameType = ""

    if(gameNum == 1){
        gameType = "pre_stats_goalie"
    }
    else if(gameNum == 2){
        gameType = "reg_stats_goalie"
    }
    else{
        gameType = "post_stats_goalie"
    }

    const goalies = [
        ...data.playerByGameStats.homeTeam.goalies,
        ...data.playerByGameStats.awayTeam.goalies
    ]

    for(const player of goalies){
        await pool.query(
            `INSERT INTO ${gameType}
            (playerid, gameid, shots_faced, saves)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (playerid, gameid) DO NOTHING`,
        [
            player.playerId,
            game.id,
            player.shotsAgainst || 0,
            player.saves || 0
        ]
        )
    }
}

/**
 * Adds a game to the database
 * @param {array} The game being added to the SQL database
 * @param {array} The boxscore of the game
 */
export async function insertGame(game,box){
    const homeTeam = box?.homeTeam?.abbrev
    const awayTeam = box?.awayTeam?.abbrev

    const homeScore = box?.homeTeam?.score ?? 0
    const awayScore = box?.awayTeam?.score ?? 0

    const gameNum = game.gameType
    let gameType = ""

    if(gameNum == 1){
        gameType = "pre_games"
    }
    else if(gameNum == 2){
        gameType = "reg_games"
    }
    else{
        gameType = "post_games"
    }
    //console.log(game)
    const dateGame = new Date(game.startTimeUTC)
    //console.log(dateGame)

    await pool.query(
        `INSERT INTO ${gameType}
        (gameid, time, hometeam, awayteam, homescore, awayscore)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (gameid)
        DO UPDATE SET
        homescore = EXCLUDED.homescore,
        awayscore = EXCLUDED.awayscore`,
        [
            game.id,
            dateGame,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore
        ]
    )
}
export async function importGameNoBox(game){

    const gameNum = game.gameType
    let gameType = ""

    if(gameNum == 1){
        gameType = "pre_games"
    }
    else if(gameNum == 2){
        gameType = "reg_games"
    }
    else{
        gameType = "post_games"
    }
    //console.log(game)
    const dateGame = new Date(game.startTimeUTC)

    await pool.query(
        `INSERT INTO ${gameType}
        (gameid, time, hometeam, awayteam, homescore, awayscore)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (gameid)
        DO UPDATE SET
        homescore = EXCLUDED.homescore,
        awayscore = EXCLUDED.awayscore`,
        [
            game.id,
            dateGame,
            game.homeTeam,
            game.awayTeam,
            game.homeScore || 0,
            game.awayScore || 0
        ]
    )
}


/**
 * Adds a regular season game to the database
 * @param {array} The game being added to the SQL database
 * @param {array} The boxscore of the game
 */

/**
 * Adds the stats from today's NHL games to the SQL database.
 */
async function ingestStats(){
    const schedule = await getTodaysGames()
    if (schedule === null) return;

    const todaysGames = []
    const today = new Date().toDateString()
    // const yesterday = new Date()
    // yesterday.setDate(today.getDate() - 1)

    schedule.gameWeek.forEach(day => {
        day.games.forEach(game => {
            const gameDate = new Date(game.startTimeUTC).toDateString()

            if (today === gameDate) {
                todaysGames.push(game)
            }
        });
    })
    for (const game of todaysGames){
        const box = await getBoxscore(game.id)
        if(!box) continue
    
        await insertGame(game,box)

        await insertSkaterStats(game,box)
        await insertGoalieStats(game,box)
    }
 
}







/**
 * Prints all of today's games, primarily used for testing
 */
async function printTodaysGames() {
    const schedule = await getTodaysGames();
    if (schedule === null) return;

    const todaysGames = []
    const today = new Date().toDateString();

    schedule.gameWeek.forEach(day => {
        day.games.forEach(game => {
            const gameDate = new Date(game.startTimeUTC).toDateString()

            if (today === gameDate) {
                todaysGames.push({
                    gameId: game.id,
                    homeTeam: game.homeTeam.abbrev,
                    awayTeam: game.awayTeam.abbrev,
                    startTime: game.startTimeUTC
                })
            }
        })
    })

    if (todaysGames.length === 0) {
        console.log("No games today!")
    } else {
        console.log("Today's Games:")
        todaysGames.forEach(game => {
            const localTime = new Date(game.startTime).toLocaleString()

            console.log(`${game.awayTeam} @ ${game.homeTeam} | Start: ${localTime}`)
        })
    }
}

/**
 * Gets all the games from the requested season
 * @param {number} The year of the season to get, returns season that started in that year, 2025 returns 2025-26 season.
 * @returns {array} All the game objects from the requested year (including preseason, regular season, playoffs)
 */
export async function getFullSeason(season){
    try{
        const year = season.toString().substring(0,4)
        const resp = await axios.get(`https://api-web.nhle.com/v1/standings/${year}-12-01`)
        const teams = resp.data.standings
            .flatMap(team => team.teamAbbrev.default)
        const games = []
        for(const team of teams){
            let response = await axios.get(`https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`)
            // console.log(response.data.games
            //     .flatMap(game => game.homeTeam)
            //     .flatMap(team => team.abbrev)  
            // )
            games.push(...response.data.games)
       }
       return games
       
    }
    catch (err) {
        console.error(err.response?.status)
        console.error(err.response?.data)
        console.error(err.message)
        return null;
    }
}
