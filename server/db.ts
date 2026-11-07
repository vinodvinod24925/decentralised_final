import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { generatePREKeyPair, PREKeyPair } from './crypto.ts';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'member' | 'admin';
  walletAddress: string;
  walletPrivateKey: string; // Stored securely for demo/session execution
  prePublicKey: string;
  prePrivateKey: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
}

export interface FileVersion {
  version: number;
  cid: string;
  cidV1: string;
  createdAt: number;
  rotationReason?: string;
  keyId: string;
}

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  ownerId: string;
  currentCid: string;
  currentVersion: number;
  versions: FileVersion[];
  // AES encrypted payload
  encryptedPayload: {
    cipherHex: string;
    ivHex: string;
    tagHex: string;
    algorithm: 'AES-256-GCM';
  };
  // Owner PRE capsule
  ownerCapsule: {
    ephemeralPublicKey: string;
    encryptedKeyHex: string;
    authTag: string;
  };
  // Raw plaintext kept only for owner key-rotation demo
  originalPlaintextBase64: string;
  sharedGroupIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FileGrant {
  id: string;
  fileId: string;
  recipientId?: string;
  recipientWallet?: string;
  groupId?: string;
  delegationDepth: number;
  expiryTimestamp: number;
  status: 'active' | 'revoked' | 'expired';
  // PRE Re-encryption key data for this recipient
  reEncryptionKey?: {
    fromPublicKey: string;
    toPublicKey: string;
    reKeyHex: string;
    delegationDepth: number;
  };
  grantedAt: number;
  revokedAt?: number;
}

export interface SecurityEvent {
  id: string;
  fileId: string;
  fileName: string;
  actor: string;
  actorAddress?: string;
  action: string;
  status: 'DENIED' | 'ALLOWED';
  reason: string;
  timestamp: number;
  ipfsCid: string;
  txHash?: string;
  blockNumber?: number;
}

export interface OwnerAlert {
  id: string;
  ownerId: string;
  fileId: string;
  fileName: string;
  groupName: string;
  actor: string;
  accessStatus: 'DENIED';
  originalCid: string;
  newCid?: string;
  keyRotationStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  responseStatus: 'COMPLETED' | 'FAILED';
  eventId: string;
  timestamp: number;
  isRead: boolean;
}

class Database {
  public users: Map<string, User> = new Map();
  public groups: Map<string, Group> = new Map();
  public files: Map<string, StoredFile> = new Map();
  public grants: Map<string, FileGrant> = new Map();
  public securityEvents: SecurityEvent[] = [];
  public ownerAlerts: OwnerAlert[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Create Default Owner: Alice Chen
    const ownerWallet = ethers.Wallet.createRandom();
    const ownerPre = generatePREKeyPair();
    const owner: User = {
      id: 'usr_owner_alice',
      email: 'alice.chen@deshare.io',
      name: 'Alice Chen (Security Lead)',
      role: 'owner',
      walletAddress: ownerWallet.address,
      walletPrivateKey: ownerWallet.privateKey,
      prePublicKey: ownerPre.publicKey,
      prePrivateKey: ownerPre.privateKey,
      createdAt: Date.now() - 86400000 * 5
    };
    this.users.set(owner.id, owner);

    // 2. Create Authorized Group Member: Bob Davis
    const bobWallet = ethers.Wallet.createRandom();
    const bobPre = generatePREKeyPair();
    const bob: User = {
      id: 'usr_member_bob',
      email: 'bob.davis@deshare.io',
      name: 'Bob Davis (Auditor)',
      role: 'member',
      walletAddress: bobWallet.address,
      walletPrivateKey: bobWallet.privateKey,
      prePublicKey: bobPre.publicKey,
      prePrivateKey: bobPre.privateKey,
      createdAt: Date.now() - 86400000 * 4
    };
    this.users.set(bob.id, bob);

    // 3. Create Group Member: Charlie Wu
    const charlieWallet = ethers.Wallet.createRandom();
    const charliePre = generatePREKeyPair();
    const charlie: User = {
      id: 'usr_member_charlie',
      email: 'charlie.wu@deshare.io',
      name: 'Charlie Wu (Research Partner)',
      role: 'member',
      walletAddress: charlieWallet.address,
      walletPrivateKey: charlieWallet.privateKey,
      prePublicKey: charliePre.publicKey,
      prePrivateKey: charliePre.privateKey,
      createdAt: Date.now() - 86400000 * 3
    };
    this.users.set(charlie.id, charlie);

    // 4. Create Seed Group: "Q4 Cryptographic Audit Committee"
    const auditGroup: Group = {
      id: 'grp_crypto_audit',
      name: 'Cryptographic Security & Audit Group',
      description: 'Authorized team members with access to core audit documents and key rotations',
      ownerId: owner.id,
      adminIds: [owner.id],
      memberIds: [owner.id, bob.id, charlie.id],
      createdAt: Date.now() - 86400000 * 3
    };
    this.groups.set(auditGroup.id, auditGroup);

    // 5. Create Seed Group: "Core Engineering"
    const engGroup: Group = {
      id: 'grp_core_eng',
      name: 'Decentralized Core Engineering',
      description: 'Architecture blueprints and smart contract deployments',
      ownerId: owner.id,
      adminIds: [owner.id],
      memberIds: [owner.id, bob.id],
      createdAt: Date.now() - 86400000 * 2
    };
    this.groups.set(engGroup.id, engGroup);

    // 6. Seed Realistic Encrypted Files for Demo
    this.seedFiles(owner, auditGroup);
  }

  private seedFiles(owner: User, auditGroup: Group) {
    const sampleText = "CONFIDENTIAL FACULTY AUDIT REPORT: DeShare v4 Cryptographic Architecture\nEnforcing AES-256-GCM authenticated payload encryption, IPFS content addressing, Proxy Re-Encryption with BBS98 elliptic-curve delegation, and automated on-chain attack response with CID rotation.";
    const plaintext = Buffer.from(sampleText, 'utf-8');
    const contentBase64 = plaintext.toString('base64');

    // We import crypto functions lazily or generate mock AES payload
    const cipherHex = 'e82b79a0d8112c4a9381640a3219ef8291a1b4d0812957b420f1ec374826b19a' + crypto.randomBytes(32).toString('hex');
    const ivHex = crypto.randomBytes(12).toString('hex');
    const tagHex = crypto.randomBytes(16).toString('hex');

    const fileId = 'fil_audit_q4';
    const cid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
    const cidV1 = 'bafybeicg2u7x2z754h62q3752e2x7b7w6y5v4u3t2s1r0q9p8o7n6m5l4k';

    const sampleFile: StoredFile = {
      id: fileId,
      name: 'Cryptographic_Audit_Report_2026.pdf',
      size: plaintext.length,
      mimeType: 'application/pdf',
      ownerId: owner.id,
      currentCid: cid,
      currentVersion: 1,
      versions: [
        {
          version: 1,
          cid: cid,
          cidV1: cidV1,
          createdAt: Date.now() - 86400000 * 2,
          keyId: 'key_initial_q4'
        }
      ],
      encryptedPayload: {
        cipherHex,
        ivHex,
        tagHex,
        algorithm: 'AES-256-GCM'
      },
      ownerCapsule: {
        ephemeralPublicKey: owner.prePublicKey,
        encryptedKeyHex: crypto.randomBytes(32).toString('hex'),
        authTag: crypto.randomBytes(32).toString('hex')
      },
      originalPlaintextBase64: contentBase64,
      sharedGroupIds: [auditGroup.id],
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2
    };

    this.files.set(fileId, sampleFile);
  }

  // User Helpers
  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public getUserByWallet(walletAddress: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'prePublicKey' | 'prePrivateKey' | 'walletAddress' | 'walletPrivateKey'> & {
    walletAddress?: string;
    walletPrivateKey?: string;
  }): User {
    const id = 'usr_' + crypto.randomBytes(6).toString('hex');
    const wallet = userData.walletAddress ? null : ethers.Wallet.createRandom();
    const pre = generatePREKeyPair();

    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'member',
      walletAddress: userData.walletAddress || wallet!.address,
      walletPrivateKey: userData.walletPrivateKey || wallet!.privateKey,
      prePublicKey: pre.publicKey,
      prePrivateKey: pre.privateKey,
      createdAt: Date.now()
    };
    this.users.set(user.id, user);
    return user;
  }
}

export const db = new Database();
