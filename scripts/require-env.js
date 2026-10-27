const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');

// In containers/CI, env vars are injected directly by the orchestrator (Docker Compose's
// env_file/environment, GitHub Actions env) rather than a committed .env file on disk.
const envInjectedExternally = Boolean(process.env.PORT || process.env.CI);

if (!envInjectedExternally && (!fs.existsSync(envPath) || fs.statSync(envPath).size === 0)) {
  console.error(`
Missing .env file.

Frontend and backend will not start until you create one:

  cp example.env .env

Windows PowerShell:

  Copy-Item example.env .env
`);
  process.exit(1);
}
