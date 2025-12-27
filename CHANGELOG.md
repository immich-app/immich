
# v2.5.0

# v2.4.0

## Highlights

Welcome to the release `v2.4.0` of Immich. This release focuses on bug fixes, QoL improvements, and polished UI components across mobile and the web. Let's dive right in.

* Show the owner's name in the shared album
* Command palette
* Change search type directly in the search bar
* Better action button placement in the mobile asset viewer
* Notable fix: fix an issue where metadata extraction could fail on high concurrency

### Show the owner's name in the shared album.

On the web, in shared albums, you can now toggle an option to display the asset's owner name at the bottom right corner of the thumbnail.

 ![](/api/attachments.redirect?id=3e4d661e-4015-4b04-b8f3-a055e9d4db01 " =1071x758")

### Command palette

The web app now has an integrated command palette, which can be opened  with `ctrl + k` on Windows/Linux or `cmd + k` on macOS. The first iteration of this lets you quickly navigate between administration pages by typing the name of the page you want to go to. It also already supports some common actions when on the respective admin pages, many of which also support shortcuts. Have a look around and check them out! 

 ![](/api/attachments.redirect?id=d6bc1387-f2cb-45c1-9287-4ee8176dfb41 " =748x652")

### Change search type directly in the search bar

You can now click on the pill from the search bar to select a different search type without opening the search filter panel.

 ![](/api/attachments.redirect?id=97a90b16-8b08-4292-bcb5-46aa75c01043 " =1033x199")


### Better placement of action buttons in the mobile asset viewer

Previously, to perform a specific action on the asset, you needed first to swipe up to open the detail panel, then swipe all the way to the right and tap the action. It limits the discoverability of some actions. To help resolve that issue, all the action buttons in the detail panel are now moved to the drop-down menu when tapping on the vertical dot icon (or kebab menu), along with some buttons that used to be on the top bar, clearing up space to display more useful information when viewing the asset.


 ![](/api/attachments.redirect?id=f68f8af5-2aaf-4625-821f-6c129da7fed3 " =342x741")

## What's Changed

### 🫥 Deprecated Changes

* feat: queues by @jrasm91 in <https://github.com/immich-app/immich/pull/24142>

### 🚀 Features

* feat: improve performance: don't sort timeline buckets from server by @midzelis in <https://github.com/immich-app/immich/pull/24032>
* feat: command palette by @danieldietzler in <https://github.com/immich-app/immich/pull/23693>
* feat(web): Shared album owner labels by @xCJPECKOVERx and @idubnori in <https://github.com/immich-app/immich/pull/21171>
* feat(mobile): persist album sorting & layout in settings by @YarosMallorca in <https://github.com/immich-app/immich/pull/22133>
* feat: queue detail page by @jrasm91 in <https://github.com/immich-app/immich/pull/24352>
* chore(mobile): add kebabu menu in asset viewer by @idubnori in <https://github.com/immich-app/immich/pull/24387>
* feat(mobile): create new album from add to modal by @YarosMallorca in <https://github.com/immich-app/immich/pull/24431>
* feat(mobile): move buttons in the bottom sheet to the kebabu menu by @idubnori in <https://github.com/immich-app/immich/pull/24175>

### 🌟 Enhancements

* feat(web): allow navigating the map with arrow keys by @lukashass in <https://github.com/immich-app/immich/pull/24080>
* feat: separate camera and lens info in detail panel by @fabianbees in <https://github.com/immich-app/immich/pull/23670>
* feat(web): shared link card tweaks by @jrasm91 in <https://github.com/immich-app/immich/pull/24192>
* feat(server): exclude syncthing folders from external libraries by @SaphuA in <https://github.com/immich-app/immich/pull/24240>
* feat(web): search type selection dropdown by @YarosMallorca in <https://github.com/immich-app/immich/pull/24091>
* feat: header context menu by @jrasm91 in <https://github.com/immich-app/immich/pull/24374>
* feat(mobile): move top bar buttons into kebabu menu in AssetViewer by @idubnori in <https://github.com/immich-app/immich/pull/24461>
* feat(web): asset selection bar in tags view by @YarosMallorca in <https://github.com/immich-app/immich/pull/24522>
* feat(web): slideshow feature on shared albums by @YarosMallorca in <https://github.com/immich-app/immich/pull/24598>
* feat: replace heart icons to thumbs-up across activity by @idubnori in <https://github.com/immich-app/immich/pull/24590>

### 🐛 Bug fixes

* fix: effect loop by @jrasm91 in <https://github.com/immich-app/immich/pull/24014>
* fix: do not clear hash on updated_at change by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/24039>
* fix: disable animation "add to" action menu by @bwees in <https://github.com/immich-app/immich/pull/24040>
* fix: Use correct app store link by @Mraedis in <https://github.com/immich-app/immich/pull/24062>
* fix: show archived assets in favorite page by @bwees in <https://github.com/immich-app/immich/pull/24052>
* fix(mobile): first video memory on page doesn't play by @YarosMallorca in <https://github.com/immich-app/immich/pull/23906>
* feat(web): show detected faces in spherical photos by @meesfrensel in <https://github.com/immich-app/immich/pull/23974>
* fix: add users to album by @danieldietzler in <https://github.com/immich-app/immich/pull/24133>
* fix(server): sanitize DB_URL for pg_dumpall to remove unknown query params by @lutostag in <https://github.com/immich-app/immich/pull/23333>
* fix: use proper updatedAt value in local assets by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/24137>
* fix: albums page reactivity loops by @danieldietzler in <https://github.com/immich-app/immich/pull/24046>
* fix: getAspectRatio fallback to db width and height by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/24131>
* fix(web): fix support & feedback modal wrapping by @Snowknight26 in <https://github.com/immich-app/immich/pull/24018>
* fix: don't get OCR data in shared link by @alextran1502 in <https://github.com/immich-app/immich/pull/24152>
* fix: duration extraction by @jrasm91 in <https://github.com/immich-app/immich/pull/24178>
* fix(ml): Upgrade ONNX Runtime to v1.22.1 to fix ROCm build failures by @LukaPrebil in <https://github.com/immich-app/immich/pull/24045>
* fix: update timeline-manager after archive actions by @midzelis in <https://github.com/immich-app/immich/pull/24010>
* fix: theme switcher by @jrasm91 in <https://github.com/immich-app/immich/pull/24209>
* fix: label 'for' attributes in user-api-key-grid by @kimsey0 in <https://github.com/immich-app/immich/pull/24232>
* fix(mobile): enable backup text overflows by @YarosMallorca in <https://github.com/immich-app/immich/pull/24227>
* fix(web): integrate zoom toggle button into panorama photo viewer by @meesfrensel in <https://github.com/immich-app/immich/pull/24189>
* fix(web): use full tag path when creating nested subtags by @NiklasvonM in <https://github.com/immich-app/immich/pull/24249>
* fix: only generate memory based on users assets by @alextran1502 in <https://github.com/immich-app/immich/pull/24151>
* fix(mobile): docs link by @mmomjian in <https://github.com/immich-app/immich/pull/24277>
* fix(server): use bigrams for cjk by @mertalev in <https://github.com/immich-app/immich/pull/24285>
* fix(ml): do not upscale preview by @mertalev in <https://github.com/immich-app/immich/pull/24322>
* fix(web): open onboarding documentation link in new tab by @carbonemys in <https://github.com/immich-app/immich/pull/24289>
* fix(mobile): use correct timezone displayed in the info sheet by @kao-byte in <https://github.com/immich-app/immich/pull/24310>
* fix(web): folder view sort oder by @etnoy in <https://github.com/immich-app/immich/pull/24337>
* fix(server): do not delete offline assets by @mertalev in <https://github.com/immich-app/immich/pull/24355>
* fix: exposure info and better readability by @alextran1502 in <https://github.com/immich-app/immich/pull/24344>
* fix: Adjust the zoom level by @jforseth210 in <https://github.com/immich-app/immich/pull/24353>
* fix: local full sync on Android on resume by @alextran1502 in <https://github.com/immich-app/immich/pull/24348>
* fix(web): Add minimum content size to logo for consistent visual on small screens by @kiloomar in <https://github.com/immich-app/immich/pull/24372>
* fix: use adjustment time in iOS for hash reset by @shenlong-tanwen in <https://github.com/immich-app/immich/pull/24047>
* fix(server): update exiftool-vendored to v34 for more robust metadata extraction by @skatsubo in <https://github.com/immich-app/immich/pull/24424>
* fix(mobile): cannot create album while name field is focused by @YarosMallorca in <https://github.com/immich-app/immich/pull/24449>
* fix(web): \[album table view\] long album title overflows table row by @simonkub in <https://github.com/immich-app/immich/pull/24450>
* fix(mobile): fix overflow text in backup card by @YarosMallorca in <https://github.com/immich-app/immich/pull/24448>
* fix(mobile): timeline bottom padding on selection by @YarosMallorca in <https://github.com/immich-app/immich/pull/24480>
* feat(mobile): Localized backup upload details page by @ArnyminerZ in <https://github.com/immich-app/immich/pull/21136>
* fix(mobile): iOS local permission dialog extra whitespace by @kurtmckee in <https://github.com/immich-app/immich/pull/24491>
* fix(mobile): versionStatus.message text overflow by @idubnori in <https://github.com/immich-app/immich/pull/24504>
* fix(server): prevent metadata extraction failures on large video files by @hubert-taieb in <https://github.com/immich-app/immich/pull/24094>
* fix(web): show inferred timezone in date editor by @skatsubo in <https://github.com/immich-app/immich/pull/24513>
* fix(mobile): local videos with '#' don't play on android by @YarosMallorca in <https://github.com/immich-app/immich/pull/24373>
* fix: refresh appear in list after asset is added to a current or new album by @alextran1502 in <https://github.com/immich-app/immich/pull/24523>
* fix(mobile): birthday off by one day on remote by @YarosMallorca in <https://github.com/immich-app/immich/pull/24527>
* fix(web): download panel being hidden by admin sidebar by @diogotcorreia in <https://github.com/immich-app/immich/pull/24583>
* fix(web): recent search doesn't use search type by @YarosMallorca in <https://github.com/immich-app/immich/pull/24578>
* fix(server): only extract image's duration if format supports animation by @meesfrensel in <https://github.com/immich-app/immich/pull/24587>
* fix(mobile): local delete missing from sheet on some routes  by @YarosMallorca in <https://github.com/immich-app/immich/pull/24505>
* fix(mobile): better UI for metadata panel by @kao-byte in <https://github.com/immich-app/immich/pull/24428>
* fix: shared link expiration and small styling by @alextran1502 in <https://github.com/immich-app/immich/pull/24566>

### 📚 Documentation

* docs: DB_STORAGE_TYPE is only used by the database container by @dionysius in <https://github.com/immich-app/immich/pull/24215>
* fix(docs): build `cli` for e2e tests by @roschaefer in <https://github.com/immich-app/immich/pull/24184>
* docs(faq): add more info on archiving by @etnoy in <https://github.com/immich-app/immich/pull/24326>
* fix(docs): server and machine-learning use IMMICH_HOST and IMMICH_PORT by @dionysius in <https://github.com/immich-app/immich/pull/24335>
* fix: prevent OOM on nginx reverse proxy servers by @NicholasFlamy in <https://github.com/immich-app/immich/pull/24351>
* fix(docs): obsolete docs about rootless docker by @roschaefer in <https://github.com/immich-app/immich/pull/24376>
* fix(docs): websockets in nginx example by @fourthwall in <https://github.com/immich-app/immich/pull/24411>
* fix(docs): slow upload speed with example nginx reverse proxy config by @goalie2002 in <https://github.com/immich-app/immich/pull/24490>
* fix(docs): typo in maintenance mode command by @bartvanvelden in <https://github.com/immich-app/immich/pull/24518>

### 🌐 Translations

* chore: add new language requests by @danieldietzler in <https://github.com/immich-app/immich/pull/23991>

## New Contributors

* @ujjwal123123 made their first contribution in <https://github.com/immich-app/immich/pull/24101>
* @lutostag made their first contribution in <https://github.com/immich-app/immich/pull/23333>
* @LukaPrebil made their first contribution in <https://github.com/immich-app/immich/pull/24045>
* @kimsey0 made their first contribution in <https://github.com/immich-app/immich/pull/24232>
* @SaphuA made their first contribution in <https://github.com/immich-app/immich/pull/24240>
* @dionysius made their first contribution in <https://github.com/immich-app/immich/pull/24215>
* @NiklasvonM made their first contribution in <https://github.com/immich-app/immich/pull/24249>
* @kao-byte made their first contribution in <https://github.com/immich-app/immich/pull/24098>
* @carbonemys made their first contribution in <https://github.com/immich-app/immich/pull/24289>
* @kiloomar made their first contribution in <https://github.com/immich-app/immich/pull/24372>
* @fourthwall made their first contribution in <https://github.com/immich-app/immich/pull/24411>
* @simonkub made their first contribution in <https://github.com/immich-app/immich/pull/24450>
* @ArnyminerZ made their first contribution in <https://github.com/immich-app/immich/pull/21136>
* @kurtmckee made their first contribution in <https://github.com/immich-app/immich/pull/24491>
* @hubert-taieb made their first contribution in <https://github.com/immich-app/immich/pull/24094>
* @bartvanvelden made their first contribution in <https://github.com/immich-app/immich/pull/24518>

**Full Changelog**: <https://github.com/immich-app/immich/compare/v2.3.1...v2.4.0>

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### 🚀 Features
* feat: workflow ui by @alextran1502 in https://github.com/immich-app/immich/pull/24190
* feat: disable admin setup by @jrasm91 in https://github.com/immich-app/immich/pull/24628
### 🌟 Enhancements
* feat: focus jumped-to item in timeline by @bo0tzz in https://github.com/immich-app/immich/pull/24738
* feat: modal routes by @jrasm91 in https://github.com/immich-app/immich/pull/24726
* feat: prefer admin settings page over users page by @jrasm91 in https://github.com/immich-app/immich/pull/24780
* feat: shared link edit by @jrasm91 in https://github.com/immich-app/immich/pull/24783
* feat(mobile): use tabular figures in backup info card by @wrbl606 in https://github.com/immich-app/immich/pull/24820
* feat(mobile): album options to kebab menu by @idubnori in https://github.com/immich-app/immich/pull/24204
* feat: Hide/show controls when zoom state changes by @Lauritz-Tieste in https://github.com/immich-app/immich/pull/24784
### 🐛 Bug fixes
* fix(maintenance): prevent enable/disable maintenance CLI hanging on occasion by @insertish in https://github.com/immich-app/immich/pull/24713
* fix(web): display jxl original by @mertalev in https://github.com/immich-app/immich/pull/24766
* fix(web): stale album info by @jrasm91 in https://github.com/immich-app/immich/pull/24787
* fix: album card timezone by @danieldietzler in https://github.com/immich-app/immich/pull/24855
### 📚 Documentation
* fix: product keys wording in commercial guidelines faq by @bo0tzz in https://github.com/immich-app/immich/pull/24765

## New Contributors
* @wrbl606 made their first contribution in https://github.com/immich-app/immich/pull/24820

**Full Changelog**: https://github.com/immich-app/immich/compare/v2.4.1...v2.5.0

---

