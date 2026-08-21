# Contributing

Thanks for the interest. This is a small project maintained by one person, so a
little scope-setting up front saves everyone the awkward part later.

## What this tool is

A navigator over the [CMS MES Certification Repository](https://github.com/CMSgov/CMCS-DSG-DSS-Certification):
it makes the outcomes, metrics, Conditions for Enhanced Funding, and CFR citations CMS publishes
searchable, crosswalked, and traceable. Everything it displays is derived from that repository by
the build. That constraint is the product. A state or a CMS reviewer has to be able to trust that
what they read here is what CMS published — nothing added, nothing editorialized.

## What belongs here

- Bug fixes — routing, search, rendering, accessibility, broken links.
- ETL and parsing corrections, where the tool shows something differently from what CMS published.
- Improvements to existing surfaces: navigation, filtering, crosswalks, performance.
- Documentation, CI, and build reliability.

## What doesn't

- **Content CMS doesn't publish.** Strategy pages, RFI or procurement responses, vendor or
  consultant positioning, opinion and advocacy pieces, marketing. This isn't a judgment on the
  material — it's that a navigator with editorial content in it stops being a navigator, and the
  audience that needs this tool is exactly the audience that would notice.
- **Hand edits to generated content.** `src/data/`, `data-snapshot/`, and `public/SMC Process/` are
  written by the build and will be overwritten. Fix the ETL instead.
- **Corrections to CMS's own content.** Wrong outcome text, a bad metric, a missing CEF — those
  belong [with CMS](https://github.com/CMSgov/CMCS-DSG-DSS-Certification/issues). If this tool
  renders something differently from CMS's repository, that *is* a bug here; file it.
- **A default model id or provider-specific wiring** in the drafting route. Operators supply their
  own endpoint, credential, and model, deliberately.

## Before you open a PR

For anything beyond a fix — a new page, section, dataset, or dependency — **open an issue first**.
A scope conversation costs a few minutes before the work and a declined PR after it. I would much
rather say "yes, and here's where it goes" than "no, sorry."

## Running the checks

CI runs lint, typecheck, build, data invariants, and a full internal link crawl on every pull
request. Same checks locally:

```bash
npm install
npm run build        # required first — generates src/data/ that the app imports
npx eslint
npx tsc --noEmit
npm run check:data
npm start & BASE_URL=http://localhost:3000 npm run check:links
```

## Automated PRs

Pull requests titled `CMS content sync: <sha> → <sha>` are opened by
[`.github/workflows/cms-sync.yml`](.github/workflows/cms-sync.yml) when CMS updates its repository.
They carry regenerated data and a summary of what changed in the content. They aren't a template
for hand-written PRs, and they shouldn't be edited — a rebuild would overwrite the change.

## Licensing

The MIT license covers application code. Content derived from the CMS repository is attributed, not
relicensed — see the note in [README.md](README.md#licensing). By contributing, you agree your
contribution is offered under the MIT license.
