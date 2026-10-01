// lib/agent-config.ts
//
// Configuration is read through getters, not top-level constants, so a missing
// variable fails at request time with a named error rather than breaking the
// build. The error names both the variable and where to set it.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Set it in .env.local locally, and in ` +
        `Vercel → Project → Settings → Environment Variables for every environment you deploy.`
    );
  }
  return value;
}

/** Absolute https URL, validated. A missing scheme is the most common setup error. */
function requiredUrl(name: string): string {
  const value = required(name);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `${name} must be an absolute URL including the scheme. Got "${value}" — did you omit https:// ?`
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${name} must use https://, got ${parsed.protocol}`);
  }
  return value.replace(/\/$/, '');
}

export const config = {
  get myDomainUrl() {
    return requiredUrl('SF_MY_DOMAIN_URL');
  },
  get apiBase() {
    return process.env.SF_API_BASE ? requiredUrl('SF_API_BASE') : 'https://api.salesforce.com';
  },
  get consumerKey() {
    return required('SF_CONSUMER_KEY');
  },
  get consumerSecret() {
    return required('SF_CONSUMER_SECRET');
  },
  get agentId() {
    return required('SF_AGENT_ID');
  },
};

export const SESSION_COOKIE = 'sl_agent_session';
