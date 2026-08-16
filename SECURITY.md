# Security Policy

## Reporting a vulnerability

Please report security issues privately, not in a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/jeff-prov-adv/mes-navigator/security/advisories/new)
on this repository, or email <jeff@provenanceadvisorsllc.com>.

Expect an acknowledgement within a few business days. This is a small project
maintained by one person, so please allow reasonable time to respond before any
public disclosure.

## Scope

**In scope**

- The Next.js application in this repository
- The build pipeline (`scripts/prepare-data.mjs`, `scripts/etl.mjs`)
- The optional drafting route (`src/app/api/draft/`), including when an operator
  has enabled it in their own deployment

**Out of scope**

- **Accuracy of certification content.** Outcomes, metrics, Conditions for
  Enhanced Funding, and guidance text are mirrored from the
  [CMS MES Certification Repository](https://github.com/CMSgov/CMCS-DSG-DSS-Certification).
  Errors in that content are CMS's to correct — report them to CMS, and verify
  against the official repository before relying on anything here for a
  certification submission.
- Interpretation of CMS policy or certification requirements. This tool is
  unofficial and is not affiliated with or endorsed by CMS.
- Findings against a third-party deployment of this code. Report those to
  whoever operates it.

## Known and documented limitations

These are design tradeoffs, already documented, and not treated as
vulnerabilities. They matter if you deploy this yourself.

- **Live drafting is off by default and has no default provider.** It requires
  `ASSISTANT_LIVE=1` together with `MODEL_API_KEY` and `MODEL_ID`. With any of
  those missing, `POST /api/draft` returns 404 and no model endpoint exists. A
  credential added to an environment cannot enable the endpoint on its own.
- **The per-IP rate limit is in-memory**, so it is per serverless instance and
  not a global cap. It stops casual hammering, not a determined caller.
- **`ASSISTANT_ACCESS_CODE` is a shared secret, not identity.** It gates casual
  access; it does not authenticate anyone.
- **A public deployment that enables drafting needs a provider-side spend cap.**
  A public URL with a model credential and no access code is an open proxy to
  your provider account. Set both.
- **Model output is rendered as HTML** after sanitization. Third-party markdown
  from the CMS repository is sanitized server-side before rendering.
- **The build fetches from a third-party source.** It clones the CMS repository
  at build time, pinned to a known-good commit for reproducibility. A committed
  `data-snapshot/` covers a clone failure. If you unpin it, you are trusting
  whatever that repository contains at build time.

## Supported versions

The `main` branch is the only supported version. Fixes land there and reach the
deployed site on the next build.
