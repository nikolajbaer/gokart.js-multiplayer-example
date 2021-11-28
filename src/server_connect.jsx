import { useState } from 'preact/hooks'
import { createRef } from 'preact'
import { TestClientScene } from './client_scene.js'

export function ServerConnect(props) {
  const [status,setStatus] = useState('menu')
  const [scene,setScene] = useState(null)

  const join_game = () => {
    const name = props.name

    const scene = new TestClientScene(name)
    setStatus("loading")
    scene.load().then( () => {
      setStatus("playing")
      scene.init("render",false)
      scene.start()
    })
    setScene(scene)
  }

  let menu = ''
  if(status == "menu"){
    menu = <>
      <div>
        <strong>Player Name:</strong> 
        {props.name}
      </div>
      <button onClick={join_game}>Join Game</button>
    </>
  }else if(status =="loading"){
    menu = <div>Loading..</div>
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
