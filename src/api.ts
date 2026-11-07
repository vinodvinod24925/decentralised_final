import { User, DeShareFile, FileDetail, Group, SecurityEvent, OwnerAlert, DashboardStats, BlockchainTransaction, TestResultItem } from './types.ts';

let currentUserId = localStorage.getItem('deshare_user_id') || 'usr_owner_alice';

export function setActiveUserId(userId: string) {
  currentUserId = userId;
  localStorage.setItem('deshare_user_id', userId);
}

export function getActiveUserId(): string {
  return currentUserId;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('x-user-id', currentUserId);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  getMe: () => request<User & { hasPrivateKey: boolean }>('/auth/me'),
  getUsers: () => request<{ users: User[] }>('/auth/users'),
  switchUser: (userId: string) => {
    setActiveUserId(userId);
    return request<{ message: string; user: User }>('/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  loginEmail: (email: string, password?: string) => request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (email: string, name?: string, role?: string) => request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, role })
  }),
  logout: () => {
    localStorage.removeItem('deshare_user_id');
    localStorage.removeItem('deshare_auth_token');
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },
  loginGoogle: (email: string, name?: string) => request<{ token: string; user: User }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ email, name })
  }),
  loginGuest: () => request<{ token: string; user: User }>('/auth/guest', {
    method: 'POST'
  }),
  getGrants: () => request<{
    grants: Array<{
      id: string;
      fileId: string;
      fileName: string;
      fileCid: string;
      fileVersion: number;
      recipient: { id: string; name: string; email: string; walletAddress: string; prePublicKey: string } | null;
      groupId?: string;
      groupName?: string;
      delegationDepth: number;
      expiryTimestamp: number;
      status: 'active' | 'revoked' | 'expired';
      reKeyHex?: string;
      grantedAt: number;
      revokedAt?: number;
    }>;
  }>('/grants'),

  // Files
  getFiles: () => request<{ files: DeShareFile[] }>('/files'),
  getFile: (id: string) => request<{ file: FileDetail }>(`/files/${id}`),
  uploadFile: (name: string, contentBase64: string, mimeType: string) =>
    request<{
      message: string;
      file: DeShareFile;
      ipfs: { cid: string; cidV1: string; size: number };
      blockchain: { txHash: string; blockNumber: number; gasUsed: number };
    }>('/files/upload', {
      method: 'POST',
      body: JSON.stringify({ name, contentBase64, mimeType })
    }),
  downloadAndDecryptFile: (id: string) =>
    request<{
      message: string;
      fileId: string;
      fileName: string;
      mimeType: string;
      currentCid: string;
      currentVersion: number;
      authType: string;
      decryptedContentBase64: string;
      ipfs: { cid: string; size: number; verified: boolean };
    }>(`/files/${id}/download`),
  shareFile: (fileId: string, params: { recipientEmail?: string; recipientWallet?: string; groupId?: string; expiryHours?: number; delegationDepth?: number }) =>
    request<{ message: string; txHash: string }>(`/files/${fileId}/share`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  revokeAccess: (fileId: string, params: { recipientId?: string; groupId?: string }) =>
    request<{ message: string; txHash?: string }>(`/files/${fileId}/revoke`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Groups
  getGroups: () => request<{ groups: Group[] }>('/groups'),
  getGroup: (id: string) => request<{ group: Group }>(`/groups/${id}`),
  createGroup: (name: string, description: string) => request<{ group: Group }>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  }),
  addGroupMember: (groupId: string, params: { email?: string; walletAddress?: string }) =>
    request<{ message: string; member: User }>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  removeGroupMember: (groupId: string, userId: string) =>
    request<{ message: string }>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE'
    }),

  // Security & Attack Simulator
  simulateAttack: (params: { fileId: string; attackerIdentity?: string; groupSharedId?: string }) =>
    request<{
      message: string;
      simulationReport: {
        attackDetails: {
          fileId: string;
          fileName: string;
          groupName: string;
          actor: string;
          accessStatus: 'DENIED';
          reason: string;
          eventId: string;
          onChainTxHash: string;
        };
        securityResponse: {
          responseStatus: 'COMPLETED';
          keyRotationStatus: 'SUCCESS';
          originalCid: string;
          newCid: string;
          previousVersion: number;
          newVersion: number;
          blockchainTxHash: string;
          authorizedMembersUpdated: number;
          attackerStillDenied: boolean;
        };
        ownerAlert: OwnerAlert;
      };
    }>('/security/simulate-attack', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getSecurityEvents: () => request<{ events: SecurityEvent[] }>('/security/events'),
  getOwnerAlerts: () => request<{ alerts: OwnerAlert[]; unreadCount: number }>('/security/alerts'),
  markAlertRead: (id: string) => request<{ success: boolean }>(`/security/alerts/${id}/mark-read`, {
    method: 'POST'
  }),
  getDashboardStats: () => request<DashboardStats>('/security/stats'),

  // Blockchain & IPFS
  getBlockchainStatus: () => request<{
    contractAddress: string;
    chainId: number;
    currentBlock: number;
    transactions: BlockchainTransaction[];
  }>('/blockchain/status'),
  getIpfsStatus: () => request<{ node: string; metrics: { totalBlocks: number; totalPinned: number; totalBytes: number } }>('/ipfs/status'),

  // Automated Tests
  runTests: () => request<{
    summary: { totalTests: number; passed: number; failed: number; durationTotalMs: number };
    results: TestResultItem[];
  }>('/tests/run', {
    method: 'POST'
  })
};
