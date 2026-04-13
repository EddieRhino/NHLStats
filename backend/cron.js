import cron from 'node-cron'
import { getBoxscore, getGamesFromDate, importGameNoBox, insertGoalieStats, insertSkaterStats } from './nhl_app.js'
import { getTodaysGames } from './nhl_app.js'

export function startCron(){
    cron.schedule('0 9 * * *', async () => {
        console.log("printing")
        let yesterday = new Date()
        yesterday.setDate(yesterday.getDate()-1)
        const yestISO = yesterday.toISOString().split('T')[0]
        const sch = await getTodaysGames()
        const yestSch = await getGamesFromDate(yestISO)


        const todGames = sch.gameWeek.flatMap(day =>
            day.games.map(game => ({
                id: game.id,
                gameType: game.gameType,
                startTimeUTC: game.startTimeUTC,
                homeTeam: game.homeTeam.abbrev,
                awayTeam: game.awayTeam.abbrev,
                homeScore: game.homeTeam.score ?? 0,
                awayScore: game.awayTeam.score ?? 0
            }))
        )

        for(const game of todGames){
            importGameNoBox(game)
        }

        const yestGames = yestSch.gameWeek.flatMap(day =>
            day.games.map(game => ({
                id: game.id,
                gameType: game.gameType,
                startTimeUTC: game.startTimeUTC,
                homeTeam: game.homeTeam.abbrev,
                awayTeam: game.awayTeam.abbrev,
                homeScore: game.homeTeam.score ?? 0,
                awayScore: game.awayTeam.score ?? 0
            }))
        )
        for(const game of yestGames){
            importGameNoBox(game)
            const box = getBoxscore(game)
            if(!box) continue
            insertSkaterStats(game,box)
            insertGoalieStats(game,box)
        }
    })
}