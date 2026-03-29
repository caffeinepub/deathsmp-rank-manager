/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

const Rank = IDL.Record({ id: IDL.Nat, name: IDL.Text, priceINR: IDL.Nat });
const Member = IDL.Record({
  id: IDL.Nat,
  playerName: IDL.Text,
  discordUsername: IDL.Text,
  rankId: IDL.Nat,
  purchaseDate: IDL.Int,
  renewalDate: IDL.Int,
  monthsPaidInAdvance: IDL.Nat,
  notes: IDL.Text,
});
const UserPublic = IDL.Record({ email: IDL.Text, role: IDL.Text });
const RegisterResult = IDL.Record({ ok: IDL.Bool, message: IDL.Text, role: IDL.Text });
const LoginResult = IDL.Record({ ok: IDL.Bool, role: IDL.Text, message: IDL.Text });
const OkMessage = IDL.Record({ ok: IDL.Bool, message: IDL.Text });
const AddRankResult = IDL.Record({ ok: IDL.Bool, rankId: IDL.Nat, message: IDL.Text });
const AddMemberResult = IDL.Record({ ok: IDL.Bool, memberId: IDL.Nat, message: IDL.Text });
const UserRole = IDL.Variant({ admin: IDL.Null, user: IDL.Null, guest: IDL.Null });

const serviceShape = {
  registerUser: IDL.Func([IDL.Text, IDL.Text], [RegisterResult], []),
  loginUser: IDL.Func([IDL.Text, IDL.Text], [LoginResult], ['query']),
  listUsers: IDL.Func([], [IDL.Vec(UserPublic)], ['query']),
  setUserRole: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkMessage], []),
  getRanks: IDL.Func([], [IDL.Vec(Rank)], ['query']),
  addRank: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat], [AddRankResult], []),
  updateRank: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Nat], [OkMessage], []),
  deleteRank: IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkMessage], []),
  getMembers: IDL.Func([], [IDL.Vec(Member)], ['query']),
  addMember: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Int, IDL.Nat, IDL.Text], [AddMemberResult], []),
  updateMember: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text, IDL.Nat, IDL.Int, IDL.Nat, IDL.Text], [OkMessage], []),
  deleteMember: IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkMessage], []),
  getExpiringMembers: IDL.Func([IDL.Nat], [IDL.Vec(Member)], ['query']),
  getDiscordWebhookUrl: IDL.Func([], [IDL.Text], ['query']),
  setDiscordWebhookUrl: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [OkMessage], []),
  sendDiscordAlert: IDL.Func([IDL.Text], [OkMessage], []),
  _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
  getCallerUserRole: IDL.Func([], [UserRole], ['query']),
  isCallerAdmin: IDL.Func([], [IDL.Bool], ['query']),
};

export const idlService = IDL.Service(serviceShape);
export const idlInitArgs = [];
export const idlFactory = ({ IDL }) => {
  const Rank = IDL.Record({ id: IDL.Nat, name: IDL.Text, priceINR: IDL.Nat });
  const Member = IDL.Record({
    id: IDL.Nat, playerName: IDL.Text, discordUsername: IDL.Text,
    rankId: IDL.Nat, purchaseDate: IDL.Int, renewalDate: IDL.Int,
    monthsPaidInAdvance: IDL.Nat, notes: IDL.Text,
  });
  const UserPublic = IDL.Record({ email: IDL.Text, role: IDL.Text });
  const RegisterResult = IDL.Record({ ok: IDL.Bool, message: IDL.Text, role: IDL.Text });
  const LoginResult = IDL.Record({ ok: IDL.Bool, role: IDL.Text, message: IDL.Text });
  const OkMessage = IDL.Record({ ok: IDL.Bool, message: IDL.Text });
  const AddRankResult = IDL.Record({ ok: IDL.Bool, rankId: IDL.Nat, message: IDL.Text });
  const AddMemberResult = IDL.Record({ ok: IDL.Bool, memberId: IDL.Nat, message: IDL.Text });
  const UserRole = IDL.Variant({ admin: IDL.Null, user: IDL.Null, guest: IDL.Null });
  return IDL.Service({
    registerUser: IDL.Func([IDL.Text, IDL.Text], [RegisterResult], []),
    loginUser: IDL.Func([IDL.Text, IDL.Text], [LoginResult], ['query']),
    listUsers: IDL.Func([], [IDL.Vec(UserPublic)], ['query']),
    setUserRole: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [OkMessage], []),
    getRanks: IDL.Func([], [IDL.Vec(Rank)], ['query']),
    addRank: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat], [AddRankResult], []),
    updateRank: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Nat], [OkMessage], []),
    deleteRank: IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkMessage], []),
    getMembers: IDL.Func([], [IDL.Vec(Member)], ['query']),
    addMember: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Int, IDL.Nat, IDL.Text], [AddMemberResult], []),
    updateMember: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text, IDL.Nat, IDL.Int, IDL.Nat, IDL.Text], [OkMessage], []),
    deleteMember: IDL.Func([IDL.Text, IDL.Text, IDL.Nat], [OkMessage], []),
    getExpiringMembers: IDL.Func([IDL.Nat], [IDL.Vec(Member)], ['query']),
    getDiscordWebhookUrl: IDL.Func([], [IDL.Text], ['query']),
    setDiscordWebhookUrl: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [OkMessage], []),
    sendDiscordAlert: IDL.Func([IDL.Text], [OkMessage], []),
    _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
    getCallerUserRole: IDL.Func([], [UserRole], ['query']),
    isCallerAdmin: IDL.Func([], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
