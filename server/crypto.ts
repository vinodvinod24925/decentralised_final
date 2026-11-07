import crypto from 'node:crypto';

export interface EncryptedPayload {
  cipherHex: string;
  ivHex: string;
  tagHex: string;
  algorithm: 'AES-256-GCM';
}

export interface PREKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface Capsule {
  ephemeralPublicKey: string; // R = g^r
  encryptedKeyHex: string;   // C_K = K xor H(S)
  authTag: string;
  reKeyHex?: string;
  delegationDepth?: number;
}

export interface ReEncryptionKey {
  fromPublicKey: string;
  toPublicKey: string;
  reKeyHex: string;
  delegationDepth: number;
}

/**
 * AES-256-GCM Implementation
 */
export function generateAESKey(): Buffer {
  return crypto.randomBytes(32);
}

export function encryptAES256GCM(plaintext: Buffer, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit authentication tag

  return {
    cipherHex: encrypted.toString('hex'),
    ivHex: iv.toString('hex'),
    tagHex: tag.toString('hex'),
    algorithm: 'AES-256-GCM'
  };
}

export function decryptAES256GCM(payload: EncryptedPayload, key: Buffer): Buffer {
  const iv = Buffer.from(payload.ivHex, 'hex');
  const tag = Buffer.from(payload.tagHex, 'hex');
  const cipher = Buffer.from(payload.cipherHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(cipher), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error('DECRYPTION_FAILED: Ciphertext authentication tag mismatch or corrupted key/data.');
  }
}

/**
 * Proxy Re-Encryption (PRE) using ECDH curves (prime256v1)
 */
export function generatePREKeyPair(): PREKeyPair {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey('hex'),
    privateKey: ecdh.getPrivateKey('hex')
  };
}

/**
 * Alice encapsulates the AES key using her PRE public key
 * Capsule = (R = g^r, C_K = K ^ H(g^{a*r}))
 */
export function encapsulateKey(aesKey: Buffer, ownerPublicKeyHex: string): { capsule: Capsule; sharedSecretHex: string } {
  const ephemeral = crypto.createECDH('prime256v1');
  ephemeral.generateKeys();
  const ephemeralPubKey = ephemeral.getPublicKey('hex');

  // Compute S = (g^a)^r = g^{a*r}
  const sharedSecret = ephemeral.computeSecret(Buffer.from(ownerPublicKeyHex, 'hex'));
  const derivedMask = crypto.createHash('sha256').update(sharedSecret).digest();

  // Mask the AES key (XOR with derived key)
  const maskedKey = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    maskedKey[i] = aesKey[i] ^ derivedMask[i];
  }

  // Generate MAC tag for capsule integrity
  const mac = crypto.createHmac('sha256', sharedSecret).update(maskedKey).digest('hex');

  return {
    capsule: {
      ephemeralPublicKey: ephemeralPubKey,
      encryptedKeyHex: maskedKey.toString('hex'),
      authTag: mac
    },
    sharedSecretHex: sharedSecret.toString('hex')
  };
}

/**
 * Owner decapsulates the AES key using owner's private key a
 * S = R^a = (g^r)^a = g^{a*r}
 */
export function decapsulateOwnerKey(capsule: Capsule, ownerPrivateKeyHex: string): Buffer {
  const owner = crypto.createECDH('prime256v1');
  owner.setPrivateKey(Buffer.from(ownerPrivateKeyHex, 'hex'));

  const sharedSecret = owner.computeSecret(Buffer.from(capsule.ephemeralPublicKey, 'hex'));
  const expectedMac = crypto.createHmac('sha256', sharedSecret).update(Buffer.from(capsule.encryptedKeyHex, 'hex')).digest('hex');

  if (expectedMac !== capsule.authTag) {
    throw new Error('CAPSULE_AUTH_FAILED: Ephemeral secret integrity check failed');
  }

  const derivedMask = crypto.createHash('sha256').update(sharedSecret).digest();
  const maskedKey = Buffer.from(capsule.encryptedKeyHex, 'hex');
  const aesKey = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    aesKey[i] = maskedKey[i] ^ derivedMask[i];
  }
  return aesKey;
}

/**
 * Generate Re-Encryption key rk_{A -> B}
 * Alice computes S = R^a, dh = a * B, and binds S with dh
 */
export function generateReEncryptionKey(
  ownerPrivateKeyHex: string,
  recipientPublicKeyHex: string,
  delegationDepth = 1,
  capsule?: Capsule
): ReEncryptionKey {
  if (delegationDepth > 3) {
    throw new Error('DELEGATION_DEPTH_EXCEEDED: Maximum delegation depth is 3');
  }

  const alice = crypto.createECDH('prime256v1');
  alice.setPrivateKey(Buffer.from(ownerPrivateKeyHex, 'hex'));
  const dhSecret = alice.computeSecret(Buffer.from(recipientPublicKeyHex, 'hex'));

  let reKey: string;
  if (capsule) {
    const sharedSecret = alice.computeSecret(Buffer.from(capsule.ephemeralPublicKey, 'hex'));
    const dhMask = crypto.createHash('sha256').update(dhSecret).update(Buffer.from('PRE_DELEGATION_V1')).digest();
    const reKeyBuf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      reKeyBuf[i] = sharedSecret[i] ^ dhMask[i];
    }
    reKey = reKeyBuf.toString('hex');
  } else {
    // If capsule not passed upfront, reKey is derived directly from dhSecret
    reKey = crypto.createHash('sha256').update(dhSecret).update(Buffer.from('PRE_DELEGATION_V1')).digest('hex');
  }

  return {
    fromPublicKey: alice.getPublicKey('hex'),
    toPublicKey: recipientPublicKeyHex,
    reKeyHex: reKey,
    delegationDepth
  };
}

/**
 * Untrusted Proxy re-encrypts the capsule for Bob using reKey
 */
export function reEncryptCapsule(capsule: Capsule, reKey: ReEncryptionKey): Capsule {
  if (reKey.delegationDepth > 3) {
    throw new Error('DELEGATION_DEPTH_EXCEEDED: Cannot transform capsule beyond depth 3');
  }

  return {
    ephemeralPublicKey: capsule.ephemeralPublicKey,
    encryptedKeyHex: capsule.encryptedKeyHex,
    authTag: capsule.authTag,
    reKeyHex: reKey.reKeyHex,
    delegationDepth: reKey.delegationDepth
  };
}

/**
 * Recipient Bob decapsulates the transformed capsule using Bob's private key b and Alice's public key A
 */
export function decapsulateRecipientKey(
  transformedCapsule: Capsule,
  recipientPrivateKeyHex: string,
  ownerPublicKeyHex: string,
  reKeyHex?: string
): Buffer {
  const bob = crypto.createECDH('prime256v1');
  bob.setPrivateKey(Buffer.from(recipientPrivateKeyHex, 'hex'));

  // Bob computes dh = b * A = g^{a*b}
  const dhSecret = bob.computeSecret(Buffer.from(ownerPublicKeyHex, 'hex'));
  const activeReKey = reKeyHex || transformedCapsule.reKeyHex;

  let sharedSecret: Buffer;
  if (activeReKey && activeReKey.length === 64) {
    const dhMask = crypto.createHash('sha256').update(dhSecret).update(Buffer.from('PRE_DELEGATION_V1')).digest();
    const reKeyBuf = Buffer.from(activeReKey, 'hex');
    sharedSecret = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      sharedSecret[i] = reKeyBuf[i] ^ dhMask[i];
    }
  } else {
    // Direct ephemeral computation if shared directly
    sharedSecret = bob.computeSecret(Buffer.from(transformedCapsule.ephemeralPublicKey, 'hex'));
  }

  // Derive mask and decrypt AES key
  const derivedMask = crypto.createHash('sha256').update(sharedSecret).digest();
  const maskedKey = Buffer.from(transformedCapsule.encryptedKeyHex, 'hex');
  const aesKey = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    aesKey[i] = maskedKey[i] ^ derivedMask[i];
  }

  return aesKey;
}
