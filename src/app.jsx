import { useState } from 'preact/hooks'
import { createRef } from 'preact'
import { TestClientScene } from './client_scene.js'
import { Conn } from './conn.jsx'

export function App(props) {
  const [status,setStatus] = useState('menu')
  const [scene,setScene] = useState(null)
  const nameRef = createRef()

  const start_game = () => {
    const name = nameRef.current.value || "Player Name"
    const scene = new TestClientScene(name)
    setStatus("loading")
    scene.load().then( () => {
      setStatus("playing")
      scene.init("render",false)
      scene.start()
    })
    setScene(scene)
  }

  const start_p2p_game = () => {
    setStatus("p2p") 
  }

  let menu = ''
  if(status == "menu"){
    menu = <>
      <input ref={nameRef} placeholder="Player Name" />
      <button onClick={start_game}>Start!</button>
      <br/>
      <button onClick={start_p2p_game}>P2P Test</button>
    </>
  }else if(status =="loading"){
    menu = <div>Loading..</div>
  }else if(status == "p2p"){
    menu = <>
      <p>Note: not working yet</p>
      <Conn></Conn>
    </>
  }

  return (
    <>
      <div class="menu">{menu}</div>
      <div id="container">
        <canvas id="render"></canvas>
      </div>
    </>
  )
}
