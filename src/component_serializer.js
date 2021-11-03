import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent, UpdateFromLocRotComponent } from "gokart.js/src/core/components/render.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "./components/network.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { BodyComponent, PhysicsComponent, PhysicsControllerComponent } from "gokart.js/src/core/components/physics.js"

export class ComponentSerializer {
  constructor(){
    // How we map components from entities
    this.components = this.create_component_mapping()
  }

  // Override this to customize how components get initialized / updated  for Network Synced Entities
  create_component_mapping(){
    return [
      {
        component: LocRotComponent,
        serialize: (c) => {
          return {
            x: c.location.x,
            y: c.location.y,
            z: c.location.z,
            rx: c.rotation.x,
            ry: c.rotation.y,
            rz: c.rotation.z,
          }
        },
        deserialize: (d) => {
          return {
            location:new Vector3(d.x,d.y,d.z),
            rotation:new Vector3(d.rx,d.ry,d.rz)
          }
        },
        state: (c,d) => {
          d.x = c.location.x
          d.y = c.location.y
          d.z = c.location.z
          d.rx = c.rotation.x
          d.ry = c.rotation.y
          d.rz = c.rotation.z
        },
        update: (d,c) => {
          c.location.x = d.x
          c.location.y = d.y
          c.location.z = d.z
          c.rotation.x = d.rx
          c.rotation.y = d.ry
          c.rotation.z = d.rz
        },
        interpolate: "x y z rx ry rz"
      },
      {
        component: ModelComponent,
        serialize: (c) => {
          return {
            geom: model.geometry,
            mtl: model.material,
            sx: model.scale.x,
            sy: model.scale.y,
            sz: model.scale.z,
            cshdw: model.cast_shadow,
            rshdw: model.receive_shadow,
          }
        },
        deserialize: (d) => {
          return {
            geometry: d.geom,
            material: d.mtl,
            scale: new Vector3(d.sx,d.sy,d.sz),
            cast_shadow: d.cshdw,
            receive_shadow: d.rshdw,
          }
        }
      },
      { 
        component: BodyComponent,
        serialize: (c,d) => {

        },
        deserialize: (d) => {

        }      
      },
      {
        component: PhysicsComponent,
        state: (c,d) => {

        },
        update: (d,e) => {

        },
      },
      {
        component: PhysicsControllerComponent,
        state: (c,d) => {

        },
        update: (d,e) => {

        },
      },
      {
        component: NetworkPlayerComponent,
        serialize: (d) => {
          d.player_channel = c.channel
          d.player_name = c.name
        },
        deserialize: (d) => {
          // TODO actually create separate component here for client
        }
      }
    ]
  }

  get_entity_state(e){
    const data = {id: e.id}

    for(var i=0; i < this.components.length; i++){
      if(!e.hasComponent(this.components[i].component)){ continue }
      const c = e.getComponent(this.components[i].component) 
      if(this.components[i].state){
        this.components[i].state(c,data)
      }
    }

    return data
  }

  get_entity_init(e){
    const data = {id:e.id,c:[]}

    for(var i=0; i < this.components.length; i++){
      if(!e.hasComponent(this.components[i].component)){ 
        data.c.push(null)
        continue 
      }
      const c = e.getComponent(this.components[i].component) 
      if(this.components[i].serialize){
        data.c.push(this.components[i].serialize(c))
      }else{
        data.c.push(null)
      }
    }

    return data
  }

  // snap is snapshot from interpolator
  process_entity_update(e,snap){
    for(var i=0; i < this.components.length; i++){
      if(!e.hasComponent(this.components[i].component)){ continue }
      const c = e.getMutableComponent(this.components[i].component) 
      if(this.components[i].update){
        this.components[i].update(snap,c)
      }
    }
   }

  process_entity_init(data,e){
    e.addComponent(NetworkSyncComponent,{id:data.id}) 

    for(var i=0; i < this.components.length; i++){
      if(e.hasComponent(this.components[i].component)){ continue } // should we be updating?
      if(this.components[i].deserialize && data.c[i]){
        e.addComponent(this.components[i].component,this.components[i].deserialize(data.c[i]))
      }
    }

    // TODO make this use physics where applicable
    e.addComponent(UpdateFromLocRotComponent)

    return e
  }
}