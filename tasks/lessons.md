# Lessons

Patterns worth not re-learning. Append on correction.

## Repo facts that bit once

- `scripts/check-links.mjs` reads **`BASE_URL`**, not a `CHECK_LINKS_*` variable. Running it against
  a server on a non-default port needs `BASE_URL=http://localhost:<port> npm run check:links`;
  otherwise it waits on :3000 and fails with "server never became ready".
- `scripts/prepare-data.mjs` reuses an existing clone at `$TMPDIR/certrepo` whenever `_data/` is
  present, which skips checkout entirely. Testing a different `CERT_REPO_REF` requires removing that
  directory first, or the build silently uses whatever the clone was last on.
