import cron from 'node-cron'
import { updateTodaysGames, updateYesterdayGames } from './nhl_app.js'


/**
 * Updates last night's games and inserts todays games 
 * into the database at 9 AM every morning.
 */
export function startCron(){
    cron.schedule('0 9 * * *', async () => {
        console.log("running cron")
        await updateTodaysGames()
        await updateYesterdayGames()
    })
}
