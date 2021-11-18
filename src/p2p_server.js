import { RTCPeer } from "./rtc_peer.js"
import { TestServerScene } from "./server_scene.js"


// Should the p2p server be hosted separate from the local client?
//

const TICK = 32

export class P2PServer {
  constructor(){
    this.peers = []
    this.scene = new TestServerScene( init_data => this.on_new_entity(init_data) )
    this.scene.init(null,false)
  }

  // required handler
  on_new_entity(init_data){
    this.peers.forEach( peer => {
      peer.send_data('init',init_data,true) // reliable
    }) 
  }

  create_peer(){
    const peer = new RTCPeer(
      (status) => console.log("New Status for peer: ",status),
      (type,data) => this.handle_message(peer,type,data)
    )
    this.peers.push(peer)
    return peer
  }

  handle_message(peer,type,data){
    switch(type){
      case "spawn":
        const player_id = this.scene.add_user(peer.id,data)
        peer.send_data('player',{player_id:player_id},true) // todo Reliable
        break
      case "init":
        peer.send_data("init",this.scene.get_init_data(),true) // todo reliable
        break
      case "actions":
        this.scene.update_user_actions(peer.id,data)
        break
      case "chat message":
        console.log("not implemented")
        break
    }
  }

  loop(){
    this.peers.forEach( p => {
      p.send_data('update',this.scene.get_snapshot(),false)
    })
  }
}