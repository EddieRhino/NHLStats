import {getPastWeek, getBoxscore, insertSkaterStats} from "../nhl_app.js"

async function importWeekPlayerStats(){
    let date = new Date()
    date.setDate(date.getDate()-7)
    const impDate = date.toISOString().split('T')[0];
    const games = await getPastWeek(impDate)
    for(const game of games){
        const box = await getBoxscore(game.id)
        if(!box) continue
        await insertSkaterStats(game,box)
    }
}
importWeekPlayerStats()