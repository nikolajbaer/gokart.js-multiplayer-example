import {useEffect,useState} from 'preact/hooks'
import { TestClientScene } from './scene.js'

export function App(props) {
  const [status,setStatus] = useState('menu')
  const [scene,setScene] = useState(null)

  const start_game = () => {
    const scene = new TestClientScene() 
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
    menu = <button onClick={start_game}>Start!</button>
  }else if(status =="loading"){
    menu = <div>Loading..</div>
  }

  return (
    <>
      <div class="menu">{menu}</div>
      <canvas id="render"></canvas>
    </>
  )
}
