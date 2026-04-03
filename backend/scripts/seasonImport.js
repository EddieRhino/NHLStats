import {getFullSeason} from "../nhl_app.js"
import {importGameNoBox} from "../nhl_app.js"

async function importSeason(season){
    const games = await getFullSeason(season)
    const mapGames = games.map(game => ({
            id: game.id,
            gameType: game.gameType,
            startTimeUTC: game.startTimeUTC,
            homeTeam: game.homeTeam.abbrev,
            awayTeam:game.awayTeam.abbrev,
            homeScore: game.homeTeam.score ?? 0,
            awayScore: game.awayTeam.score ?? 0
        }))
    
    for(const game of mapGames){
        importGameNoBox(game)
    }

}
importSeason(20252026)