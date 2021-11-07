import { CameraComponent,  ModelComponent, LightComponent  } from "gokart.js/src/core/components/render.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { NetworkClientSystem } from "./systems/network_client.js"
import { ActionListenerComponent } from "gokart.js/src/core/components/controls.js"
import { NetworkSyncComponent } from "./components/network.js"
import { Physics3dScene } from "gokart.js/src/scene/physics3d.js"
import { ComponentSerializer } from "./component_serializer.js"
//import { BaseScene } from "gokart.js/src/scene/scene.js"

export class TestClientScene extends Physics3dScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(NetworkSyncComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(NetworkClientSystem,{serializer:new ComponentSerializer()})
    }

    init_entities(){
        /*
        // The non-player entities will be loaded from the server on connect
        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.8})
        */

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(5,20,-20)})
        c.addComponent(ActionListenerComponent)

        /* just to make sure we are rendering..
        const ref = this.world.createEntity()
        ref.addComponent(LocRotComponent,{location: new Vector3(0,0,0),rotation: new Vector3(0,0,0)})
        ref.addComponent(ModelComponent)
        */
    }
}