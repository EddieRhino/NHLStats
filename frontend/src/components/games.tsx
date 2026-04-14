import {useEffect, useState} from "react"
import axios from "axios"

// type Game = {
//     hometeam: string,
//     awayteam: string,
//     time: string,
//     homescore: number,
//     awayscore: number
// }

export default function TodaysGames(){
    const [games, setGames] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect (() => {
        const fetchGames = async () => {
            try{
                const res = await axios.get("http://localhost:5000/api/games")
                const data = res.data
                setGames(data)
            } catch (err) {
                console.error(err);
            } finally{
                setLoading(false)
            }
        }
        fetchGames()
    },[])
    if (loading) return <p>Loading...</p>;
    return (
        <div>
            <h1>NHL GAMES TODAY</h1>
            {games.map((game, i) => (
            <div key={i}>
                <div>
                {game.awayteam}: {game.awayscore} - {game.hometeam}: {game.homescore} 
                {" | "} {new Date(game.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })} 
                </div>
                <br />
            </div>

        ))}
        </div>
    )
}