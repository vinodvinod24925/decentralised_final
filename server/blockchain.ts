import crypto from 'node:crypto';
import { ethers } from 'ethers';

export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gasUsed: number;
  status: 'SUCCESS' | 'REVERTED';
  method: string;
  args: any;
  timestamp: number;
  events: Array<{ name: string; data: Record<string, any> }>;
}

export interface OnChainFile {
  fileId: string;
  currentCid: string;
  fileOwner: string;
  fileName: string;
  fileSize: number;
  version: number;
  registeredAt: number;
}

export interface OnChainGrant {
  fileId: string;
  recipient: string;
  expiryTimestamp: number;
  delegationDepth: number;
  isRevoked: boolean;
  grantedAt: number;
}

export class BlockchainRegistryService {
  public readonly contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  public readonly chainId = 31337; // Standard Hardhat / Local chain ID
  public blockNumber = 1042;
  private transactions: BlockchainTransaction[] = [];
  private files: Map<string, OnChainFile> = new Map();
  private grants: Map<string, OnChainGrant> = new Map(); // key: `${fileId}:${recipient.toLowerCase()}`
  private groupGrants: Map<string, boolean> = new Map(); // key: `${fileId}:${groupId}`

  private generateTxHash(): string {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  public getBlockTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Register file on-chain
   */
  public registerFile(
    caller: string,
    fileId: string,
    cid: string,
    fileName: string,
    fileSize: number
  ): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    if (this.files.has(fileId)) {
      throw new Error('REVERT: DeShare: File ID already registered on-chain');
    }

    const file: OnChainFile = {
      fileId,
      currentCid: cid,
      fileOwner: caller.toLowerCase(),
      fileName,
      fileSize,
      version: 1,
      registeredAt: now
    };
    this.files.set(fileId, file);

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: caller,
      to: this.contractAddress,
      gasUsed: 84210,
      status: 'SUCCESS',
      method: 'registerFile',
      args: { fileId, cid, fileName, fileSize },
      timestamp: now,
      events: [
        {
          name: 'FileRegistered',
          data: { fileId, cid, fileOwner: caller, fileName, version: 1, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Grant access on-chain
   */
  public grantAccess(
    caller: string,
    fileId: string,
    recipient: string,
    expiryTimestamp: number,
    delegationDepth = 1
  ): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    const file = this.files.get(fileId);
    if (!file) throw new Error('REVERT: DeShare: File does not exist');
    if (file.fileOwner !== caller.toLowerCase()) throw new Error('REVERT: DeShare: Caller is not file owner');
    if (expiryTimestamp <= now) throw new Error('REVERT: DeShare: Expiry must be strictly in future');
    if (delegationDepth > 3) throw new Error('REVERT: DeShare: Maximum delegation depth is 3');

    const key = `${fileId}:${recipient.toLowerCase()}`;
    const existing = this.grants.get(key);
    if (existing && !existing.isRevoked && existing.expiryTimestamp > now) {
      throw new Error('REVERT: DeShare: Active grant already exists for this recipient');
    }

    const grant: OnChainGrant = {
      fileId,
      recipient: recipient.toLowerCase(),
      expiryTimestamp,
      delegationDepth,
      isRevoked: false,
      grantedAt: now
    };
    this.grants.set(key, grant);

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: caller,
      to: this.contractAddress,
      gasUsed: 62450,
      status: 'SUCCESS',
      method: 'grantAccess',
      args: { fileId, recipient, expiryTimestamp, delegationDepth },
      timestamp: now,
      events: [
        {
          name: 'AccessGranted',
          data: { fileId, recipient, expiryTimestamp, delegationDepth, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Grant group access on-chain
   */
  public grantGroupAccess(caller: string, fileId: string, groupId: string): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    const file = this.files.get(fileId);
    if (!file) throw new Error('REVERT: DeShare: File does not exist');
    if (file.fileOwner !== caller.toLowerCase()) throw new Error('REVERT: DeShare: Caller is not file owner');

    this.groupGrants.set(`${fileId}:${groupId}`, true);

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: caller,
      to: this.contractAddress,
      gasUsed: 45120,
      status: 'SUCCESS',
      method: 'grantGroupAccess',
      args: { fileId, groupId },
      timestamp: now,
      events: [
        {
          name: 'GroupAccessGranted',
          data: { fileId, groupId, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Revoke access on-chain
   */
  public revokeAccess(caller: string, fileId: string, recipient: string): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    const file = this.files.get(fileId);
    if (!file) throw new Error('REVERT: DeShare: File does not exist');
    if (file.fileOwner !== caller.toLowerCase()) throw new Error('REVERT: DeShare: Caller is not file owner');

    const key = `${fileId}:${recipient.toLowerCase()}`;
    const grant = this.grants.get(key);
    if (!grant) throw new Error('REVERT: DeShare: Grant does not exist');
    if (grant.isRevoked) throw new Error('REVERT: DeShare: Grant is already revoked');

    grant.isRevoked = true;

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: caller,
      to: this.contractAddress,
      gasUsed: 38200,
      status: 'SUCCESS',
      method: 'revokeAccess',
      args: { fileId, recipient },
      timestamp: now,
      events: [
        {
          name: 'AccessRevoked',
          data: { fileId, recipient, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Rotate file on-chain after security response
   */
  public rotateFile(caller: string, fileId: string, newCid: string): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    const file = this.files.get(fileId);
    if (!file) throw new Error('REVERT: DeShare: File does not exist');
    if (file.fileOwner !== caller.toLowerCase()) throw new Error('REVERT: DeShare: Caller is not file owner');

    const oldCid = file.currentCid;
    file.currentCid = newCid;
    file.version++;

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: caller,
      to: this.contractAddress,
      gasUsed: 52140,
      status: 'SUCCESS',
      method: 'rotateFile',
      args: { fileId, oldCid, newCid, newVersion: file.version },
      timestamp: now,
      events: [
        {
          name: 'FileRotated',
          data: { fileId, oldCid, newCid, newVersion: file.version, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Record security incident on-chain
   */
  public recordUnauthorizedAttempt(fileId: string, attacker: string, reason: string): BlockchainTransaction {
    this.blockNumber++;
    const now = this.getBlockTimestamp();

    const tx: BlockchainTransaction = {
      txHash: this.generateTxHash(),
      blockNumber: this.blockNumber,
      from: '0x0000000000000000000000000000000000000000',
      to: this.contractAddress,
      gasUsed: 32000,
      status: 'SUCCESS',
      method: 'recordUnauthorizedAttempt',
      args: { fileId, attacker, reason },
      timestamp: now,
      events: [
        {
          name: 'UnauthorizedAccessDetected',
          data: { fileId, attacker, reason, timestamp: now }
        }
      ]
    };

    this.transactions.push(tx);
    return tx;
  }

  /**
   * Verify access on-chain enforcing block.timestamp <= expiryTimestamp
   */
  public isAccessAllowed(fileId: string, userAddress: string): { allowed: boolean; reason: string } {
    const file = this.files.get(fileId);
    if (!file) return { allowed: false, reason: 'FILE_NOT_FOUND_ON_CHAIN' };

    const cleanUser = userAddress.toLowerCase();
    if (file.fileOwner === cleanUser) {
      return { allowed: true, reason: 'OWNER_PERMITTED' };
    }

    const grant = this.grants.get(`${fileId}:${cleanUser}`);
    if (!grant) {
      return { allowed: false, reason: 'NO_ACTIVE_GRANT' };
    }

    if (grant.isRevoked) {
      return { allowed: false, reason: 'GRANT_REVOKED' };
    }

    const now = this.getBlockTimestamp();
    if (now > grant.expiryTimestamp) {
      return { allowed: false, reason: 'GRANT_EXPIRED' };
    }

    return { allowed: true, reason: 'GRANT_VALID' };
  }

  public isGroupAllowed(fileId: string, groupId: string): boolean {
    return Boolean(this.groupGrants.get(`${fileId}:${groupId}`));
  }

  public getTransactions(limit = 50): BlockchainTransaction[] {
    return [...this.transactions].reverse().slice(0, limit);
  }

  public getFile(fileId: string): OnChainFile | null {
    return this.files.get(fileId) || null;
  }
}

export const blockchain = new BlockchainRegistryService();
