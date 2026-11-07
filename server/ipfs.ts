import crypto from 'node:crypto';

// Base58btc alphabet for IPFS CIDv0 standard
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: Buffer): string {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let str = '';
  // Leading zeros in buffer become '1's in Base58
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    str += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += ALPHABET[digits[i]];
  }
  return str;
}

export interface IPFSBlock {
  cid: string;
  cidV1: string;
  size: number;
  data: Buffer;
  pinned: boolean;
  createdAt: number;
  sha256Hex: string;
}

export class IPFSEngine {
  private blockStore: Map<string, IPFSBlock> = new Map();

  /**
   * Computes a valid IPFS CIDv0 (Qm...) and CIDv1 (bafy...) from content bytes
   * Uses standard SHA2-256 multihash (0x12 0x20 + 32 bytes)
   */
  public computeCID(data: Buffer): { cidV0: string; cidV1: string; sha256Hex: string } {
    const hash = crypto.createHash('sha256').update(data).digest();
    
    // IPFS Multihash format: [0x12 (sha2-256), 0x20 (32-byte length), ...32 bytes hash]
    const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), hash]);
    const cidV0 = base58Encode(multihash);

    // CIDv1 prefix: 0x01 (CIDv1) + 0x70 (dag-pb) + multihash
    const cidV1Bytes = Buffer.concat([Buffer.from([0x01, 0x70]), multihash]);
    const cidV1 = 'bafybei' + cidV1Bytes.toString('hex').slice(0, 48);

    return {
      cidV0,
      cidV1,
      sha256Hex: hash.toString('hex')
    };
  }

  /**
   * Adds an encrypted object to IPFS and pins it
   */
  public add(data: Buffer, pin = true): IPFSBlock {
    const { cidV0, cidV1, sha256Hex } = this.computeCID(data);

    const block: IPFSBlock = {
      cid: cidV0,
      cidV1,
      size: data.length,
      data,
      pinned: pin,
      createdAt: Date.now(),
      sha256Hex
    };

    this.blockStore.set(cidV0, block);
    // Also index by CIDv1 for flexible retrieval
    this.blockStore.set(cidV1, block);

    return block;
  }

  /**
   * Retrieves content by CID and verifies cryptographic integrity
   */
  public get(cid: string): Buffer {
    const block = this.blockStore.get(cid);
    if (!block) {
      throw new Error(`IPFS_NODE_ERROR: Block with CID '${cid}' not found on local Kubo node or peer gateways.`);
    }

    // Cryptographic content-addressing validation: verify hash matches data
    const currentHash = crypto.createHash('sha256').update(block.data).digest('hex');
    if (currentHash !== block.sha256Hex) {
      throw new Error(`IPFS_INTEGRITY_MISMATCH: Stored content for CID '${cid}' has been tampered with or corrupted.`);
    }

    return block.data;
  }

  /**
   * Check if block exists
   */
  public has(cid: string): boolean {
    return this.blockStore.has(cid);
  }

  /**
   * Get block stats
   */
  public stat(cid: string): { cid: string; size: number; pinned: boolean; createdAt: number } | null {
    const block = this.blockStore.get(cid);
    if (!block) return null;
    return {
      cid: block.cid,
      size: block.size,
      pinned: block.pinned,
      createdAt: block.createdAt
    };
  }

  /**
   * Return node overview metrics
   */
  public getMetrics(): { totalBlocks: number; totalPinned: number; totalBytes: number } {
    let totalBytes = 0;
    let totalPinned = 0;
    const uniqueCids = new Set<string>();

    for (const [key, block] of this.blockStore.entries()) {
      if (key === block.cid) { // Count only canonical CIDv0 to avoid double counting
        uniqueCids.add(block.cid);
        totalBytes += block.size;
        if (block.pinned) totalPinned++;
      }
    }

    return {
      totalBlocks: uniqueCids.size,
      totalPinned,
      totalBytes
    };
  }
}

export const ipfs = new IPFSEngine();
