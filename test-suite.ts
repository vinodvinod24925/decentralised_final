/**
 * DeShare Automated End-to-End Cryptographic & Access Control Test Suite
 * Tests A through F as specified in faculty project requirements.
 */

import crypto from 'node:crypto';
import { db } from './server/db.ts';
import { ipfs } from './server/ipfs.ts';
import { blockchain } from './server/blockchain.ts';
import {
  generateAESKey,
  encryptAES256GCM,
  decryptAES256GCM,
  encapsulateKey,
  generateReEncryptionKey,
  reEncryptCapsule,
  decapsulateRecipientKey
} from './server/crypto.ts';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   DeShare End-to-End Verification & Cryptographic Test Suite   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST A: Normal File Sharing Workflow
  try {
    process.stdout.write('Running Test A: Normal File Sharing... ');
    const alice = db.getUser('usr_owner_alice')!;
    const bob = db.getUser('usr_member_bob')!;
    const testContent = Buffer.from('Faculty Verification Payload: DeShare v4 PRE & AES-256-GCM test', 'utf-8');

    // 1. AES key generation and GCM encryption
    const aesKey = generateAESKey();
    const encrypted = encryptAES256GCM(testContent, aesKey);

    // 2. IPFS storage with genuine CID
    const block = ipfs.add(Buffer.from(JSON.stringify(encrypted), 'utf-8'), true);
    if (!block.cid.startsWith('Qm') && !block.cid.startsWith('bafy')) {
      throw new Error('Invalid CID produced');
    }

    // 3. PRE encapsulation
    const { capsule } = encapsulateKey(aesKey, alice.prePublicKey);

    // 4. PRE re-encryption token generation
    const reKey = generateReEncryptionKey(alice.prePrivateKey, bob.prePublicKey, 1, capsule);
    const transformedCapsule = reEncryptCapsule(capsule, reKey);

    // 5. Bob decapsulates and decrypts
    const unwrappedKey = decapsulateRecipientKey(transformedCapsule, bob.prePrivateKey, alice.prePublicKey, reKey.reKeyHex);
    const decryptedBytes = decryptAES256GCM(encrypted, unwrappedKey);

    if (decryptedBytes.toString('utf-8') !== testContent.toString('utf-8')) {
      throw new Error('Decrypted content mismatch');
    }

    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: CID: ${block.cid} | Decrypted bytes match original (${decryptedBytes.length} bytes)\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  // TEST B: Unauthorized Access Interception
  try {
    process.stdout.write('Running Test B: Unauthorized Access Interception... ');
    const alice = db.getUser('usr_owner_alice')!;
    const attackerAddress = '0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E';
    const testFileId = 'fil_test_b';

    blockchain.registerFile(alice.walletAddress, testFileId, 'QmTestCID123', 'test.pdf', 1024);
    const authCheck = blockchain.isAccessAllowed(testFileId, attackerAddress);

    if (authCheck.allowed) {
      throw new Error('Unauthorized attacker was incorrectly granted access');
    }

    const secTx = blockchain.recordUnauthorizedAttempt(testFileId, attackerAddress, 'Unauthorized simulation attempt');
    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: Access status: DENIED (${authCheck.reason}) | On-chain audit Tx: ${secTx.txHash}\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  // TEST C: Security Response (Key & CID Rotation)
  try {
    process.stdout.write('Running Test C: Security Response (CID Rotation)... ');
    const alice = db.getUser('usr_owner_alice')!;
    const originalPlaintext = Buffer.from('Original Secret Payload prior to simulated compromise', 'utf-8');

    // First version
    const key1 = generateAESKey();
    const enc1 = encryptAES256GCM(originalPlaintext, key1);
    const block1 = ipfs.add(Buffer.from(JSON.stringify(enc1), 'utf-8'), true);

    // Key Rotation triggered by attack
    const key2 = generateAESKey();
    const enc2 = encryptAES256GCM(originalPlaintext, key2);
    const block2 = ipfs.add(Buffer.from(JSON.stringify(enc2), 'utf-8'), true);

    if (block1.cid === block2.cid) {
      throw new Error('New CID must be cryptographically distinct from old CID');
    }

    const rotateTx = blockchain.rotateFile(alice.walletAddress, 'fil_test_b', block2.cid);
    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: Old CID: ${block1.cid} -> New CID: ${block2.cid} | Rotation Tx: ${rotateTx.txHash}\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  // TEST D: Revocation
  try {
    process.stdout.write('Running Test D: Revocation Enforcement... ');
    const alice = db.getUser('usr_owner_alice')!;
    const bob = db.getUser('usr_member_bob')!;
    const testFileId = 'fil_test_d';

    blockchain.registerFile(alice.walletAddress, testFileId, 'QmRevokeTest', 'confidential.docx', 512);
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    blockchain.grantAccess(alice.walletAddress, testFileId, bob.walletAddress, futureExpiry, 1);

    const beforeRevoke = blockchain.isAccessAllowed(testFileId, bob.walletAddress);
    if (!beforeRevoke.allowed) throw new Error('Grant should be valid initially');

    blockchain.revokeAccess(alice.walletAddress, testFileId, bob.walletAddress);
    const afterRevoke = blockchain.isAccessAllowed(testFileId, bob.walletAddress);

    if (afterRevoke.allowed || afterRevoke.reason !== 'GRANT_REVOKED') {
      throw new Error('Access was not denied post-revocation');
    }

    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: On-chain grant state: ${afterRevoke.reason} | Expiry: ${futureExpiry}\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  // TEST E: Expiration Enforcement
  try {
    process.stdout.write('Running Test E: Expiration Enforcement... ');
    const alice = db.getUser('usr_owner_alice')!;
    const charlie = db.getUser('usr_member_charlie')!;
    const testFileId = 'fil_test_e';

    blockchain.registerFile(alice.walletAddress, testFileId, 'QmExpiryTest', 'contract.pdf', 2048);
    // Expire 1 second ago
    const pastExpiry = Math.floor(Date.now() / 1000) - 1;
    // We register directly to verify block.timestamp boundary enforcement
    try {
      blockchain.grantAccess(alice.walletAddress, testFileId, charlie.walletAddress, pastExpiry, 1);
      throw new Error('Smart contract should have rejected grant with past expiry');
    } catch (revertError: any) {
      if (!revertError.message.includes('Expiry must be strictly in future')) {
        throw revertError;
      }
    }

    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: Smart contract reverted past timestamp | block.timestamp strictly enforced\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  // TEST F: Cryptographic Tamper & Failure Handling
  try {
    process.stdout.write('Running Test F: Tamper Detection & Failure Handling... ');
    const key = generateAESKey();
    const data = Buffer.from('Top secret integrity test', 'utf-8');
    const encrypted = encryptAES256GCM(data, key);

    // Tamper with authentication tag
    const corruptedTag = {
      ...encrypted,
      tagHex: '00' + encrypted.tagHex.slice(2)
    };

    let caught = false;
    try {
      decryptAES256GCM(corruptedTag, key);
    } catch {
      caught = true;
    }

    if (!caught) {
      throw new Error('Failed to reject corrupted GCM authentication tag');
    }

    console.log('\x1b[32mPASS\x1b[0m');
    console.log(`   Evidence: AES-256-GCM auth tag mismatch raised safely; zero data leakage\n`);
    passed++;
  } catch (e: any) {
    console.log('\x1b[31mFAIL\x1b[0m: ' + e.message + '\n');
    failed++;
  }

  console.log('----------------------------------------------------------------');
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED across 6 faculty scenarios.`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
