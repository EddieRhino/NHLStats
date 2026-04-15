import cron from 'node-cron'
import { getBoxscore, getGamesFromDate, importGameNoBox, insertGame, insertGoalieStats, insertSkaterStats } from './nhl_app.js'
import { getTodaysGames } from './nhl_app.js'


/**
 * Updates last night's games and inserts todays games 
 * into the database at 9 AM every morning.
 */
export function startCron(){
    cron.schedule('* * * * *', async () => {
        console.log("running cron")
        let yesterday = new Date()
        yesterday.setDate(yesterday.getDate()-1)
        const yestISO = yesterday.toISOString().split('T')[0]
        const sch = await getTodaysGames()
        const yestSch = await getGamesFromDate(yestISO)

        const todGames = sch.map(game => ({
            id: game.id,
            gameType: game.gameType,
            startTimeUTC: game.startTimeUTC,
            homeTeam: game.homeTeam.abbrev,
            awayTeam: game.awayTeam.abbrev,
            homeScore: game.homeTeam.score ?? 0,
            awayScore: game.awayTeam.score ?? 0
        }))

        for(const game of todGames){
            await importGameNoBox(game)
        }
        const yestGames = yestSch.map(game => ({
            id: game.id,
            gameType: game.gameType,
            startTimeUTC: game.startTimeUTC,
            homeTeam: game.homeTeam.abbrev,
            awayTeam: game.awayTeam.abbrev,
            homeScore: game.homeTeam.score ?? 0,
            awayScore: game.awayTeam.score ?? 0
        }))
                
        for(const game of yestGames){
            const box = await getBoxscore(game.id)
            if(!box) continue
            await insertGame(game, box)
            await insertSkaterStats(game,box)
            await insertGoalieStats(game,box)
        }
    })
}