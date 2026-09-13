# MES Certification Navigator

Makes the [CMS MES Certification Repository](https://github.com/CMSgov/CMCS-DSG-DSS-Certification) —
the source of truth for Streamlined Modular Certification outcomes and metrics — searchable and
crosswalked. Built by [Provenance Advisors](https://provenanceadvisorsllc.com).

Unofficial. Not affiliated with or endorsed by CMS.

## What it indexes

| | Count |
|---|---|
| CMS-required outcomes | 132 across 12 modules |
| CMS-approved state-specific examples | 58 |
| Conditions for Enhanced Funding | 22 |
| CFR citations (Title 42 and 45), linked to eCFR | 124 |
| CMS guidance pages | 6 |

Four further modules (EVV, HIE, AVS, 1115/Waiver) certify against state-specific outcomes only.

## Data pipeline

`npm run build` runs `scripts/prepare-data.mjs` before `next build`. That clones the CMS repository
and the MITA blueprint, runs the ETLs in `scripts/etl.mjs` and `scripts/etl-mita.mjs`, and writes
`src/data/*.json` plus the guidance images into `public/`.

Content is **pinned** to reviewed upstream commits so builds are reproducible and no upstream can
change the site's content between deploys. There are two sources, each with its own pin in
`data-snapshot/meta.json`: `sourceCommit` for the CMS certification repository, and
`mitaSourceCommit` for [nickarrow/mita-open-blueprint](https://github.com/nickarrow/mita-open-blueprint),
the machine-readable transcription of the MITA framework. The pins are not constants in the build
script. Each is the commit that produced the committed data, so a pin and the data it generated
cannot drift apart. The build log reports which commit each source used, where its pin came from,
and whether it applied:

```
Cert repo at commit c9db9cd… (pinned: c9db9cd… from data-snapshot/meta.json)
MITA repo at commit abef120… (pinned: abef120… from data-snapshot/meta.json)
```

The pins move weekly, not never. `.github/workflows/cms-sync.yml` runs every Monday and asks both
upstreams what `HEAD` is. When either differs from its pin, it rebuilds against both, runs the full CI
suite (lint, typecheck, build, data invariants, link check), and opens a PR carrying the new data plus
a summary of what changed: count deltas per dataset, and the outcomes, CEFs, citations, guidance
pages, and MITA processes added, removed, or reworded. Removals are flagged first, since the ETL
floors tolerate a partial loss. Merging that PR advances the pins, because every build rewrites
`data-snapshot/meta.json` with the commits it used. Nothing deploys until a human merges.

`node scripts/summarize-sync.mjs` prints that same summary locally after any build. It compares the
committed snapshot against the freshly built `src/data/`.

To build against something other than a pin, set `CERT_REPO_REF` or `MITA_REPO_REF` to a commit, tag,
or branch; `HEAD` tracks the latest. If a pin cannot be read and its `*_REPO_REF` is not set, the
build fails rather than quietly tracking whatever upstream has today. Note that reusing an
existing clone via `CERT_REPO_DIR` skips checkout and therefore bypasses the pin — the build warns
loudly and logs `(PIN NOT APPLIED)` when that happens.

The ETL fails the build rather than shipping a hole: a missing CMS-required CSV throws, and sanity
assertions enforce floors on every count. If the clone itself fails, the committed `data-snapshot/`
is used as a fallback with a loud warning — that path skips the ETL, which is why the generated data
and `public/SMC Process/` images are committed rather than gitignored.

Citation parsing lives only in `scripts/etl.mjs`. The UI consumes precomputed link segments; it does
not re-parse citations. Keep it that way — two copies of that regex previously drifted apart.

### eCFR link normalization

eCFR routes only `/current/title-N/section-X.Y` and `/current/title-N/part-N`. Raw CMS cites are
normalized onto those:

| Cite shape | Resolves to |
|---|---|
| `42 CFR 433.138(d)` | `section-433.138#p-433.138(d)` |
| `42 CFR 435.940-965` | `section-435.940` (first in range) |
| `42 CFR 438` | `part-438` |
| `42 CFR 431.052` | `section-431.52` — CMS zero-pads two cites that don't exist that way in the CFR |

Where a cite is normalized, the discrepancy is shown on the page rather than silently corrected.

## Environment

| Var | Purpose |
|---|---|
| `ASSISTANT_LIVE` | `1` enables live drafting. Required — a credential alone never exposes the endpoint. |
| `MODEL_API_KEY` | Credential for the model endpoint. |
| `MODEL_ID` | Model identifier, exactly as your provider names it. No default. |
| `MODEL_BASE_URL` | Endpoint origin serving the Messages API shape (default `https://api.anthropic.com`). Point it at your own provider or boundary. |
| `ASSISTANT_ACCESS_CODE` | If set, the assistant requires this code. Set it before any public deployment that also has an API key. |
| `CERT_REPO_REF` | Build against a CMS commit/tag/branch other than the pin in `data-snapshot/meta.json`. `HEAD` tracks latest. Not sensitive — a public commit in a public repo. |
| `CERT_REPO_DIR` | Reuse an existing local clone instead of cloning. Bypasses the pin; the build warns when it does. |
| `MITA_REPO_REF` | Build against a MITA blueprint commit, tag, or branch other than `mitaSourceCommit`. `HEAD` tracks latest. |
| `MITA_REPO_DIR` | Reuse an existing local MITA clone instead of cloning. Bypasses the pin; the build warns when it does. |

The assistant's per-IP rate limit is in-memory, so it is per serverless instance and not a global
cap. A public deployment with an API key needs `ASSISTANT_ACCESS_CODE` **and** a provider spend cap.

## Local development

```bash
npm install
npm run build   # required first — generates src/data/ that the app imports
npm run dev
```

## Contributing

Bug reports and fixes are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for what belongs in this
tool and what doesn't. For anything beyond a fix, please open an issue before writing code.

## Licensing

The MIT license in this repository covers the application code only.

Content under `src/data/`, `data-snapshot/`, and `public/SMC Process/` is derived from the CMS MES
Certification Repository, a publicly published U.S. government work. CMS has not asserted a license
on it (their `LICENSE.md` reads "FIXME: This is probably in the public domain, but CMMS needs to put
their license here"), so it is attributed rather than relicensed, and the MIT grant here should not
be read as extending to it.
