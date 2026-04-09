import {getPastWeek, getBoxscore, insertGoalieStats} from "../nhl_app.js"

async function importWeekGoalieStats(){
    let date = new Date()
    date.setDate(date.getDate()-7)
    const impDate = date.toISOString().split('T')[0];
    const games = await getPastWeek(impDate)
    for(const game of games){
        const box = await getBoxscore(game.id)
        if(!box) continue
        console.log(game)
        await insertGoalieStats(game,box)
    }
}
importWeekGoalieStats()