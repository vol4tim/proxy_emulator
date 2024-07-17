import { noise } from "@chainsafe/libp2p-noise";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { mplex } from "@libp2p/mplex";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import { createHa } from "./ha.js";
import { createPeer } from "./utils.js";

async function createNode(config) {
  return await createLibp2p({
    addresses: config.addresses,
    peerId: await createPeer(config.privateKey),
    transports: [
      tcp(),
      webSockets(),
      circuitRelayTransport({
        discoverRelays: 10
      })
    ],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()],
    services: {
      identify: identify(),
      ha: createHa(),
      kadDHT: kadDHT({
        protocol: "/ipfs/lan/kad/1.0.0"
      })
    },
    peerDiscovery: [
      bootstrap({
        list: config.bootstrappers
      })
    ]
  });
}

let node = null;

export async function start(config) {
  if (node) {
    return node;
  }
  node = await createNode(config);
  await node.start();
  console.log(`Node started with id ${node.peerId.toString()}`);

  node.addEventListener("self:peer:update", evt => {
    console.log(
      "Listening on:",
      node.getMultiaddrs().map(item => {
        return item.toString();
      })
    );
  });

  function updateConnectionsList() {
    const connections = node.getConnections().map(item => {
      return item.remoteAddr.toString();
    });
    console.log("Update Connections List", connections);
  }

  node.addEventListener("connection:open", event => {
    console.log("connected", event.detail.remoteAddr.toString());
    updateConnectionsList();
  });

  node.addEventListener("connection:close", event => {
    console.log("disconected", event.detail.remoteAddr.toString());
    updateConnectionsList();
  });

  node.addEventListener("peer:discovery", evt => {
    const peerInfo = evt.detail;
    console.log("Discovered:", peerInfo.id.toString());
  });

  return node;
}
