import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent } from "gokart.js/src/core/components/render.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "./components/network.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { BodyComponent, PhysicsComponent, PhysicsControllerComponent } from "gokart.js/src/core/components/physics.js"
import { Ammo } from "gokart.js/src/core/systems/physics.js"
import * as THREE from "three"

export class ComponentSerializer {
  constructor(){
    // How we map components from entities
    this.components = this.create_component_mapping()
    this.interpolation = "x y z q(quat) vx vy vz rotationInDeg(avx) rotationInDeg(avy) rotationInDeg(avz)"
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
      },
      {
        component: ModelComponent,
        serialize: (c) => {
          return {
            geom: c.geometry,
            mtl: c.material,
            sx: c.scale.x,
            sy: c.scale.y,
            sz: c.scale.z,
            cshdw: c.cast_shadow,
            rshdw: c.receive_shadow,
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
        serialize: (c) => {
          let body_type = c.body_type
          if(c.body_type == BodyComponent.KINEMATIC_CHARACTER){
            body_type = BodyComponent.KINEMATIC // We use a kinematic character on the client
          }
          return {
            mass: c.mass,
            body_type: body_type,
            bounds_type: c.bounds_type,
            bounds_x: c.bounds.x,
            bounds_y: c.bounds.y,
            bounds_z: c.bounds.z,
            material: c.material,
            velocity_x: c.velocity.x,
            velocity_y: c.velocity.y,
            velocity_z: c.velocity.z,
            fixed_rotation: c.fixed_rotation
          } // skip collision tracking on client
        },
        deserialize: (d) => {
          return {
            mass: d.mass,
            body_type: d.body_type,
            bounds_type: d.bounds_type,
            bounds: new Vector3(d.bounds_x,d.bounds_y,d.bounds_z),
            material: d.material,
            velocity: new Vector3(d.velocity_x,d.velocity_y,d.velocity_z),
            fixed_rotation: d.fixed_rotation
          }
        }      
      },
      {
        component: PhysicsComponent,
        state: (c,d) => {
          const btTransform = c.body.getWorldTransform() //.getCenterOfMassTransform()
          const pos = btTransform.getOrigin()
          const btQuat = btTransform.getRotation()
          const v = c.body.getLinearVelocity()
          const av = c.body.getAngularVelocity()
          d.x = pos.x()
          d.y = pos.y()
          d.z = pos.z()
          d.quat = {x:btQuat.x(),y:btQuat.y(),z:btQuat.z(),w:btQuat.w()}

          // Do I need to communicate these (and thus extrapolate) or is interpolation ok?
          // should all bodies just be kinematic with interpolation?
          d.vx = v.x()
          d.vy = v.y()
          d.vz = v.z()
          d.avx = av.x()
          d.avy = av.y()
          d.avz = av.z()
        },
        update: (d,c) => {
          // Can I rely on Ammo being loaded here?
          if(!d.quat){ return }
          c.body.setAngularVelocity(new Ammo.btVector3(d.avx,d.avy,d.avz))
          c.body.setLinearVelocity(new Ammo.btVector3(d.vx,d.vy,d.vz))

          const tr = c.body.getCenterOfMassTransform()
          tr.setOrigin(new Ammo.btVector3(d.x,d.y,d.z))
          tr.setRotation(new Ammo.btQuaternion(d.quat.x,d.quat.y,d.quat.z,d.quat.w))
          c.body.setWorldTransform(tr)

        },
      },
      {
        component: PhysicsControllerComponent,
        state: (c,d,e) => {
          // We force all Char Ctrlrs to Kinematic Bodies
          // so we just send through the values required for updateing from 
          // the physics component 
          const locrot = e.getComponent(LocRotComponent)
          d.x = locrot.location.x
          d.y = locrot.location.y
          d.z = locrot.location.z
          d.avx = 0
          d.avy = 0
          d.avz = 0
          d.vx = 0
          d.vy = 0
          d.vz = 0
          // Lean on THREE quat libs.. really we should store quats
          const quat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(locrot.rotation.x,locrot.rotation.y,locrot.rotation.z,'YZX')
          )
          d.quat = {x:quat.x,y:quat.y,z:quat.z,w:quat.w}
        },
      },
      {
        component: NetworkPlayerComponent,
        serialize: (c) => {
          return {
            player_channel: c.channel,
            player_name: c.name
          }
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
        this.components[i].state(c,data,e)
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
    //e.addComponent(UpdateFromLocRotComponent)

    return e
  }
}