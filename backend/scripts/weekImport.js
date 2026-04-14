import { getBoxscore, getPastWeek, importGameNoBox, insertGame } from "../nhl_app.js"

async function importPastWeek(){
    let date = new Date()
    date.setDate(date.getDate()-7)
    const impDate = date.toISOString().split('T')[0]
    const games = await getPastWeek(impDate)
    for(const game of games){
        //console.log(game)
        const box = await getBoxscore(game.id)
        if(!box){
            importGameNoBox(game)
        }
        else{
            insertGame(game,box)
        }
    }
}
importPastWeek()