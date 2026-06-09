import dns from 'node:dns';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

/**
 * `mongodb+srv` uses DNS SRV lookups. On Windows, some Node + resolver setups
 * return querySrv ECONNREFUSED (stub resolver / c-ares). We fix by using
 * explicit DNS servers for this process only.
 *
 * - Set DNS_SERVERS=8.8.8.8,1.1.1.1 in server/.env to pick servers yourself.
 * - On Windows + mongodb+srv, we default to Cloudflare + Google unless
 *   MONGODB_SKIP_WIN_DNS_FIX=1 (e.g. corporate DNS required).
 */
function configureDnsForMongo(uri: string) {
  const custom = process.env.DNS_SERVERS?.trim();
  if (custom) {
    const servers = custom
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length) dns.setServers(servers);
    return;
  }
  if (
    process.platform === 'win32' &&
    uri.startsWith('mongodb+srv://') &&
    process.env.MONGODB_SKIP_WIN_DNS_FIX !== '1'
  ) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

export async function connectDb(uri: string) {
  let connectUri = uri;
  if (uri === 'memory' || uri.startsWith('memory://')) {
    memoryServer = await MongoMemoryServer.create();
    connectUri = memoryServer.getUri('ecommerce-shop');
    console.log('Using in-memory MongoDB (local dev). Set MONGODB_URI in server/.env for Atlas.');
  }

  configureDnsForMongo(connectUri);
  mongoose.set('strictQuery', true);
  await mongoose.connect(connectUri, {
    serverSelectionTimeoutMS: 15000,
  });
}
