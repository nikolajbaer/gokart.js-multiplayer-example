import { System } from "ecsy"
import { geckos } from "@geckos.io/client"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"
import { NetworkSyncComponent } from "../components/network.js"
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation"

export class NetworkClientSystem extends System {
  init(attributes){
    this.channel = geckos() // default port is 9208
    console.log("Connecting")
    this.SI = new SnapshotInterpolation(32) // TODO get fps from server on init?
    this.serializer = attributes.serializer
    this.player_id = null

    this.channel.onConnect(error => {
      console.log("Connected!")
      if(error){ console.error(error.message) }

      // We may want this to be connected to preact, and just pass the update messages directly here?
      this.channel.on('chat message', data => {
        console.log('chat message',data)
      })

      this.channel.on('init', data => {
        this.initialize_entities(data)
      })

      this.channel.on('update', data => {
        this.SI.snapshot.add(data)
      })

      this.channel.on('player', data => {
        this.player_id = data.player_id
        console.log("My player id is "+this.player_id)
      })

      this.player_name = attributes?attributes.player_name:null
      if(!this.player_name){ this.player_name = "Player Name" }
      this.channel.emit('spawn',{name:this.player_name})

    })

    // Map containing server Ids we currently sync
    // to efficiently prevent duplicates
    this.synced = {}
  }

  initialize_entities(server_entities){
    console.log("initializing",server_entities)

    server_entities.forEach( data => {
      if(data.id == this.player_id){
        console.log("received player's entity: ",data.id,(this.synced[data.id])?"already exists":"not yet synced")
        if(this.synced[data.id]){
          console.log("race condition, already received player entity, removing to recreate")
          this.synced[data.id].remove()
        }
        const e = this.world.createEntity()
        this.serializer.process_player_entity_init(data,e)
      }else{
        if(this.synced[data.id]){ return } // don't duplicate
        const e = this.world.createEntity()
        this.serializer.process_entity_init(data,e)
      }
    })
  }

  execute(delta,time){
    // TODO Lage Compensated shot
    // e.g. https://github.com/geckosio/snapshot-interpolation/blob/master/example/client/index.js#L242
    // and https://github.com/geckosio/snapshot-interpolation/blob/master/example/server/index.js#L35

    this.queries.action_listeners.results.forEach( e => {
      const actions = e.getComponent(ActionListenerComponent).actions
      this.channel.emit(
        'actions',
        actions
      )
      // Todo differentiate between reliable and movement
        // { reliable: true }
    })

    this.queries.network_entities.added.forEach( e => {
      this.synced[e.getComponent(NetworkSyncComponent).id] = true
    })
    this.queries.network_entities.removed.forEach( e => {
      delete this.synced[e.getComponent(NetworkSyncComponent).id]
    })

    // Update from snapshot system once we have one
    // todo make quat contained
    const snapshot = this.SI.calcInterpolation(this.serializer.interpolation)
    if(snapshot){
      const { state } = snapshot

      // build dict of entities to sync
      const to_sync = {}
      this.queries.network_entities.results.filter( e => e.getComponent(NetworkSyncComponent).sync ).forEach( e => {
        const ns = e.getComponent(NetworkSyncComponent)
        to_sync[ns.id] = e
      })

      // walk through updated state and update entities
      state.forEach( snap => {
        let e = null
        if(to_sync[snap.id]){
          e = to_sync[snap.id]
        }else{
          // Missing entity, TODO request init
          return
        }
        if(snap.removed){
          e.remove()
          return
        }
        this.serializer.process_entity_update(e,snap)
      })
    }
  }
}

NetworkClientSystem.queries = {
  action_listeners: {
    components: [ActionListenerComponent]
  },
  network_entities: {
    components: [NetworkSyncComponent],
    listen: {
      added: true,
      removed: true,
    }
  }
}

