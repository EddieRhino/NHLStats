import {useEffect, useState} from "react"
import axios from "axios"

type Game = {
    id: number,
    homeTeam: string,
    awayTeam: string,
    startTimeUTC: string,
    homeScore: number,
    awayScore: number,
    gameState: "PRE" | "LIVE" | "FINAL" | "CRIT" | "OFF" | "FUT",
    period?: number,
    clock?: {
        timeRemaining?: string,
        running?: boolean,
        intermission?: boolean
    }
}

export default function TodaysGames(){
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)

    const getGameDisplay = (game: Game) => {
        switch (game.gameState){
            case "LIVE":
            case "CRIT":
                return `P${game.period} | ${game.clock?.timeRemaining}`
            
            case "FINAL":
            case "OFF":
                return "FINAL"
            
            case "PRE":
            case "FUT":
            default:
                return new Date(game.startTimeUTC).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
        }

    }

    const fetchGames = async () => {
        try{
            const res = await axios.get("http://localhost:5000/api/games")
            const data = res.data
            console.log(data)
            setGames(data.games || [])
        } catch (err) {
            console.error(err);
        } finally{
            setLoading(false)
        }
    }

    useEffect (() => {
        fetchGames()
    },[])
    useEffect(() => {
        console.log(games)
        if(!games.length) return
        const isLive = games.some(
            g => g.gameState === "LIVE" || g.gameState === "CRIT"
          )
        if(!isLive) return
        const interval = setInterval(() => {
            fetchGames()
        }, 30000)
        console.log("updating")
        return () => clearInterval(interval)
    },[games])
        
    if (loading) return <p>Loading...</p>;
    console.log(games)
    return (
        <div>
            <h1>NHL GAMES TODAY</h1>
            {games.map((game, i) => (
            <div key={i}>
                <div>
                {game.awayTeam} {game.awayScore} - {game.homeTeam} {game.homeScore} {game.gameState}
                {" | "}
                {getGameDisplay(game)}
                {(game.gameState === "LIVE" || game.gameState === "CRIT" || game.gameState === "FUT") && (
                    <button
                        onClick={() => console.log("boxscore for ", game.id)}
                    >
                        BOX
                    </button>
                )}
                </div>
                <br />
            </div>


        ))}
        </div>
    )
}