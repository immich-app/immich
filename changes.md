# Changes Log

At PixelUnion, we value openness and open source. This document serves as a record of the changes we have made to the Immich codebase and the features we have contributed back to the community, or are planning to contribute back.

## Changes Made

- [X] Replaced Immich trademark logos
- [X] Added billing link to user drop down menu
- [X] Added simple password reset page that uses PixelUnion api

# Updating fork

1. Add Immich main repo as upstream
```git remote add upstream git@github.com:immich-app/immich.git```
2. Fetch upstream
```git getch upstream```
3. Merge new version
```git merge upstream/v1.134.0```
4. Fix potential conflicts
5. Test changes above for correct functioning.
6. Tag commit with immich version and PixelUnion version like:
```v1.133.5-pu1``` later version should increment the pu tag
7. Push the tag
