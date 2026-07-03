import { spawnSync } from 'node:child_process';

const nodeCommand = process.execPath;
const tsNodeBin = 'node_modules/ts-node/dist/bin.js';

const result = spawnSync(
  nodeCommand,
  [tsNodeBin, '--compiler-options', '{"module":"CommonJS"}', 'prisma/seed.ts'],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  }
);

process.exit(result.status ?? 1);
