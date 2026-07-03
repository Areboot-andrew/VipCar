import { spawnSync } from 'node:child_process';

const reset = process.argv.includes('--reset');
const nodeCommand = process.execPath;

const env = {
  ...process.env,
  FORCE_DEMO_SEED: 'true',
  AUTO_DEMO_SEED: 'false',
};

if (reset) {
  env.RESET_DEMO_DATA = 'true';
}

const result = spawnSync(nodeCommand, ['scripts/run-seed.mjs'], {
  stdio: 'inherit',
  env,
  shell: false,
});

process.exit(result.status ?? 1);
