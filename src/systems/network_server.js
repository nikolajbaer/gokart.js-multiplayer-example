import { System } from "ecsy"
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { NetworkPlayerComponent, NetworkSyncComponent } from "../components/network.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent } from "gokart.js/src/core/components/render.js"
import { ActionListenerComponent } from "../../gokart.js/src/core/components/controls.js"

export class NetworkServerSystem extends System {
  init(attributes){
    this.SI = new SnapshotInterpolation()
    this.snapshot = null
    this.new_entity_callback = attributes?attributes.new_entity_callback:null
  }

  remove_user(channel_id){
    this.queries.players.results.filter( e => {
      return e.getComponent(NetworkPlayerComponent).channel == channel_id 
    }).forEach( e => {
      console.log("removing user "+channel_id+" entity ",e.id)
      e.remove()
    })
  }

  get_init_data(){
    return this.queries.synced.results.map( e => this.entity_init_data(e))
  }

  update_user_actions(channel_id,actions){
    this.queries.players.results.filter( e=> {
      return e.getComponent(NetworkPlayerComponent).channel == channel_id
    }).forEach( e => {
      const action_listener = e.getMutableComponent(ActionListenerComponent)
      if(!action_listener.actions){
        action_listener.actions = {}
      }
      const pactions = action_listener.actions
      Object.keys(actions).forEach( k => {
        let v = Number(actions[k])
        if(!isNaN(v)){ // Ensure it is a number
          if(v > 1){ v = 1 }
          if(v < -1){ v = -1 }
          pactions[k] =  v
        }
      })
      //console.log(channel_id,pactions)
    })
  }

  entity_init_data(e){
    // TODO also sync lights? Do we want this to be genericized?
    const model = e.getComponent(ModelComponent)
    const locrot = e.getComponent(LocRotComponent)
    return {
      id: e.id , // server's entity id
      geom: model.geometry,
      mtl: model.material,
      sx: model.scale.x,
      sy: model.scale.y,
      sz: model.scale.z,
      cshdw: model.cast_shadow,
      rshdw: model.receive_shadow,
      x: locrot.location.x,
      y: locrot.location.y,
      z: locrot.location.z,
      rx: locrot.rotation.x,
      ry: locrot.rotation.y,
      rz: locrot.rotation.z,
      name: e.name,
    }
  }

  get_entity_state(e){
    const locrot = e.getComponent(LocRotComponent)
    const result = {
      id: e.id,
      x: locrot.location.x,
      y: locrot.location.y,
      z: locrot.location.z,
      rx: locrot.rotation.x,
      ry: locrot.rotation.y,
      rz: locrot.rotation.z,
    }
    return result
  }

  execute(delta,time){

    // Send new entities
    if(this.new_entity_callback && this.queries.synced.added.length){
      this.new_entity_callback(this.queries.synced.added.map( e => this.entity_init_data(e) ))
    }

    const world_state = this.queries.synced.results.map( e => this.get_entity_state(e))

    // For any recently removed, we want to send through a remove flag
    this.queries.synced.removed.forEach( e => {
      // CONSIDER what if user misses this event? How do we ensure they are getting removals?
      console.log("sending removal update for " + e.id)
      world_state.push({id:e.id,removed:true})
    })

    const snapshot = this.SI.snapshot.create(world_state)
    this.SI.vault.add(snapshot)
    this.snapshot = snapshot
  
  }
}

// NOTE: we add model component even though we aren't using it to render on
// server, so that we know what to render on the client
NetworkServerSystem.queries = {
  synced: {
    components: [NetworkSyncComponent,LocRotComponent,ModelComponent],
    listen: {
      added: true,
      removed: true,
    }
  },
  players: {
    components: [NetworkPlayerComponent,ActionListenerComponent],
    listen: {
      removed: true
    }
  },
}
