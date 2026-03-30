/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Rank { id: bigint; name: string; priceINR: bigint; }
export interface Member {
  id: bigint; playerName: string; discordUsername: string;
  rankId: bigint; purchaseDate: bigint; renewalDate: bigint;
  monthsPaidInAdvance: bigint; notes: string;
}
export interface UserPublic { email: string; role: string; }

export interface _SERVICE {
  registerUser: ActorMethod<[string, string], { ok: boolean; message: string; role: string }>;
  loginUser: ActorMethod<[string, string], { ok: boolean; role: string; message: string }>;
  listUsers: ActorMethod<[], Array<UserPublic>>;
  setUserRole: ActorMethod<[string, string, string, string], { ok: boolean; message: string }>;
  getRanks: ActorMethod<[], Array<Rank>>;
  addRank: ActorMethod<[string, string, string, bigint], { ok: boolean; rankId: bigint; message: string }>;
  updateRank: ActorMethod<[string, string, bigint, string, bigint], { ok: boolean; message: string }>;
  deleteRank: ActorMethod<[string, string, bigint], { ok: boolean; message: string }>;
  getMembers: ActorMethod<[], Array<Member>>;
  addMember: ActorMethod<[string, string, string, string, bigint, bigint, bigint, string], { ok: boolean; memberId: bigint; message: string }>;
  updateMember: ActorMethod<[string, string, bigint, string, string, bigint, bigint, bigint, string], { ok: boolean; message: string }>;
  deleteMember: ActorMethod<[string, string, bigint], { ok: boolean; message: string }>;
  getExpiringMembers: ActorMethod<[bigint], Array<Member>>;
  resetAllData: ActorMethod<[], { ok: boolean; message: string }>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
