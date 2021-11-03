import { LocRotComponent } from "gokart.js/src/core/components/position.js"
import { ModelComponent, UpdateFromLocRotComponent } from "gokart.js/src/core/components/render.js"
import { initialize_test_world } from "gokart.js/src/core/testing/game_helpers.js"
import { PhysicsSystem } from "gokart.js/src/core/systems/physics.js"
import { ApplyVelocityComponent, BodyComponent, CollisionComponent, KinematicCharacterComponent, PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "gokart.js/src/core/components/physics.js"
import { Vector3 } from "gokart.js/src/core/ecs_types.js"
import test from 'ava'
import loadAmmo from "ammo.js/tests/helpers/load-ammo.js"
import { OnGroundComponent } from "gokart.js/src/common/components/movement.js"
import { ComponentSerializer } from "./component_serializer.js"
import { NetworkSyncComponent } from "./components/network.js"

test.before(async t => loadAmmo())

test('serialize locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent])
  const serializer = new ComponentSerializer()
  const e = world.createEntity()
  e.addComponent(LocRotComponent,{
    location:new Vector3(1,2,3),
    rotation: new Vector3(0.1,0.2,0.3)
  })
  const init_data = serializer.get_entity_init(e)
  t.is(init_data.id,e.id)
  t.deepEqual(init_data.c[0],{x:1,y:2,z:3,rx:0.1,ry:0.2,rz:0.3})
})

test('deserialize locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent,NetworkSyncComponent,UpdateFromLocRotComponent])

  const e = world.createEntity()
  const serializer = new ComponentSerializer()
  // Components are positional
  const data = {
    id:123,c:[
      {x:1,y:2,z:3,rx:0.1,ry:0.2,rz:0.3}
    ]
  }
  serializer.process_entity_init(data,e)

  // should have a network sync component
  t.true(e.hasComponent(NetworkSyncComponent))
  t.is(e.getComponent(NetworkSyncComponent).id,data.id)

  // and a locrot
  t.true(e.hasComponent(LocRotComponent))
  const locrot = e.getComponent(LocRotComponent)
  t.is(locrot.location.x,data.c[0].x)
  t.is(locrot.location.y,data.c[0].y)
  t.is(locrot.location.z,data.c[0].z)
  t.is(locrot.rotation.x,data.c[0].rx)
  t.is(locrot.rotation.y,data.c[0].ry)
  t.is(locrot.rotation.z,data.c[0].rz)

})


test('get state of entity with locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent])
  const serializer = new ComponentSerializer()
  const e = world.createEntity()
  e.addComponent(LocRotComponent,{
    location:new Vector3(1,2,3),
    rotation: new Vector3(0.1,0.2,0.3)
  })
  const init_data = serializer.get_entity_state(e)
  t.deepEqual(init_data,{id:e.id,x:1,y:2,z:3,rx:0.1,ry:0.2,rz:0.3})
})

test('update state of entity with locrot component', t => {
  const world = initialize_test_world([],[LocRotComponent])
  const serializer = new ComponentSerializer()
  const e = world.createEntity()
  e.addComponent(LocRotComponent,{
    location:new Vector3(1,2,3),
    rotation: new Vector3(0.1,0.2,0.3)
  })
  e.addComponent(NetworkSyncComponent,{id:123})
  const data = {id:123,x:4,y:5,z:6,rx:0.4,ry:0.5,rz:0.6}
  serializer.process_entity_update(e,data)
  const locrot = e.getComponent(LocRotComponent)
  t.is(locrot.location.x,data.x)
  t.is(locrot.location.y,data.y)
  t.is(locrot.location.z,data.z)
  t.is(locrot.rotation.x,data.rx)
  t.is(locrot.rotation.y,data.ry)
  t.is(locrot.rotation.z,data.rz)
})