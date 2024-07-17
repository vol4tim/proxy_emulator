import { start } from "./libp2p.js";
import { getConfigFile } from "./utils.js";

(async () => {
  const config = getConfigFile();
  const node = await start(config);

  const ha = {
    lamp: { state: "off", time: Date.now() }
  };

  const haProxy = new Proxy(ha, {
    set: function (target, key, value) {
      target[key] = value;
      for (const connection of node.getConnections()) {
        sendState(connection, target);
      }
      return true;
    }
  });

  const sendState = async (connection, data) => {
    if (connection.direction === "outbound") {
      return;
    }
    try {
      console.log("========", data);
      const response = await node.services.ha.request(connection, "/update", {
        data: data
      });
      console.log(response);
    } catch (error) {
      if (!error.code || error.code !== "ERR_UNSUPPORTED_PROTOCOL") {
        console.log(error);
      }
    }
  };

  node.services.ha.handle("/call", async (dataRaw, stream, connection) => {
    console.log("from", connection.remotePeer.toString());
    console.log("command", dataRaw);
    if (
      dataRaw &&
      dataRaw.data.device &&
      dataRaw.data.state &&
      Object.keys(ha).includes(dataRaw.data.device)
    ) {
      haProxy[dataRaw.data.device] = {
        state: dataRaw.data.state,
        time: Date.now()
      };
      await node.services.ha.utils.sendResponse(stream, {
        result: true
      });
    } else {
      await node.services.ha.utils.sendResponse(stream, {
        result: false
      });
    }
  });
})();
