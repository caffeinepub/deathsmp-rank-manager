/* eslint-disable */

// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";

export interface Some<T> { __kind__: "Some"; value: T; }
export interface None { __kind__: "None"; }
export type Option<T> = Some<T> | None;

function some<T>(value: T): Some<T> { return { __kind__: "Some", value }; }
function none(): None { return { __kind__: "None" }; }
function isNone<T>(option: Option<T>): option is None { return option.__kind__ === "None"; }
function isSome<T>(option: Option<T>): option is Some<T> { return option.__kind__ === "Some"; }
function unwrap<T>(option: Option<T>): T {
  if (isNone(option)) throw new Error("unwrap: none");
  return option.value;
}
function candid_some<T>(value: T): [T] { return [value]; }
function candid_none<T>(): [] { return []; }
function record_opt_to_undefined<T>(arg: T | null): T | undefined { return arg == null ? undefined : arg; }

export class ExternalBlob {
  _blob?: Uint8Array<ArrayBuffer> | null;
  directURL: string;
  onProgress?: (percentage: number) => void = undefined;
  private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null) {
    if (blob) { this._blob = blob; }
    this.directURL = directURL;
  }
  static fromURL(url: string): ExternalBlob { return new ExternalBlob(url, null); }
  static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
    const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
    return new ExternalBlob(url, blob);
  }
  public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this._blob) return this._blob;
    const response = await fetch(this.directURL);
    const blob = await response.blob();
    this._blob = new Uint8Array(await blob.arrayBuffer());
    return this._blob;
  }
  public getDirectURL(): string { return this.directURL; }
  public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

export interface backendInterface {
  registerUser(email: string, password: string): Promise<{ ok: boolean; message: string; role: string }>;
  loginUser(email: string, password: string): Promise<{ ok: boolean; role: string; message: string }>;
  listUsers(): Promise<Array<{ email: string; role: string }>>;
  setUserRole(callerEmail: string, callerPassword: string, targetEmail: string, newRole: string): Promise<{ ok: boolean; message: string }>;
  getRanks(): Promise<Array<{ id: bigint; name: string; priceINR: bigint }>>;
  addRank(callerEmail: string, callerPassword: string, name: string, priceINR: bigint): Promise<{ ok: boolean; rankId: bigint; message: string }>;
  updateRank(callerEmail: string, callerPassword: string, id: bigint, name: string, priceINR: bigint): Promise<{ ok: boolean; message: string }>;
  deleteRank(callerEmail: string, callerPassword: string, id: bigint): Promise<{ ok: boolean; message: string }>;
  getMembers(): Promise<Array<any>>;
  addMember(callerEmail: string, callerPassword: string, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string): Promise<{ ok: boolean; memberId: bigint; message: string }>;
  updateMember(callerEmail: string, callerPassword: string, id: bigint, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string): Promise<{ ok: boolean; message: string }>;
  deleteMember(callerEmail: string, callerPassword: string, id: bigint): Promise<{ ok: boolean; message: string }>;
  getExpiringMembers(withinDays: bigint): Promise<Array<any>>;
  getDiscordWebhookUrl(): Promise<string>;
  setDiscordWebhookUrl(callerEmail: string, callerPassword: string, url: string): Promise<{ ok: boolean; message: string }>;
  sendDiscordAlert(message: string): Promise<{ ok: boolean; message: string }>;
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  getCallerUserRole(): Promise<any>;
  isCallerAdmin(): Promise<boolean>;
}

export class Backend implements backendInterface {
  constructor(
    private actor: ActorSubclass<_SERVICE>,
    private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    private processError?: (error: unknown) => never
  ) {}

  private async _call<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn(); } catch (e) {
      if (this.processError) this.processError(e);
      throw e;
    }
  }

  registerUser(email: string, password: string) {
    return this._call(() => this.actor.registerUser(email, password));
  }
  loginUser(email: string, password: string) {
    return this._call(() => this.actor.loginUser(email, password));
  }
  listUsers() {
    return this._call(() => this.actor.listUsers());
  }
  setUserRole(callerEmail: string, callerPassword: string, targetEmail: string, newRole: string) {
    return this._call(() => this.actor.setUserRole(callerEmail, callerPassword, targetEmail, newRole));
  }
  getRanks() {
    return this._call(() => this.actor.getRanks());
  }
  addRank(callerEmail: string, callerPassword: string, name: string, priceINR: bigint) {
    return this._call(() => this.actor.addRank(callerEmail, callerPassword, name, priceINR));
  }
  updateRank(callerEmail: string, callerPassword: string, id: bigint, name: string, priceINR: bigint) {
    return this._call(() => this.actor.updateRank(callerEmail, callerPassword, id, name, priceINR));
  }
  deleteRank(callerEmail: string, callerPassword: string, id: bigint) {
    return this._call(() => this.actor.deleteRank(callerEmail, callerPassword, id));
  }
  getMembers() {
    return this._call(() => this.actor.getMembers());
  }
  addMember(callerEmail: string, callerPassword: string, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string) {
    return this._call(() => this.actor.addMember(callerEmail, callerPassword, playerName, discordUsername, rankId, purchaseDate, monthsPaidInAdvance, notes));
  }
  updateMember(callerEmail: string, callerPassword: string, id: bigint, playerName: string, discordUsername: string, rankId: bigint, purchaseDate: bigint, monthsPaidInAdvance: bigint, notes: string) {
    return this._call(() => this.actor.updateMember(callerEmail, callerPassword, id, playerName, discordUsername, rankId, purchaseDate, monthsPaidInAdvance, notes));
  }
  deleteMember(callerEmail: string, callerPassword: string, id: bigint) {
    return this._call(() => this.actor.deleteMember(callerEmail, callerPassword, id));
  }
  getExpiringMembers(withinDays: bigint) {
    return this._call(() => this.actor.getExpiringMembers(withinDays));
  }
  getDiscordWebhookUrl() {
    return this._call(() => this.actor.getDiscordWebhookUrl());
  }
  setDiscordWebhookUrl(callerEmail: string, callerPassword: string, url: string) {
    return this._call(() => this.actor.setDiscordWebhookUrl(callerEmail, callerPassword, url));
  }
  sendDiscordAlert(message: string) {
    return this._call(() => this.actor.sendDiscordAlert(message));
  }
  async _initializeAccessControlWithSecret(userSecret: string) {
    return this._call(() => this.actor._initializeAccessControlWithSecret(userSecret));
  }
  getCallerUserRole() {
    return this._call(() => this.actor.getCallerUserRole());
  }
  isCallerAdmin() {
    return this._call(() => this.actor.isCallerAdmin());
  }
}

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  processError?: (error: unknown) => never;
}

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
  options: CreateActorOptions = {}
): Backend {
  const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
  if (options.agent && options.agentOptions) {
    console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
  }
  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
