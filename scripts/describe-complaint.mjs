#!/usr/bin/env node
/**
 * describe-complaint.mjs
 *
 * Prints the creatable fields on your Complaint object so you can correct
 * lib/complaint-schema.ts to match your org, instead of guessing API names.
 *
 * Install: place in scripts/ and add to package.json:
 *   "describe:complaint": "node scripts/describe-complaint.mjs"
 *
 * Run: npm run describe:complaint
 *      npm run describe:complaint -- Case      (describe a different object)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_VERSION = 'v64.0';

const c = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' };

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local');
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    console.error(`${c.r}Could not read .env.local${c.x} — run this from the project root.`);
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const objectName = process.argv[2] || env.SF_COMPLAINT_OBJECT || 'Complaint__c';
const domain = (env.SF_MY_DOMAIN_URL || '').replace(/\/$/, '');

if (!domain.startsWith('https://')) {
  console.error(`${c.r}SF_MY_DOMAIN_URL must be an absolute https URL.${c.x}`);
  process.exit(1);
}

// --- token ------------------------------------------------------------------
const tokenRes = await fetch(`${domain}/services/oauth2/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.SF_CONSUMER_KEY,
    client_secret: env.SF_CONSUMER_SECRET,
  }),
});

const tokenJson = await tokenRes.json().catch(() => ({}));
if (!tokenRes.ok || !tokenJson.access_token) {
  console.error(`${c.r}Authentication failed:${c.x}`, tokenJson.error_description ?? tokenRes.status);
  process.exit(1);
}

// --- list mode --------------------------------------------------------------
if (objectName === '--list') {
  const res = await fetch(`${domain}/services/data/${API_VERSION}/sobjects`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!res.ok) {
    console.error(`${c.r}Could not list objects (${res.status})${c.x}`, await res.text());
    process.exit(1);
  }

  const { sobjects } = await res.json();
  const custom = sobjects.filter((o) => o.custom && !o.deprecatedAndHidden);

  console.log(`\n${c.b}Custom objects visible to the integration user (${custom.length})${c.x}\n`);

  if (custom.length === 0) {
    console.log(`${c.y}  None.${c.x}`);
    console.log(`${c.d}  The user has no access to any custom object, which points at a${c.x}`);
    console.log(`${c.d}  permission problem rather than a missing object.${c.x}\n`);
  } else {
    for (const o of custom) {
      const flag = o.createable ? `${c.g}creatable${c.x}` : `${c.y}read-only${c.x}`;
      console.log(`  ${c.b}${o.name}${c.x}  ${c.d}${o.label}${c.x}  ${flag}`);
    }
    console.log();
  }

  const guesses = custom.filter((o) => /complaint|feedback|grievance/i.test(o.name));
  if (guesses.length) {
    console.log(`${c.b}Possible matches:${c.x} ${guesses.map((o) => o.name).join(', ')}`);
    console.log(`${c.d}Set SF_COMPLAINT_OBJECT in .env.local to the right one.${c.x}\n`);
  }

  process.exit(0);
}

// --- describe ---------------------------------------------------------------
const res = await fetch(`${domain}/services/data/${API_VERSION}/sobjects/${objectName}/describe`, {
  headers: { Authorization: `Bearer ${tokenJson.access_token}` },
});

if (res.status === 404) {
  console.error(`\n${c.r}Object "${objectName}" not found.${c.x}`);
  console.error(`${c.d}Either it doesn't exist, or the integration user has no access to it.${c.x}`);
  console.error(`${c.d}List what IS visible with: node scripts/describe-complaint.mjs --list${c.x}\n`);
  process.exit(1);
}

if (!res.ok) {
  console.error(`${c.r}Describe failed (${res.status})${c.x}`, await res.text());
  process.exit(1);
}

const meta = await res.json();

console.log(`\n${c.b}${meta.label}${c.x} ${c.d}(${meta.name})${c.x}`);
console.log(`${c.d}createable: ${meta.createable}   updateable: ${meta.updateable}${c.x}\n`);

if (!meta.createable) {
  console.log(`${c.r}The integration user cannot create records on this object.${c.x}`);
  console.log(`${c.d}Grant Create on the object via a permission set before continuing.${c.x}\n`);
}

const fields = meta.fields.filter((f) => f.createable && !f.deprecatedAndHidden);

console.log(`${c.b}Creatable fields (${fields.length})${c.x}\n`);

for (const f of fields) {
  const required = !f.nillable && !f.defaultedOnCreate;
  const flag = required ? `${c.y}required${c.x}` : `${c.d}optional${c.x}`;
  const len = f.length ? ` len=${f.length}` : '';

  console.log(`  ${c.b}${f.name}${c.x}  ${c.d}${f.type}${len}${c.x}  ${flag}`);
  console.log(`  ${c.d}label: ${f.label}${c.x}`);

  if (f.type === 'picklist' || f.type === 'multipicklist') {
    const values = f.picklistValues.filter((v) => v.active).map((v) => v.value);
    console.log(`  ${c.d}restricted: ${f.restrictedPicklist}${c.x}`);
    console.log(`  ${c.d}values: ${values.join(' | ')}${c.x}`);
  }
  if (f.type === 'reference') {
    console.log(`  ${c.d}references: ${f.referenceTo.join(', ')}${c.x}`);
  }
  console.log();
}

console.log(`${c.b}Copy the API names above into lib/complaint-schema.ts.${c.x}`);
console.log(`${c.d}Picklist values must match exactly, including case and spacing.${c.x}\n`);
