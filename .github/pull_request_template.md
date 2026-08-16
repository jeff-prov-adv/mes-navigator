<!--
Thanks for contributing.

CI runs lint, typecheck, build, data invariants, and a full internal link crawl
on every pull request. You can run the same checks locally:

    npm install
    npm run build        # required first — generates src/data/ that the app imports
    npm run check:data
    npm start & npm run check:links
-->

## What this changes

<!-- One or two sentences. -->

## Why

<!-- What problem it solves. If it fixes an issue, link it. -->

## Notes for review

<!--
Anything worth flagging: a tradeoff you made, something you were unsure about,
or an area you'd like a second opinion on. Delete if there's nothing.

Two things that are deliberate rather than oversights, so you don't need to
"fix" them:

- Certification content under src/data/ and data-snapshot/ is generated from
  CMS's repository by the build. Don't edit it by hand — it will be overwritten.
- The drafting route speaks the Messages API shape with an operator-supplied
  endpoint, credential, and model. There is intentionally no default model id.
-->
