import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

type HostingConfig = { d1?: string | null; r2?: string | null };

const hostingConfigPath = resolve(process.cwd(), '.openai/hosting.json');
const hasHostingConfig = existsSync(hostingConfigPath);
const isVercel = Boolean(process.env.VERCEL);

const hostingConfig: HostingConfig = hasHostingConfig
  ? JSON.parse(readFileSync(hostingConfigPath, 'utf8'))
  : {};

const { d1, r2 } = hostingConfig;

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  const platformPlugins = isVercel
    ? [nitro({ preset: 'vercel' })]
    : [
        ...(hasHostingConfig ? [sites()] : []),
        (await import('@cloudflare/vite-plugin')).cloudflare({
          viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
          config: localBindingConfig,
        }),
      ];

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [vinext(), ...platformPlugins],
  };
});