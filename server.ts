import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.ts';
import { ipfs } from './server/ipfs.ts';
import { db } from './server/db.ts';
import { blockchain } from './server/blockchain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Seed sample file block into IPFS storage engine and blockchain
  const sampleFile = db.files.get('fil_audit_q4');
  if (sampleFile) {
    const rawPayload = Buffer.from(JSON.stringify(sampleFile.encryptedPayload), 'utf-8');
    const block = ipfs.add(rawPayload, true);
    sampleFile.currentCid = block.cid;
    sampleFile.versions[0].cid = block.cid;
    sampleFile.versions[0].cidV1 = block.cidV1;

    const owner = db.getUser(sampleFile.ownerId)!;
    if (!blockchain.getFile(sampleFile.id)) {
      blockchain.registerFile(owner.walletAddress, sampleFile.id, block.cid, sampleFile.name, sampleFile.size);
      blockchain.grantGroupAccess(owner.walletAddress, sampleFile.id, 'grp_crypto_audit');
    }
  }

  // Mount API router under /api
  app.use('/api', apiRouter);

  // Development: Vite middleware mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeShare] Decentralized Secure File Sharing Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[DeShare] Server startup failed:', err);
  process.exit(1);
});
