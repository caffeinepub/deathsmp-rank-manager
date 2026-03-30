import { createActor, type CreateActorOptions } from "./backend";
import { ExternalBlob } from "./backend";
import envJson from "../env.json";

const canisterId: string = (envJson as any).backend_canister_id;
const backendHost: string = (envJson as any).backend_host;
const iiDerivationOrigin: string = (envJson as any).ii_derivation_origin;

export interface AppConfig {
  ii_derivation_origin: string;
}

export async function loadConfig(): Promise<AppConfig> {
  return { ii_derivation_origin: iiDerivationOrigin };
}

export async function createActorWithConfig(options: CreateActorOptions = {}) {
  const agentOptions = {
    host: backendHost !== "undefined" ? backendHost : undefined,
    ...options.agentOptions,
  };

  const uploadFile = async (_file: ExternalBlob): Promise<Uint8Array> => {
    throw new Error("File upload not supported");
  };

  const downloadFile = async (_file: Uint8Array): Promise<ExternalBlob> => {
    throw new Error("File download not supported");
  };

  return createActor(canisterId, uploadFile, downloadFile, {
    ...options,
    agentOptions,
  });
}
