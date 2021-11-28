import { useState } from 'preact/hooks'
import { ServerConnect } from './server_connect.jsx'
import { P2PHost } from './p2phost.jsx'
import { P2PClient } from './p2pclient.jsx'

export function App(props) {
  const [status,setStatus] = useState('menu')
  const [scene,setScene] = useState(null)
  const [playerName,setPlayerName] = useState('PlayerName')

  const start_game = () => {
    setStatus("server")
  }

  const start_p2p_game = () => {
    setStatus("p2phost") 
  }

  const join_p2p_game = () => {
    setStatus("p2pclient")
  }

  if(status == "menu"){
    return <>
      <input value={playerName} onInput={(e) => setPlayerName(e.target.value)} />
      <br/>
      <button onClick={start_game}>Join Server Game</button>
      <br/>
      <button onClick={start_p2p_game}>Host P2P Game</button>
      <button onClick={join_p2p_game}>Join P2P Game</button>
    </>
  }else if(status == "server"){
    return <ServerConnect name={playerName}></ServerConnect>
  }else if(status == "p2phost"){
    return <P2PHost name={playerName}></P2PHost>
  }else if(status == "p2pclient"){
    return <P2PClient name={playerName}></P2PClient>
  }

}
