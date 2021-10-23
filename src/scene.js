//import { Physics2dScene } from "gokart.js/src/scene/physics2d.js"
import { Physics3dScene } from "gokart.js/src/scene/physics3d.js"
import { CameraComponent,  ModelComponent, LightComponent  } from "gokart.js/src/core/components/render.js"
import { BodyComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { NetworkSystem } from "./systems/network.js"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"

export class TestScene extends Physics3dScene {

    register_network_systems(){
        this.world.registerSystem(NetworkSystem)
    }

    register_systems(){
        super.register_systems()
        this.register_network_systems()
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
        g.name = "ground_plane"

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient",intensity:0.6})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,20),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"directional",cast_shadow:true,intensity:0.6})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(5,20,-20)})
        c.addComponent(ActionListenerComponent)

        for(var i=0;i<5;i++){
          const box = this.world.createEntity()
          box.addComponent(ModelComponent,{})
          box.addComponent(LocRotComponent,{location: new Vector3(0,10+i*3,0),rotation: new Vector3(i*Math.PI/10,0,i*Math.PI/10)})
          box.addComponent(BodyComponent,{mass:1,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(1,1,1)})
          box.name = "box"+i
        }
    }
}