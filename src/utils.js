import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import fs from "fs";
import path, { dirname } from "path";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { fileURLToPath } from "url";

const __dirname = path.resolve();
const __filename = fileURLToPath(import.meta.url);

export function getConfigFile() {
  let fileConfig = path.resolve(dirname(__filename), "../config.json");
  if (process.argv[2] === "--config") {
    fileConfig = path.resolve(__dirname, process.argv[3]);
  }

  if (!fs.existsSync(fileConfig)) {
    console.log("Not found file config", fileConfig);
    process.exit(0);
  }

  const loadJSON = path =>
    JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));

  return loadJSON(fileConfig);
}

export const logger = (...params) => {
  console.log(
    `[${new Intl.DateTimeFormat("ru", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h24"
    }).format(new Date())}]`,
    ...params
  );
};

export async function createPeer(privateKey) {
  const key = await unmarshalPrivateKey(
    uint8ArrayFromString(privateKey, "base64")
  );
  return await createFromPrivKey(key);
}
