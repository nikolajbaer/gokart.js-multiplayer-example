GoKart Multiplayer Example
--------------------------

Test to figure out how a multiplayer GoKart.js game would work.

Currently using [geckos.io](https://geckos.io/) to handle networking, etc.


Trying this
-----------

Clone the repo, then run `npm install .` and `npm run dev`.

*NOTE* I have trouble getting this to go in docker via WSL because right now geckos requires UDP for the WebRTC data channel connection.

To run tests, do `npm run test`.

Structure / Approach
--------------------

- Server and client both have a GoKart scene. 
- Server is a headless scene
- We rely on a ComponentSerializer to map components to init/update data between client/server
  - Some components need to be "transformed" between client/server 

When client connects, it loads all entities from the server, identified with a NetworkSyncComponent.
- Entities that are static (e.g. map entities) are marked NetworkSyncComponent.sync = false
- TODO Ideally meshloader is formatted to specially load meshes from server, unless already bundled
- server delivers all initial elements. Maybe this can be bolstered with glb prefabs i.e. for a map

On Update, server sends changed entities to clients
- Only NetworkSyncComponents that have sync=true will sync
- Mark new entity inits as "reliable" on the data channel so they get through, otherwise just blast the updates 

When user interacts, send through the Actions
- Locally we want this to be extrapolated, so TODO spawn player's body as a Kinematic Character Controller that responds accordingly with Movement 
- Otherwise, if not the current client's player, we map Kinematic Characters / Physics Controllers to Kinematic Physic Bodies and rely on interpolation

References:
https://gafferongames.com/post/introduction_to_networked_physics/
https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
https://www.youtube.com/watch?v=9OjIDko1uzc
https://github.com/geckosio/snapshot-interpolation/tree/master/example


