import {getFullSeason, getBoxscore, insertGoalieStats} from "../nhl_app.js"

async function importSeasonGoalieStats(season){
    const games = await getFullSeason(season)
    for(const game of games){
        const box = await getBoxscore(game.id)
        if(!box) continue
        //console.log(game.id)
        await insertGoalieStats(game,box)
    }
}
importSeasonGoalieStats(20252026)