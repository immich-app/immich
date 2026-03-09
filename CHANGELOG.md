
# v2.6.0

## Highlights

{{RELEASE HIGHLIGHTS}}

As always, please consider supporting the project.

🎉 Cheers! 🎉


----

And as always, bugs are fixed, and many other improvements also come with this release.

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### 🚀 Features
* feat: shared link login by @jrasm91 in https://github.com/immich-app/immich/pull/25678
* feat: schema-check by @jrasm91 in https://github.com/immich-app/immich/pull/25904
* feat: add people deeplink by @arne182 in https://github.com/immich-app/immich/pull/25686
* feat(mobile): inline asset details by @uhthomas in https://github.com/immich-app/immich/pull/25952
* feat(mobile): filter by tags by @benjamonnguyen in https://github.com/immich-app/immich/pull/26196
* feat: add .mxf file support by @timonrieger in https://github.com/immich-app/immich/pull/24644
* feat: tap to see next/previous image by @thezeroalpha in https://github.com/immich-app/immich/pull/20286
* feat(mobile): Allow users to set album cover from mobile app by @timonrieger in https://github.com/immich-app/immich/pull/25515
* feat(mobile): Allow users to set profile picture from asset viewer by @timonrieger in https://github.com/immich-app/immich/pull/25517
* feat: ROCm 7.2 and MIGraphX support  by @kprinssu in https://github.com/immich-app/immich/pull/26178
* feat(web): map timeline sidepanel by @michelheusschen in https://github.com/immich-app/immich/pull/26532
* feat: add responsive layout to broken asset by @midzelis in https://github.com/immich-app/immich/pull/26384
* feat(web): toggle zoom on double-click in photo viewer by @midzelis in https://github.com/immich-app/immich/pull/26732
### 🌟 Enhancements
* feat: verify permissions by @jrasm91 in https://github.com/immich-app/immich/pull/25647
* feat(web): change link expiration logic & presets  by @YarosMallorca in https://github.com/immich-app/immich/pull/26064
* feat(mobile): dynamic layout in new timeline by @shenlong-tanwen in https://github.com/immich-app/immich/pull/23837
* feat(cli): change progress bar to display file size by @Nykri in https://github.com/immich-app/immich/pull/23328
* feat(mobile): dynamic multi-line album name by @uhthomas in https://github.com/immich-app/immich/pull/26040
* feat(mobile): hide search by context/OCR if disabled on server (#25472) by @Nacolis in https://github.com/immich-app/immich/pull/26063
* fix(release): add docker-compose.rootless.yml to released assets by @dnozay in https://github.com/immich-app/immich/pull/26261
* feat(web): show ocr text boxes in panoramas by @meesfrensel in https://github.com/immich-app/immich/pull/25727
* feat(web): loop chromecast video by @etnoy in https://github.com/immich-app/immich/pull/24410
* chore(web): merge "Add to album" and "Add to shared album" actions into a single action by @timonrieger in https://github.com/immich-app/immich/pull/24669
* feat(mobile): timeline - add bottomWidgetBuilder  by @PeterOmbodi in https://github.com/immich-app/immich/pull/25634
* feat(mobile): video zooming in asset viewer by @goalie2002 in https://github.com/immich-app/immich/pull/22036
* feat(mobile): Add slug support for shared links by @Lauritz-Tieste in https://github.com/immich-app/immich/pull/26441
* feat: warn when losing transparency during thumbnail generation by @midzelis in https://github.com/immich-app/immich/pull/26243
* perf(mobile): optimized album sorting by @YarosMallorca in https://github.com/immich-app/immich/pull/25179
* feat(mobile): prompt when deleting from trash by @YarosMallorca in https://github.com/immich-app/immich/pull/26392
* feat: getAssetEdits respond with edit IDs by @bwees in https://github.com/immich-app/immich/pull/26445
* fix(server): accept showAt and hideAt for creating memories by @meesfrensel in https://github.com/immich-app/immich/pull/26429
* feat(server): SyncAssetEditV1 by @bwees in https://github.com/immich-app/immich/pull/26446
* feat: splash screen error page by @shenlong-tanwen in https://github.com/immich-app/immich/pull/26460
* feat(mobile): add confirmation dialog to permanent delete action by @ByteSizedMarius in https://github.com/immich-app/immich/pull/26442
* feat: enhance face-editor positioning by @midzelis in https://github.com/immich-app/immich/pull/26303
* feat: improve HEIC, HEIF and JPEG XL browser support detection by @nicosemp in https://github.com/immich-app/immich/pull/26122
* refactor(web): remove replaceAsset action by @timonrieger in https://github.com/immich-app/immich/pull/26444
* feat(web): bounding box for faces when hovering over the face in photo view by @cratoo in https://github.com/immich-app/immich/pull/26667
* feat(mobile): keep search results visible by @uhthomas in https://github.com/immich-app/immich/pull/26498
* feat(mobile): use shared native client by @mertalev in https://github.com/immich-app/immich/pull/25942
* feat(mobile): SyncAssetEditV1 by @bwees in https://github.com/immich-app/immich/pull/26518
* feat(ml): enable openvino for cpu by @apejcic in https://github.com/immich-app/immich/pull/22948
* feat: responsive video duration in thumbnail by @midzelis in https://github.com/immich-app/immich/pull/26770
### 🐛 Bug fixes
* fix: ignore checksum constraint error when logging by @jrasm91 in https://github.com/immich-app/immich/pull/26113
* fix(web): use locale for date picker by @michelheusschen in https://github.com/immich-app/immich/pull/26125
* fix(web): escape shortcut handling by @michelheusschen in https://github.com/immich-app/immich/pull/26096
* fix(mobile): Login routing on Splash screen by @PeterOmbodi in https://github.com/immich-app/immich/pull/26128
* fix: null local date time in timeline queries by @shenlong-tanwen in https://github.com/immich-app/immich/pull/26133
* fix(web): prevent event manager from throwing error by @michelheusschen in https://github.com/immich-app/immich/pull/26156
* fix(web): improve api key modal responsiveness by @klenner1 in https://github.com/immich-app/immich/pull/26151
* fix(web): show correct assets in memory gallery by @michelheusschen in https://github.com/immich-app/immich/pull/26157
* fix(web): add missing @immich/ui translations by @michelheusschen in https://github.com/immich-app/immich/pull/26143
* fix(mobile): timeline handling on foldable phones + ensuring that images are not cut off by @bkchr in https://github.com/immich-app/immich/pull/25088
* fix(mobile): prevent nav bar label text wrapping by @chrislongros in https://github.com/immich-app/immich/pull/26011
* fix(mobile): hide latest version warnings by @uhthomas in https://github.com/immich-app/immich/pull/26036
* fix(mobile): inconsistent query for people by @YarosMallorca in https://github.com/immich-app/immich/pull/24437
* fix(web): timeline multi select group state by @michelheusschen in https://github.com/immich-app/immich/pull/26180
* fix(web): add checkerboard background for transparent images by @agent-steven in https://github.com/immich-app/immich/pull/26091
* fix(mobile): inherit toolbar opacity by @uhthomas in https://github.com/immich-app/immich/pull/25694
* fix(web): focus tag input when modal opens by @michelheusschen in https://github.com/immich-app/immich/pull/26256
* fix(web): clear face boxes when switching assets by @michelheusschen in https://github.com/immich-app/immich/pull/26249
* fix(web): clear unsaved asset description when changing asset by @michelheusschen in https://github.com/immich-app/immich/pull/26255
* fix(web): clear cache when asset changes by @michelheusschen in https://github.com/immich-app/immich/pull/26257
* fix: utc time zone upserts by @danieldietzler in https://github.com/immich-app/immich/pull/26258
* fix: metadata crash by @jrasm91 in https://github.com/immich-app/immich/pull/26327
* fix: prevent server crash when extraction of metadata fails if the assets are corrupted by @Devansh-Jani in https://github.com/immich-app/immich/pull/26042
* fix(server): db restore failure when `DB_URL` is set to unix-domain socket connection by @fabio-garavini in https://github.com/immich-app/immich/pull/26252
* fix: Download the edited version when downloading multiple photos by @MontejoJorge in https://github.com/immich-app/immich/pull/26259
* fix: include `DROP INDEX` in transaction to prevent missing index on rollback by @haoxi911 in https://github.com/immich-app/immich/pull/25399
* fix: safari address bar color by @jrasm91 in https://github.com/immich-app/immich/pull/26346
* fix(web): prevent panorama image reload during asset updates by @michelheusschen in https://github.com/immich-app/immich/pull/26349
* fix(web): favoriting assets opened via GalleryViewer by @michelheusschen in https://github.com/immich-app/immich/pull/26350
* fix(i18n): add translation key for partner's photos by @timonrieger in https://github.com/immich-app/immich/pull/26348
* fix(web): single select scroll behavior by @timonrieger in https://github.com/immich-app/immich/pull/26358
* perf: add indexes to improve People API response times by @bxtdvd in https://github.com/immich-app/immich/pull/26337
* fix: pin code reset modal by @jrasm91 in https://github.com/immich-app/immich/pull/26370
* fix(mobile): Reset "People" search filter chip if no selections are made by @benjamonnguyen in https://github.com/immich-app/immich/pull/26267
* fix(cli): delete sidecar files after upload if requested by @timonrieger in https://github.com/immich-app/immich/pull/26353
* fix(web): album description auto height by @michelheusschen in https://github.com/immich-app/immich/pull/26420
* fix(web): prevent side panel overlap during transition by @michelheusschen in https://github.com/immich-app/immich/pull/26398
* fix(web): storage template example by @mmomjian in https://github.com/immich-app/immich/pull/26424
* fix(web): prevent `state_unsafe_mutation` error on people page by @michelheusschen in https://github.com/immich-app/immich/pull/26438
* fix: missing deletedAt and isVisible columns on mobile by @bwees in https://github.com/immich-app/immich/pull/26414
* fix(mobile): joinLocal on archived timeline by @YarosMallorca in https://github.com/immich-app/immich/pull/26387
* fix: always show library scan button by @etnoy in https://github.com/immich-app/immich/pull/26428
* fix: retain asset when either asset is a favorite by @shenlong-tanwen in https://github.com/immich-app/immich/pull/26473
* fix(web): prevent null folder tree on concurrent load by @michelheusschen in https://github.com/immich-app/immich/pull/26489
* fix(web): toast warning when trying to upload unsupported file type by @meesfrensel in https://github.com/immich-app/immich/pull/26492
* fix(mobile): birthday picker shows limited months when no date exists by @socksprox in https://github.com/immich-app/immich/pull/26407
* fix: consider DAR when extracting video dimension by @alextran1502 in https://github.com/immich-app/immich/pull/25293
* feat(mobile): Prevent premature image cache eviction when higher image loading is enabled by @LeLunZ in https://github.com/immich-app/immich/pull/26208
* refactor: star rating by @meesfrensel in https://github.com/immich-app/immich/pull/26357
* fix(mobile): set correct initial system-ui mode in asset viewer by @goalie2002 in https://github.com/immich-app/immich/pull/26500
* fix(server): Live Photo migration bug when album is in template by @NikhilAlapati in https://github.com/immich-app/immich/pull/25329
* fix(web): handle delete shortcut on shared link page as remove by @meesfrensel in https://github.com/immich-app/immich/pull/26552
* fix(mobile): prevent video player from being recreated unnecessarily by @uhthomas in https://github.com/immich-app/immich/pull/26553
* fix(mobile): don't cut off top corners of app bar by @uhthomas in https://github.com/immich-app/immich/pull/26550
* feat: update onnxruntime-openvino to 1.24.1 and intel drivers by @savely-krasovsky in https://github.com/immich-app/immich/pull/26565
* fix: hide download action for local/merged assets by @YarosMallorca in https://github.com/immich-app/immich/pull/26461
* fix(web): top bar z index on search page by @YarosMallorca in https://github.com/immich-app/immich/pull/26582
* fix(web): show shared link download button when logged in by @Snowknight26 in https://github.com/immich-app/immich/pull/26629
* fix(mobile): asset viewer hero animation by @uhthomas in https://github.com/immich-app/immich/pull/26545
* fix(web): timeline and asset viewer RTL support by @meesfrensel in https://github.com/immich-app/immich/pull/26513
* fix(server): clean up edited thumbnail when deleting asset by @michelheusschen in https://github.com/immich-app/immich/pull/26664
* fix: implement existing withStacked on searchAssetBuilder by @babbitt in https://github.com/immich-app/immich/pull/26607
* fix(mobile): video state by @uhthomas in https://github.com/immich-app/immich/pull/26574
* fix(maintenance mode): wait for valid server config on restart by @insertish in https://github.com/immich-app/immich/pull/26456
* fix(web): inconsistent asset nav bar state after visiting shared link by @Snowknight26 in https://github.com/immich-app/immich/pull/26674
* fix(web): download toast showing wrong filename for motion assets by @Snowknight26 in https://github.com/immich-app/immich/pull/26689
* fix(mobile): add safe area for asset details by @uhthomas in https://github.com/immich-app/immich/pull/26675
* fix(web): combobox dropdown positioning in modals by @michelheusschen in https://github.com/immich-app/immich/pull/26707
* fix(web): video stealing focus when it plays again when looping by @Snowknight26 in https://github.com/immich-app/immich/pull/26704
* fix(ml): batch size setting by @mertalev in https://github.com/immich-app/immich/pull/26524
* fix(server): clarify transcoding bitrate policy by @meesfrensel in https://github.com/immich-app/immich/pull/26711
* fix: playback style migration by @alextran1502 in https://github.com/immich-app/immich/pull/26718
* fix(web): asset viewer showing wrong viewer type when hovering on stack thumbnails by @Snowknight26 in https://github.com/immich-app/immich/pull/26741
* fix(server): opus handling as accepted audio codec in transcode policy by @skatsubo in https://github.com/immich-app/immich/pull/26736
* fix(web): refresh recent albums sidebar after album changes by @michelheusschen in https://github.com/immich-app/immich/pull/26757
* fix(web): show the correct cursor at crop bounds when editing an asset by @Snowknight26 in https://github.com/immich-app/immich/pull/26748
* fix(web): recalculate face bounding boxes by @cratoo in https://github.com/immich-app/immich/pull/26737
* fix(web): context menu overflow by @SevereCloud in https://github.com/immich-app/immich/pull/26760
### 📚 Documentation
* chore(docs): Update help channel for developers by @Mraedis in https://github.com/immich-app/immich/pull/26284
* feat(docs): Explain configuration file location for Docker Compose by @keunes in https://github.com/immich-app/immich/pull/24989
* chore(docs): add quick-start guide for DevPod with docker by @dhlavaty in https://github.com/immich-app/immich/pull/26213
* feat(docs): Adding information about parameter c= by @aviv926 in https://github.com/immich-app/immich/pull/26430
* feat: doc links by @jrasm91 in https://github.com/immich-app/immich/pull/26519
* fix(docs): add ocr to job flow diagram by @niij in https://github.com/immich-app/immich/pull/26505
### 🌐 Translations
* chore(web): update translations by @weblate in https://github.com/immich-app/immich/pull/26118
* fix: clarify external domain setting is used for emails too by @chrislongros in https://github.com/immich-app/immich/pull/26009
* chore(web): update translations by @weblate in https://github.com/immich-app/immich/pull/26167
* fix(web): error page i18n by @meesfrensel in https://github.com/immich-app/immich/pull/26517
* chore(web): clarify locale settings description by @meesfrensel in https://github.com/immich-app/immich/pull/25562

## New Contributors
* @klenner1 made their first contribution in https://github.com/immich-app/immich/pull/26151
* @bkchr made their first contribution in https://github.com/immich-app/immich/pull/25088
* @chrislongros made their first contribution in https://github.com/immich-app/immich/pull/26011
* @agent-steven made their first contribution in https://github.com/immich-app/immich/pull/26091
* @dhlavaty made their first contribution in https://github.com/immich-app/immich/pull/26238
* @Nacolis made their first contribution in https://github.com/immich-app/immich/pull/26063
* @ewinnd made their first contribution in https://github.com/immich-app/immich/pull/26277
* @dnozay made their first contribution in https://github.com/immich-app/immich/pull/26261
* @keunes made their first contribution in https://github.com/immich-app/immich/pull/24989
* @Devansh-Jani made their first contribution in https://github.com/immich-app/immich/pull/26042
* @benjamonnguyen made their first contribution in https://github.com/immich-app/immich/pull/26196
* @fabio-garavini made their first contribution in https://github.com/immich-app/immich/pull/26252
* @haoxi911 made their first contribution in https://github.com/immich-app/immich/pull/25399
* @thezeroalpha made their first contribution in https://github.com/immich-app/immich/pull/20286
* @socksprox made their first contribution in https://github.com/immich-app/immich/pull/26407
* @kprinssu made their first contribution in https://github.com/immich-app/immich/pull/26178
* @babbitt made their first contribution in https://github.com/immich-app/immich/pull/26607
* @niij made their first contribution in https://github.com/immich-app/immich/pull/26505
* @cratoo made their first contribution in https://github.com/immich-app/immich/pull/26667
* @M123-dev made their first contribution in https://github.com/immich-app/immich/pull/26630
* @apejcic made their first contribution in https://github.com/immich-app/immich/pull/22948
* @SevereCloud made their first contribution in https://github.com/immich-app/immich/pull/26760

**Full Changelog**: https://github.com/immich-app/immich/compare/v2.5.6...v2.6.0

---

