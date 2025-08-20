import { useNavigate } from 'react-router-dom'
import Canvas from './components/Canvas'
import UserLoginBoxes from './components/UserLoginBoxes'
import Timer from './components/Timer'
import PlayAgainButton from './components/PlayAgainButton'
import OtherPlayersDisplay from './components/OtherPlayersDisplay'
import './index.css'

function App() {

  return (
    <div className="container">
      <div className="left-panel">
        <h1>
          <span className = "red">f</span>
          <span className = "green">r</span>
          <span className = "blue">e</span>
          <span className = "yellow">e </span>
          <span className = "red">f</span>
          <span className = "green">l</span>
          <span className = "blue">o</span>
          <span className = "yellow">w</span>
        </h1>
        <UserLoginBoxes />
      </div>
      <div className="right-panel">
        <Timer />
        <Canvas />
        <PlayAgainButton/>
      </div>
      <div className="player-panel">
        <h1>Game Lobby</h1>
        <OtherPlayersDisplay />
      </div>
    </div>
  )
}

export default App
