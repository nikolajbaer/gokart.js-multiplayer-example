import geckos from '@geckos.io/server'

import { TestServerScene } from './server_scene.js'

// How many ticks can you do per second? 
// Can we identify if we are falling behind?
const TICK = 20

// https://github.com/geckosio/geckos.io/issues/99#issuecomment-874893807
const io = geckos({
 portRange: {
    min: 50000,
    max: 50200
  }
})

io.listen(9208) // default port is 9208

// Our clients / room.. todo make multiple rooms, with 1 scene per
const clients = {}
let room = null

function on_new_entity(init_data){
  console.log("Sending new entities:",init_data.length," to ",Object.keys(clients).length," clients")
  io.room(room).emit('init',init_data)
}

const scene = new TestServerScene(on_new_entity)
scene.init(null,false)
//scene.start()
scene.init_entities()
const UPDATE_INTERVAL = 1000/TICK
function loop(){
  scene.loop()
  io.room(room).emit('update',scene.get_snapshot())
}

const updateLoop = setInterval(loop, UPDATE_INTERVAL, scene)

io.onConnection(channel => {
  console.log("Connection!",channel.id," in room ",channel.roomId)
  if(!room){ room = channel.roomId }

  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
    scene.remove_user(channel.id)
  })

  scene.add_user(channel.id)

  // When a client connects, we send them a factory of what to 
  // entities to initialize that are synced, including geometry data
  channel.emit('init',scene.get_init_data())

  channel.on('actions', data => {
    scene.update_user_actions(channel.id,data)
  })

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io.room(channel.roomId).emit('chat message', data)
  })
})
