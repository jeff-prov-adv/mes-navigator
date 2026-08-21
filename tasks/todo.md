# Weekly CMS content sync — unpin from the fixed point

Plan: `~/.claude/plans/humble-gliding-hopper.md`

## Tasks

- [x] `scripts/prepare-data.mjs` — pin read from `data-snapshot/meta.json` (`sourceCommit`), `PINNED_REF` removed, hard fail when no pin and no `CERT_REPO_REF`
- [x] `scripts/summarize-sync.mjs` — new; markdown content diff (committed snapshot vs freshly built `src/data/`) for the PR body
- [x] `.github/workflows/cms-sync.yml` — new; Monday cron + `workflow_dispatch(ref)`, no-op early exit, full inline verify, `gh pr create`
- [x] `.github/workflows/ci.yml` — comment: pin now lives in `meta.json`, advanced by `cms-sync.yml`
- [x] `README.md` — Data pipeline section + `CERT_REPO_REF` env row
- [x] Verify locally (build at pin, build at HEAD, missing-pin failure, summarizer both paths, check:data / check:links / eslint / tsc)

## Review

**What changed.** The pin stopped being a constant and became data: `sourceCommit` in
`data-snapshot/meta.json` is now what the build clones to. Since every build rewrites that file with
the commit it used, building against a newer CMS commit advances the pin and regenerates the data in
one commit — the weekly job needs no code rewriting, and the pin can never disagree with the data it
produced. `cms-sync.yml` runs Mondays: one `ls-remote` when nothing moved, and a full
lint/typecheck/build/check:data/check:links pass plus a content-diff PR when it did.

**Verified.**

- Build at the pin logs `c9db9cd… (pinned: c9db9cd… from data-snapshot/meta.json)`; tree diff is
  `syncedAt` churn only.
- Missing `meta.json` and `sourceCommit: "unknown"` both hard-fail with messages naming the fix.
- Change path exercised for real against CMS `f3966cd` (2025-10-24): summary reported exactly the 6
  guidance pages that differ, cross-checked against `git diff` on the raw JSON — no false positives,
  nothing missed.
- Summarizer mutation tests: reword → changed, delete → ⚠ removed, add → added, reorder → silent.
- `resolve` step dry-run locally for `HEAD`, a raw sha, and `refs/heads/main`, plus the duplicate-PR
  guard; every workflow `run:` block passes `bash -n`.
- Full suite green: `npm run build`, `npx eslint`, `npx tsc --noEmit`, `npm run check:data`,
  `npm run check:links` (162 pages, 185 URLs, all 200).

**Two facts worth carrying forward.**

1. CMS HEAD is still `c9db9cd` — the pin never went stale. CMS last pushed 2026-05-27 and moves in
   bursts, so the first scheduled run will be a no-op and weekly is comfortably inside their cadence.
2. State examples carry no stable identifier (58 rows, 33 distinct state+module+goal keys), so the
   summarizer matches them by group after pairing off identical rows. Keyed datasets — outcomes,
   CEFs, citations, guidance, modules — match on their own IDs.

**Needs the repo owner, once.** `cms-sync.yml` opens PRs with `GITHUB_TOKEN`, which requires
*Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*. Those PRs
also do not trigger `ci.yml`, which is why the sync job runs CI's checks itself before opening one.

## Follow-on: repo governance (2026-08-21)

- [x] `can_approve_pull_request_reviews` enabled; `default_workflow_permissions` deliberately left
      at `read` — both workflows declare their own job-level scopes, so the default never needs to
      grant write.
- [x] Branch protection on `main`: PR required (0 approvals — solo maintainer can't approve their
      own), force pushes and deletions blocked, conversation resolution required,
      `enforce_admins: false` so the owner keeps an escape hatch.
- [x] `CONTRIBUTING.md` — states what the tool is and what content does not belong in it, and asks
      for an issue before any PR beyond a fix. Written after PR #1 was declined as out of scope.

**Deliberately not set: required status checks.** PRs opened with `GITHUB_TOKEN` don't trigger
`ci.yml`, so requiring the `verify` check would permanently block every sync PR and force an admin
override each time. The sync job already runs the same suite inline. If a hard gate is wanted later,
`cms-sync.yml` can POST a commit status to the PR head after its checks pass, and `verify` can then
be required.
