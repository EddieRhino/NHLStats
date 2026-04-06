import {getFullSeason, getBoxscore, insertSkaterStats} from "../nhl_app.js"

async function importSeasonPlayerStats(season){
    const games = await getFullSeason(season)
    for(const game of games){
        const box = await getBoxscore(game.id)
        if(!box) continue
        await insertSkaterStats(game,box)
    }
}
importSeasonPlayerStats(20252026)