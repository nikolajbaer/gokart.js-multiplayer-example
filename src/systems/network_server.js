import { System } from "ecsy"
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation'
import { NetworkPlayerComponent, NetworkSyncComponent } from "../components/network.js"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"

export class NetworkServerSystem extends System {
  init(attributes){
    this.SI = new SnapshotInterpolation()
    this.snapshot = null
    this.new_entity_callback = attributes?attributes.new_entity_callback:null
    this.serializer = attributes.serializer
  }

  remove_user(channel_id){
    this.queries.players.results.filter( e => {
      return e.getComponent(NetworkPlayerComponent).channel == channel_id 
    }).forEach( e => {
      const np = e.getComponent(NetworkPlayerComponent)
      console.log(`removing user ${np.name}, channel ${np.channel}, entity ${e.id}`)
      e.remove()
    })
  }

  get_init_data(){
    return this.queries.synced.results.map( e => this.serializer.get_entity_init(e,e.getComponent(NetworkSyncComponent).sync) )
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

  execute(delta,time){

    // Send new entities
    if(this.new_entity_callback && this.queries.synced.added.length){
      this.new_entity_callback(this.queries.synced.added.map( e => this.serializer.get_entity_init(e,e.getComponent(NetworkSyncComponent).sync) ))
    }

    const world_state = this.queries.synced.results.filter( e => e.getComponent(NetworkSyncComponent).sync ).map( e => this.serializer.get_entity_state(e) )

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
    components: [NetworkSyncComponent],
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