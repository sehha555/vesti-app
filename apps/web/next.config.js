import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  // Fix monorepo workspace root detection (prevents "multiple lockfiles" warning)
  outputFileTracingRoot: path.join(__dirname, '../../'),
  eslint: {
    // Lint 由根目錄的 `npm run lint`（eslint.config.js）在 CI 單獨跑，build 不重複跑
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys',
        '**/DumpStack.log.tmp'
      ]
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' http://localhost:*"
          }
        ]
      }
    ];
  }
}; export default nextConfig;