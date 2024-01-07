---
sidebar_position: 5
---

# External Library

### Can I add an external library while keeping the existing albums structure?

We haven't put in an official mechanism to create albums from external libraries at the moment., but there are some [workarounds from the community](https://github.com/immich-app/immich/discussions/4279) which you can find here to help you achieve that.

### I got duplicate files in the upload library and the external library

It is important to remember that Immich does not filter duplicate files from [external Library](/docs/features/libraries) at the moment.

Upload library and external library use different mechanisms to detect duplicates:

- Upload library: hashes the file
- External library: uses the file path

Therefore, a situation where the same file appears twice in the timeline is possible.
