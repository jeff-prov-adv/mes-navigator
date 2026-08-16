/**
 * Live drafting is opt-in, off by default, and provider-configured.
 *
 * Public deployments ship the assistant as a worked example with no model
 * endpoint at all — the route returns 404 rather than advertising an
 * unconfigured feature or naming internal configuration to visitors.
 *
 * The operator supplies the endpoint, credential, and model. Nothing here
 * defaults to a particular vendor's model: point MODEL_BASE_URL at whichever
 * host serves the Messages API shape for you — a commercial API, a cloud
 * provider's managed endpoint inside your own compliance boundary, or a
 * gateway in front of either.
 *
 *   ASSISTANT_LIVE   "1" to enable. Required, so a credential on its own can
 *                    never light up a public endpoint.
 *   MODEL_API_KEY    credential for the endpoint below
 *   MODEL_ID         model identifier, exactly as your provider names it
 *   MODEL_BASE_URL   endpoint origin (default: https://api.anthropic.com)
 */
export const MODEL_BASE_URL_DEFAULT = 'https://api.anthropic.com';

export const modelBaseUrl = () => process.env.MODEL_BASE_URL || MODEL_BASE_URL_DEFAULT;
export const modelId = () => process.env.MODEL_ID || '';

/**
 * Every piece must be present. There is deliberately no default model id: a
 * hardcoded one silently pins every deployment to a single vendor's catalog
 * and goes stale as soon as that vendor renames something.
 */
export function assistantLive(): boolean {
  return (
    process.env.ASSISTANT_LIVE === '1' &&
    !!process.env.MODEL_API_KEY &&
    !!process.env.MODEL_ID
  );
}
