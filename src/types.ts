export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'member' | 'admin';
  walletAddress: string;
  prePublicKey: string;
}

export interface FileVersion {
  version: number;
  cid: string;
  cidV1: string;
  createdAt: number;
  rotationReason?: string;
  keyId: string;
}

export interface DeShareFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  owner: {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
  };
  isOwner: boolean;
  currentCid: string;
  currentVersion: number;
  versionsCount: number;
  sharedGroupIds: string[];
  createdAt: number;
}

export interface FileDetail extends DeShareFile {
  versions: FileVersion[];
  sharedGroups: Group[];
  grants: Array<{
    id: string;
    recipient: { id: string; name: string; email: string; wallet: string } | null;
    groupId?: string;
    delegationDepth: number;
    expiryTimestamp: number;
    status: 'active' | 'revoked' | 'expired';
    grantedAt: number;
  }>;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  ownerId?: string;
  memberIds?: string[];
  owner?: { id: string; name: string; email: string };
  memberCount?: number;
  members?: Array<{
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    isAdmin: boolean;
    isOwner: boolean;
  }>;
  sharedFiles?: Array<{
    id: string;
    name: string;
    size: number;
    currentCid: string;
    version: number;
  }>;
  isOwner?: boolean;
  isAdmin?: boolean;
  createdAt: number;
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

export interface DashboardStats {
  totalUploadedFiles: number;
  totalSharedFiles: number;
  totalGroups: number;
  activeGrants: number;
  revokedOrExpiredGrants: number;
  totalSecurityEvents: number;
  unreadAlerts: number;
  blockchainTransactions: number;
  ipfsStats: {
    totalBlocks: number;
    totalPinned: number;
    totalBytes: number;
  };
}

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

export interface TestResultItem {
  name: string;
  description: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  durationMs: number;
}
