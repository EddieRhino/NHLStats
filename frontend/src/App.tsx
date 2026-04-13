import { useState } from "react"
import Standings from "./components/standings.tsx"
import TodaysGames from "./components/games.tsx"
import "./App.css"

export default function App() {
  const [tab, setTab] = useState<"home" | "standings" | "games">("home")

  return (
    <div className="app">
      <header className="header">
        <h1>🏒 NHL Dashboard</h1>

        <nav className="nav">
          <button onClick={() => setTab("home")}>Home</button>
          <button onClick={() => setTab("games")}>Games</button>
          <button onClick={() => setTab("standings")}>Standings</button>
        </nav>
      </header>

      <main className="container">
        {tab === "home" && (
          <div>
            <h2>Welcome 👋</h2>
            <p>Select a tab to view NHL data</p>
          </div>
        )}

        {tab === "standings" && <Standings />}
        {tab === "games" && <TodaysGames />}
      </main>
    </div>
  );
}