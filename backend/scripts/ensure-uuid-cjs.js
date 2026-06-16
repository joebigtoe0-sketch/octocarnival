/**
 * rpc-websockets@9 pins uuid@14 (ESM-only) but loads it via require().
 * Remove the nested copy so Node resolves uuid@9 from the workspace root.
 */
const fs   = require('fs');
const path = require('path');

function findRpcWebsocketsDirs(startDir, depth = 0) {
  if (depth > 6) return [];
  const dirs = [];
  const nm = path.join(startDir, 'node_modules', 'rpc-websockets');
  if (fs.existsSync(nm)) dirs.push(nm);
  if (depth === 0) {
    const root = path.join(startDir, 'node_modules');
    if (fs.existsSync(root)) {
      for (const entry of fs.readdirSync(root)) {
        if (entry.startsWith('@')) {
          const scoped = path.join(root, entry);
          for (const pkg of fs.readdirSync(scoped)) {
            const nested = path.join(scoped, pkg, 'node_modules', 'rpc-websockets');
            if (fs.existsSync(nested)) dirs.push(nested);
          }
        }
      }
    }
  }
  return dirs;
}

const repoRoot = path.join(__dirname, '../..');
let patched = 0;

for (const rpcDir of findRpcWebsocketsDirs(repoRoot)) {
  const nestedUuid = path.join(rpcDir, 'node_modules', 'uuid');
  if (!fs.existsSync(nestedUuid)) continue;
  try {
    const ver = require(path.join(nestedUuid, 'package.json')).version;
    if (ver.startsWith('1')) {
      fs.rmSync(nestedUuid, { recursive: true, force: true });
      patched++;
      console.log(`[ensure-uuid-cjs] removed uuid@${ver} from ${path.relative(repoRoot, rpcDir)}`);
    }
  } catch {
    /* ignore */
  }
}

if (patched === 0) {
  console.log('[ensure-uuid-cjs] ok — no ESM uuid nested under rpc-websockets');
} else {
  console.log(`[ensure-uuid-cjs] patched ${patched} location(s)`);
}
