import {useEffect, useState} from "react"
import axios from "axios"

type Box = {
    id: number,
    playerByGameStats:{
        homeTeam: teamStats,
        awayTeam: teamStats
    }
}

type teamStats = {
    forwards: Player[],
    defense: Player[],
    goalies: Goalie[]
}

type Player = {
    goals: number,
    assists: number,
    shots: number,
    toi: number
}

type Goalie = {
    shots_faced: number,
    saves: number
}

export default function Boxscore(){
    const [stats, setStats] = useState<teamStats[]>([])
    const [loading, setLoading] = useState(true)
    const fetchBoxscore = async (id) => {
        try{
            const res = await axios.get(`http://localhost:5000/api/boxscore/${id}`)
            const data = res.data
            console.log(data)
        } catch (err) {
            console.error(err);
        } finally{
            setLoading(false)
        }
    }
}