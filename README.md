GoKart Multiplayer Example
--------------------------

Test to figure out how a multiplayer GoKart.js game would work.

Currently using [geckos.io](https://geckos.io/) to handle networking, etc.

TBD


Structure / Approach
--------------------

- Server and client both have a GoKart scene. 
- Server is a headless scene

When client connects, it loads all entities from the server, identified with a NetworkSyncComponent.
- CONSIDER maybe load some baseline entities?
- Ideally meshloader is formatted to specially load meshes from server, unless already bundled
- server delivers all initial elements. Maybe this can be bolstered with glb prefabs i.e. for a map

On Update, server sends changed entities to clients
- CONSIDER possible to lose init data events. Ideally client if they miss one can just re-request init data for an element

When user interacts, it generates a deterministic action (e.g. Move Forward for 100ms)
Locally this is allowed to run as interpolated result, but when server sends through an update, we revert to authoritative server
- TODO NetworkActions?  Refactor ActionListener?

TBD Time Syncing and other smart things, hopefully use Snapshot Interpolation from geckos author?
TBD Client Prediction, interpolation.

References:
https://gafferongames.com/post/introduction_to_networked_physics/
https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
https://www.youtube.com/watch?v=9OjIDko1uzc


