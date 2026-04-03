import cron from 'node-cron'

export function startCron(){
    cron.schedule('0 9 * * *', async () => {
        
    })
}