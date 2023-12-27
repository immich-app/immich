---
sidebar_position: 5
---

# External Library

### Can I add an external library while keeping the existing album structure?

We haven't put in an official mechanism to create album from your external library yet, but there are some [workarounds from the community](https://github.com/immich-app/immich/discussions/4279) which you can find here to help you achieve that.

### I got duplicate files in the upload library and the external library

It is important to remember that Immich does not filter duplicate files from [external Library](/docs/features/libraries) at the moment.

Upload library and external library different mechanism to detect duplicates:

- Upload library: hashes the file
- External library: uses the file path

Therefore, a situation where the same file appears twice in the timeline is possible.