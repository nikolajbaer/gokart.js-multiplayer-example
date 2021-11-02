import { BodyComponent,KinematicCharacterComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { NetworkServerSystem } from "./systems/network_server.js"
import { Physics3dScene } from "gokart.js/src/scene/physics3d.js"
import { NetworkPlayerComponent, NetworkSyncComponent } from "./components/network.js"
import { PhysicsLocRotUpdateSystem } from "gokart.js/src/core/systems/physics.js"
import { ModelComponent } from "gokart.js/src/core/components/render.js"
import { MoverComponent, OnGroundComponent } from "gokart.js/src/common/components/movement.js"
import { MovementSystem } from "gokart.js/src/common/systems/movement.js"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"
import { ComponentSerializer } from "./component_serializer.js"

export class TestServerScene extends Physics3dScene {
  constructor(new_entity_callback){
    super()
    this.elapsed = 0
    this.time_step = 1000/20 // 20 tick server?
    this.new_entity_callback = new_entity_callback
  }

  register_components(){
      super.register_components()
      this.world.registerComponent(NetworkSyncComponent)
      this.world.registerComponent(OnGroundComponent) // NOTE this should not be in common if it is required!
      this.world.registerComponent(NetworkPlayerComponent)
      this.world.registerComponent(MoverComponent)
  }

  register_systems(){
    this.world.registerSystem(PhysicsLocRotUpdateSystem)
    this.world.registerSystem(MovementSystem)
    super.register_systems()
    this.world.registerSystem(NetworkServerSystem,{
      new_entity_callback:this.new_entity_callback,
      serializer: new ComponentSerializer()
    })
  }

  register_ui_systems(){
    // don't register ui systems
    // TODO refactor in gokart to have a base scene and layer on a SinglePlayer Scene
  }

  get_snapshot(){
    const nsys = this.world.getSystem(NetworkServerSystem)
    if(nsys){ return nsys.snapshot }
    return null
  }

  get_init_data(){
    const nsys = this.world.getSystem(NetworkServerSystem)
    if(nsys){ return nsys.get_init_data() }
    return null
  }

  add_user(id){
    const e = this.world.createEntity()
    const spawn = new Vector3(0,10,0)
    e.addComponent(BodyComponent,{
      body_type: BodyComponent.KINEMATIC_CHARACTER,
      bounds_type:BodyComponent.CYLINDER_TYPE,
      //track_collisions:true,
      bounds: new Vector3(1,2,1),
      //material: "player",
      mass: 0,
    })
    e.addComponent(MoverComponent,{
      speed:0.15,
      kinematic:true,
      turner:false,
      local:true,
      fly_mode: false,
      default_run: true,
    })
    e.addComponent(KinematicCharacterComponent,{
      jump_speed: 10,
      gravity: 20,
    })
    e.addComponent(ModelComponent,{geometry:"box",material:"yellow",scale:new Vector3(1,2,1)})
    e.addComponent(LocRotComponent,{location:spawn})
    e.addComponent(NetworkSyncComponent,{id:e.id})
    e.addComponent(NetworkPlayerComponent,{channel: id,name:"" })
    e.addComponent(ActionListenerComponent)
    e.addComponent(MoverComponent)

    /*
    e.addComponent(KinematicCharacterComponent,{
      jump_speed: 10,
      gravity: 20,
    })*/
    e.name = "player_"+id
    console.log("spawned ",e.name)
    return e.id
  }

  // TODO can we eliminate these daisy chains?
  remove_user(channel_id){
    const nsys = this.world.getSystem(NetworkServerSystem)
    nsys.remove_user(channel_id)
  }

  update_user_actions(channel_id,actions){
    const nsys = this.world.getSystem(NetworkServerSystem)
    nsys.update_user_actions(channel_id,actions)
  }

  loop(){
      if(this.destroyed){
          console.log("scene exiting")
          return
      }

      let delta = this.time_step
      this.elapsed += delta
      let time = this.elapsed
      this.world.execute(delta,time) 

  }

  init_entities(){
      const g = this.world.createEntity()
      g.addComponent( BodyComponent, {
          mass: 0,
          bounds_type: BodyComponent.BOX_TYPE,
          body_type: BodyComponent.STATIC,
          bounds: new Vector3(1000,1,1000),
      })
      g.addComponent( ModelComponent, {geometry:"box",material:0x111111,scale: new Vector3(1000,1,1000)})
      g.addComponent( LocRotComponent, { rotation: new Vector3(0,0,0), location: new Vector3(0,-0.5,0) } )
      g.addComponent(NetworkSyncComponent,{id:g.id})
      g.name = "ground_plane"

      for(var i=0;i<5;i++){
        const box = this.world.createEntity()
        box.addComponent(LocRotComponent,{location: new Vector3(0,10+i*3,0),rotation: new Vector3(i*Math.PI/10,0,i*Math.PI/10)})
        box.addComponent(BodyComponent,{mass:1,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(1,1,1)})
        box.addComponent(NetworkSyncComponent,{id:box.id})
        box.addComponent(ModelComponent)
        box.name = "box"+i
      }
  }
}