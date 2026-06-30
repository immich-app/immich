# Mobile — Domain Glossary

A glossary of the ubiquitous language used in the Immich mobile app. Definitions
only — no implementation details.

## What's New

The user-facing feature that tells a user what changed in a release. It has a
single body of content (a set of [Feature Highlights](#feature-highlight))
presented through two distinct **surfaces**:

- The **What's New dialog** — an interruptive, dismissible carousel shown
  automatically once per release after the user updates. Has a "Skip" affordance
  so the user can leave without paging through every highlight.
- The **What's New settings entry** — a calm, always-available presentation of
  the same highlights, reached on demand from Settings. Never gated, never marks
  the release as seen (the user reaching it has, by definition, already had the
  chance to see the dialog).

"What's New" is the user-facing name. The code currently also calls this
"feature message"; these refer to the same thing.

## Feature Highlight

One item of [What's New](#whats-new) content: a single new capability described
by a title, a body, an optional screenshot, and the platform(s) it applies to. A
highlight with no screenshot shows a placeholder instead.

The ordered set of highlights is **the current batch** — it always represents
the one [release](#release) being announced. Publishing a new batch **replaces**
the set wholesale; highlights do not accumulate across releases, so there is no
pruning. A user who opens the app catches each batch exactly once, so showing
only the newest batch loses nothing.

## Release

The version a [batch](#feature-highlight) of highlights was authored for,
expressed as a SemVer. It is **content-defined**: it advances only when a new
batch is published, never automatically from the running app version. A release
with nothing noteworthy to announce leaves the marker untouched, so its dialog
never fires.

## Seen (a release)

A release is **seen** once the user has been given the chance to view its
[What's New dialog](#whats-new) — recorded so the dialog auto-shows at most once
per release. Opening the settings entry does **not** mark a release seen.
