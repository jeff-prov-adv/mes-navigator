# Lessons

Patterns worth not re-learning. Append on correction.

## Repo facts that bit once

- `scripts/check-links.mjs` reads **`BASE_URL`**, not a `CHECK_LINKS_*` variable. Running it against
  a server on a non-default port needs `BASE_URL=http://localhost:<port> npm run check:links`;
  otherwise it waits on :3000 and fails with "server never became ready".
- `scripts/prepare-data.mjs` reuses an existing clone at `$TMPDIR/certrepo` (or `$TMPDIR/mitarepo`)
  whenever its marker directory is present, which skips checkout entirely. Testing a different
  `CERT_REPO_REF` or `MITA_REPO_REF` requires removing that directory first, or the build silently
  uses whatever the clone was last on.
- A cached clone can also be damaged: the directory and marker survive, but git cannot resolve
  `HEAD`. `prepare-data.mjs` treats that as a clone failure and falls back to the committed snapshot,
  so a rebuild at a new pin quietly changes nothing. If a rebuild produces no diff you expected,
  remove both cached clones and run it again.

## Process

- Before opening a phase PR, walk that phase's plan checklist item by item against the diff. MITA
  Phase 1 shipped without the `cms-sync.yml` change the plan listed, so upstream fixes sat unnoticed
  for a week with nothing flagging them.
- Switch the active `gh` account only when Jeff directs it, and only the switch he names. Approval to
  switch to `jeff-prov-adv` and push does not include switching back: no EXIT trap, no automatic
  restore. Leave the account where he put it, say which one is active, and wait for his direction.
