import type { Principal } from "@icp-sdk/core/principal";

export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface UserPublic {
  email: string;
  role: string;
}

export interface Rank {
  id: bigint;
  name: string;
  priceINR: bigint;
}

export interface Member {
  id: bigint;
  playerName: string;
  discordUsername: string;
  rankId: bigint;
  purchaseDate: bigint;
  renewalDate: bigint;
  monthsPaidInAdvance: bigint;
  notes: string;
}

export interface backendInterface {
  registerUser(email: string, password: string): Promise<{ ok: boolean; message: string; role: string }>;
  loginUser(email: string, password: string): Promise<{ ok: boolean; role: string; message: string }>;
  listUsers(): Promise<Array<UserPublic>>;
  setUserRole(callerEmail: string, callerPassword: string, targetEmail: string, newRole: string): Promise<{ ok: boolean; message: string }>;
  getRanks(): Promise<Array<Rank>>;
  addRank(callerEmail: string, callerPassword: string, name: string, priceINR: bigint): Promise<{ ok: boolean; rankId: bigint; message: string }>;
  updateRank(callerEmail: string, callerPassword: string, id: bigint, name: string, priceINR: bigint): Promise<{ ok: boolean; message: string }>;
  deleteRank(callerEmail: string, callerPassword: string, id: bigint): Promise<{ ok: boolean; message: string }>;
  getMembers(): Promise<Array<Member>>;
  addMember(callerEmail: string, callerPassword: string, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string): Promise<{ ok: boolean; memberId: bigint; message: string }>;
  updateMember(callerEmail: string, callerPassword: string, id: bigint, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string): Promise<{ ok: boolean; message: string }>;
  deleteMember(callerEmail: string, callerPassword: string, id: bigint): Promise<{ ok: boolean; message: string }>;
  getExpiringMembers(withinDays: bigint): Promise<Array<Member>>;
  getDiscordWebhookUrl(): Promise<string>;
  setDiscordWebhookUrl(callerEmail: string, callerPassword: string, url: string): Promise<{ ok: boolean; message: string }>;
  sendDiscordAlert(message: string): Promise<{ ok: boolean; message: string }>;
  resetAllData(): Promise<{ ok: boolean; message: string }>;
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
}

/**
 * Module augmentation: merges _initializeAccessControlWithSecret into the
 * backendInterface (and Backend class) exported by backend.ts so that
 * useActor.ts can call the method without a TypeScript error.
 */
declare module "./backend" {
  interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  }
  // Augment the Backend class so it remains assignable to backendInterface
  interface Backend {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  }
}
