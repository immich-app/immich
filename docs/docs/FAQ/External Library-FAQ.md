---
sidebar_position: 5
---

# External Library

### Can I add external library with existing structure albume?

We haven't put in an official mechanism to create album from your external library yet, but there are some [workarounds from the community](https://github.com/immich-app/immich/discussions/4279) which you can find here to help you achieve that.

### I got Duplicate files on Uploaded and External Library
It is important to remember that Immich does not filter duplicate files from [external Library](/docs/features/libraries),
Uploaded and External library use different dedup mechanism, upload library use file hash/checksum while external library use [file path](http://localhost:3005/docs/features/libraries#:~:text=In%20external%20libraries%2C%20the%20file%20path%20is%20used%20for%20duplicate%20detection.)
Therefore, a situation where the same file appears twice in the timeline is possible.