import { useEffect,useState } from "react";
import axios from "axios"

type Team = {
    teamName: {
        default:string;
    }
    wins: number;
    losses: number;
    ot_losses: number;
    points: number;
    teamLogo:string
  };

export default function Standings(){
    const [standings, setStandings] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)

    useEffect (() => {
        const fetchStandings = async () => {
            try{
                const res = await axios.get("http://localhost:5000/api/standings")
                const data = res.data
                console.log(data)
                setStandings(data.standings)
            } catch (err) {
                console.error(err);
            } finally{
                setLoading(false)
            } 
        }
        fetchStandings()
    },[])
    if (loading) return <p>Loading...</p>;
    return (
        <div>
            <h1>NHL STANDINGS</h1>
            {standings.map((team, i) => (
            <div key={i}>
                <img src={team.teamLogo} width={30} />
                {team.teamName?.default} - {team.points}
            </div>
        ))}
        </div>
    )
}