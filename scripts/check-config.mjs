#!/usr/bin/env node
/**
 * check-config.mjs
 *
 * Validates .env.local and verifies end-to-end connectivity to the Salesforce
 * Agent API before the dev server is started.
 *
 * Run: npm run check
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

const ENV_PATH = resolve(process.cwd(), '.env.local');

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m',
};
const ok = (m) => console.log(`${c.green}  ✔${c.reset} ${m}`);
const bad = (m) => console.log(`${c.red}  ✘${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}  !${c.reset} ${m}`);
const hint = (m) => console.log(`${c.dim}    → ${m}${c.reset}`);
const head = (m) => console.log(`\n${c.bold}${m}${c.reset}`);

let failed = false;
function fail(message, fix) {
  bad(message);
  if (fix) hint(fix);
  failed = true;
}

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    console.log(`\n${c.red}Could not find .env.local${c.reset}`);
    hint('Copy .env.example to .env.local, then fill in your Salesforce values.');
    hint('Make sure you are running this from the project root folder.');
    process.exit(1);
  }

  const env = {};
  const problems = [];

  raw.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (trimmed.startsWith('export ')) {
      problems.push(`Line ${i + 1}: remove "export " — this is not a shell script.`);
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      problems.push(`Line ${i + 1}: no "=" found.`);
      return;
    }

    const key = trimmed.slice(0, eq).trim().replace(/^export\s+/, '');
    let value = trimmed.slice(eq + 1);

    if (/^\s/.test(value) || /\s$/.test(value)) {
      problems.push(`${key}: has leading or trailing whitespace — remove it.`);
    }
    value = value.trim();

    if (/^["'].*["']$/.test(value)) {
      problems.push(`${key}: remove the surrounding quotation marks.`);
      value = value.slice(1, -1);
    }

    env[key] = value;
  });

  return { env, problems };
}

const REQUIRED = ['SF_MY_DOMAIN_URL', 'SF_CONSUMER_KEY', 'SF_CONSUMER_SECRET', 'SF_AGENT_ID'];

console.log(`\n${c.bold}Silverline — Salesforce configuration check${c.reset}`);
console.log(`${c.dim}Reading ${ENV_PATH}${c.reset}`);

const { env, problems } = loadEnvFile(ENV_PATH);

head('1. File format');
if (problems.length === 0) ok('.env.local parses cleanly');
else problems.forEach((p) => fail(p));

head('2. Required variables');
for (const key of REQUIRED) {
  const v = env[key];
  if (!v) {
    fail(`${key} is missing or empty`, 'Add it to .env.local — see .env.example.');
  } else if (v.includes('...') || v.startsWith('your-')) {
    fail(`${key} still contains a placeholder value`, 'Replace it with the real value from your org.');
  } else {
    const shown = key.includes('SECRET') || key.includes('KEY')
      ? `${v.slice(0, 6)}… (${v.length} chars)`
      : v;
    ok(`${key} = ${shown}`);
  }
}

head('3. Value formats');

const domain = env.SF_MY_DOMAIN_URL ?? '';
if (domain) {
  let parsed = null;
  try { parsed = new URL(domain); } catch { /* handled below */ }

  if (!parsed) {
    fail('SF_MY_DOMAIN_URL is not a valid URL',
      'It must begin with https:// — the most common mistake in this setup.');
  } else if (parsed.protocol !== 'https:') {
    fail(`SF_MY_DOMAIN_URL uses ${parsed.protocol} — must be https:`);
  } else if (parsed.hostname.includes('lightning.force.com')) {
    fail('SF_MY_DOMAIN_URL is a Lightning URL, not a My Domain URL',
      'Use Setup → My Domain → Current My Domain URL (it ends in my.salesforce.com).');
  } else if (!parsed.hostname.endsWith('my.salesforce.com')) {
    warn(`Unexpected host: ${parsed.hostname}`);
    hint('Expected something ending in my.salesforce.com — continuing anyway.');
  } else {
    ok(`My Domain host looks right (${parsed.hostname})`);
  }
}

const agentId = env.SF_AGENT_ID ?? '';
if (agentId) {
  if (!agentId.startsWith('0Xx')) {
    fail(`SF_AGENT_ID does not start with "0Xx" (got "${agentId.slice(0, 6)}…")`,
      'Agent IDs always begin 0Xx. Check the ID in the Agentforce Agents setup URL.');
  } else if (agentId.length !== 15 && agentId.length !== 18) {
    fail(`SF_AGENT_ID is ${agentId.length} characters — expected 15 or 18`,
      'The ID may have been truncated when copied.');
  } else {
    ok(`Agent ID format is valid (${agentId.length} characters)`);
  }
}

const apiBase = (env.SF_API_BASE || 'https://api.salesforce.com').replace(/\/$/, '');
ok(`API base: ${apiBase}`);

if (failed) {
  console.log(`\n${c.red}${c.bold}Fix the problems above, then run this check again.${c.reset}`);
  console.log(`${c.dim}No network requests were attempted.${c.reset}\n`);
  process.exit(1);
}

head('4. Salesforce authentication');

let token;
try {
  const res = await fetch(`${domain.replace(/\/$/, '')}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SF_CONSUMER_KEY,
      client_secret: env.SF_CONSUMER_SECRET,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.access_token) {
    fail(`Token request failed (HTTP ${res.status}): ${json.error ?? 'unknown'}`);
    if (json.error_description) hint(json.error_description);

    switch (json.error) {
      case 'invalid_client':
      case 'invalid_client_id':
        hint('Check SF_CONSUMER_KEY and SF_CONSUMER_SECRET are copied in full.');
        hint('Then check External Client App → Policies tab → Client Credentials Flow is enabled with a Run As user set.');
        break;
      case 'invalid_grant':
        hint('Usually the Run As user is inactive, lacks API Enabled, or is blocked by IP restrictions.');
        hint('Set IP Relaxation to "Relax IP restrictions" on the app Policies tab.');
        break;
      default:
        hint('Confirm SF_MY_DOMAIN_URL points at the same org the External Client App was created in.');
    }
    process.exit(1);
  }

  token = json.access_token;
  ok('Access token issued');

  const scopes = (json.scope ?? '').split(/\s+/).filter(Boolean);
  ok(`Granted scopes: ${scopes.join(', ') || '(none reported)'}`);

  if (!scopes.includes('sfap_api')) {
    fail('The sfap_api scope is missing',
      'Add "Access the Salesforce API Platform (sfap_api)" to the app OAuth scopes. Without it the token works but every Agent API call is rejected.');
    process.exit(1);
  }
  if (!scopes.includes('chatbot_api')) {
    warn('The chatbot_api scope is missing — add it if the next step fails.');
  }

  if (json.api_instance_url && !json.api_instance_url.startsWith(apiBase)) {
    warn(`Salesforce reports api_instance_url = ${json.api_instance_url}`);
    hint(`Consider setting SF_API_BASE to ${json.api_instance_url}`);
  }
} catch (err) {
  fail(`Could not reach Salesforce: ${err.message}`);
  hint('Check your internet connection, and that SF_MY_DOMAIN_URL is spelled correctly.');
  process.exit(1);
}

head('5. Agent session');

let sessionId;
try {
  const res = await fetch(`${apiBase}/einstein/ai-agent/v1/agents/${agentId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      externalSessionKey: randomUUID(),
      instanceConfig: { endpoint: domain.replace(/\/$/, '') },
      streamingCapabilities: { chunkTypes: ['Text'] },
      bypassUser: true,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    fail(`Session request failed (HTTP ${res.status})`);

    if (text.includes('No valid version available')) {
      hint('Your agent has no published version — it has been saved but not activated.');
      hint('Go to Setup → Agentforce Agents → open your agent → Activate.');
    } else if (res.status === 404 && text.trim() === '') {
      hint('Empty 404 usually means the agent ID does not resolve in this org.');
      hint('Most likely cause: your four variables are not all from the SAME org.');
    } else if (res.status === 403) {
      hint('Token is valid but not authorised for the Agent API. Re-check the OAuth scopes.');
    } else if (text) {
      hint(text.slice(0, 400));
    }
    process.exit(1);
  }

  const data = JSON.parse(text);
  sessionId = data.sessionId;
  ok(`Session opened (${sessionId})`);

  const greeting = data.messages?.[0]?.message;
  if (greeting) {
    ok('Agent responded with a greeting:');
    console.log(`${c.dim}    "${greeting.slice(0, 160)}${greeting.length > 160 ? '…' : ''}"${c.reset}`);
  } else {
    warn('Session opened but the agent sent no greeting.');
    hint('Not fatal — check the agent has a welcome message configured.');
  }
} catch (err) {
  fail(`Session request error: ${err.message}`);
  process.exit(1);
}

if (sessionId) {
  await fetch(`${apiBase}/einstein/ai-agent/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'x-session-end-reason': 'UserRequest' },
  }).catch(() => {});
}

console.log(`\n${c.green}${c.bold}All checks passed.${c.reset}`);
console.log(`Run ${c.bold}npm run dev${c.reset} and open http://localhost:3000\n`);
