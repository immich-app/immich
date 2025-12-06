
# v2.4.0

## Highlights

{{RELEASE HIGHLIGHTS}}

As always, please consider supporting the project.

🎉 Cheers! 🎉


----

And as always, bugs are fixed, and many other improvements also come with this release.

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### 🫥 Deprecated Changes
* feat: queues by @jrasm91 in https://github.com/immich-app/immich/pull/24142
### 🚀 Features
* feat: improve performance: don't sort timeline buckets from server by @midzelis in https://github.com/immich-app/immich/pull/24032
* feat: command palette by @danieldietzler in https://github.com/immich-app/immich/pull/23693
* feat(web): Shared album owner labels by @xCJPECKOVERx in https://github.com/immich-app/immich/pull/21171
* feat(mobile): persist album sorting & layout in settings by @YarosMallorca in https://github.com/immich-app/immich/pull/22133
* feat: queue detail page by @jrasm91 in https://github.com/immich-app/immich/pull/24352
* chore(mobile): add kebabu menu in asset viewer by @idubnori in https://github.com/immich-app/immich/pull/24387
### 🌟 Enhancements
* feat(web): allow navigating the map with arrow keys by @lukashass in https://github.com/immich-app/immich/pull/24080
* feat: separate camera and lens info in detail panel by @fabianbees in https://github.com/immich-app/immich/pull/23670
* feat(web): shared link card tweaks by @jrasm91 in https://github.com/immich-app/immich/pull/24192
* feat(server): exclude syncthing folders from external libraries by @SaphuA in https://github.com/immich-app/immich/pull/24240
* feat(web): search type selection dropdown by @YarosMallorca in https://github.com/immich-app/immich/pull/24091
* feat: header context menu by @jrasm91 in https://github.com/immich-app/immich/pull/24374
### 🐛 Bug fixes
* fix: effect loop by @jrasm91 in https://github.com/immich-app/immich/pull/24014
* fix: do not clear hash on updated_at change by @shenlong-tanwen in https://github.com/immich-app/immich/pull/24039
* fix: disable animation "add to" action menu by @bwees in https://github.com/immich-app/immich/pull/24040
* fix: Use correct app store link by @Mraedis in https://github.com/immich-app/immich/pull/24062
* fix: show archived assets in favorite page by @bwees in https://github.com/immich-app/immich/pull/24052
* fix(mobile): first video memory on page doesn't play by @YarosMallorca in https://github.com/immich-app/immich/pull/23906
* feat(web): show detected faces in spherical photos by @meesfrensel in https://github.com/immich-app/immich/pull/23974
* fix: add users to album by @danieldietzler in https://github.com/immich-app/immich/pull/24133
* fix(server): sanitize DB_URL for pg_dumpall to remove unknown query params by @lutostag in https://github.com/immich-app/immich/pull/23333
* fix: use proper updatedAt value in local assets by @shenlong-tanwen in https://github.com/immich-app/immich/pull/24137
* fix: albums page reactivity loops by @danieldietzler in https://github.com/immich-app/immich/pull/24046
* fix: getAspectRatio fallback to db width and height by @shenlong-tanwen in https://github.com/immich-app/immich/pull/24131
* fix(web): fix support & feedback modal wrapping by @Snowknight26 in https://github.com/immich-app/immich/pull/24018
* fix: don't get OCR data in shared link by @alextran1502 in https://github.com/immich-app/immich/pull/24152
* fix: duration extraction by @jrasm91 in https://github.com/immich-app/immich/pull/24178
* fix(ml): Upgrade ONNX Runtime to v1.22.1 to fix ROCm build failures by @LukaPrebil in https://github.com/immich-app/immich/pull/24045
* fix: update timeline-manager after archive actions by @midzelis in https://github.com/immich-app/immich/pull/24010
* fix: theme switcher by @jrasm91 in https://github.com/immich-app/immich/pull/24209
* fix: label 'for' attributes in user-api-key-grid by @kimsey0 in https://github.com/immich-app/immich/pull/24232
* fix(mobile): enable backup text overflows by @YarosMallorca in https://github.com/immich-app/immich/pull/24227
* fix(web): integrate zoom toggle button into panorama photo viewer by @meesfrensel in https://github.com/immich-app/immich/pull/24189
* fix(web): use full tag path when creating nested subtags by @NiklasvonM in https://github.com/immich-app/immich/pull/24249
* fix: only generate memory based on users assets by @alextran1502 in https://github.com/immich-app/immich/pull/24151
* fix(mobile): docs link by @mmomjian in https://github.com/immich-app/immich/pull/24277
* fix(server): use bigrams for cjk by @mertalev in https://github.com/immich-app/immich/pull/24285
* fix(ml): do not upscale preview by @mertalev in https://github.com/immich-app/immich/pull/24322
* fix(web): open onboarding documentation link in new tab by @carbonemys in https://github.com/immich-app/immich/pull/24289
* fix(mobile): use correct timezone displayed in the info sheet by @kao-byte in https://github.com/immich-app/immich/pull/24310
* fix(web): folder view sort oder by @etnoy in https://github.com/immich-app/immich/pull/24337
* fix(server): do not delete offline assets by @mertalev in https://github.com/immich-app/immich/pull/24355
* fix: exposure info and better readability by @alextran1502 in https://github.com/immich-app/immich/pull/24344
* fix: Adjust the zoom level by @jforseth210 in https://github.com/immich-app/immich/pull/24353
* fix: local full sync on Android on resume by @alextran1502 in https://github.com/immich-app/immich/pull/24348
* fix(web): Add minimum content size to logo for consistent visual on small screens by @kiloomar in https://github.com/immich-app/immich/pull/24372
* fix: use adjustment time in iOS for hash reset by @shenlong-tanwen in https://github.com/immich-app/immich/pull/24047
* fix(server): update exiftool-vendored to v34 for more robust metadata extraction by @skatsubo in https://github.com/immich-app/immich/pull/24424
### 📚 Documentation
* docs: DB_STORAGE_TYPE is only used by the database container by @dionysius in https://github.com/immich-app/immich/pull/24215
* fix(docs): build `cli` for e2e tests by @roschaefer in https://github.com/immich-app/immich/pull/24184
* docs(faq): add more info on archiving by @etnoy in https://github.com/immich-app/immich/pull/24326
* fix(docs): server and machine-learning use IMMICH_HOST and IMMICH_PORT by @dionysius in https://github.com/immich-app/immich/pull/24335
* fix: prevent OOM on nginx reverse proxy servers by @NicholasFlamy in https://github.com/immich-app/immich/pull/24351
* fix(docs): obsolete docs about rootless docker by @roschaefer in https://github.com/immich-app/immich/pull/24376
* fix(docs): websockets in nginx example by @fourthwall in https://github.com/immich-app/immich/pull/24411
### 🌐 Translations
* chore: add new language requests by @danieldietzler in https://github.com/immich-app/immich/pull/23991

## New Contributors
* @ujjwal123123 made their first contribution in https://github.com/immich-app/immich/pull/24101
* @lutostag made their first contribution in https://github.com/immich-app/immich/pull/23333
* @LukaPrebil made their first contribution in https://github.com/immich-app/immich/pull/24045
* @kimsey0 made their first contribution in https://github.com/immich-app/immich/pull/24232
* @SaphuA made their first contribution in https://github.com/immich-app/immich/pull/24240
* @dionysius made their first contribution in https://github.com/immich-app/immich/pull/24215
* @NiklasvonM made their first contribution in https://github.com/immich-app/immich/pull/24249
* @kao-byte made their first contribution in https://github.com/immich-app/immich/pull/24098
* @carbonemys made their first contribution in https://github.com/immich-app/immich/pull/24289
* @kiloomar made their first contribution in https://github.com/immich-app/immich/pull/24372
* @fourthwall made their first contribution in https://github.com/immich-app/immich/pull/24411

**Full Changelog**: https://github.com/immich-app/immich/compare/v2.3.1...v2.4.0

---

