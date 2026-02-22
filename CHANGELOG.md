
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
### 📚 Documentation
* chore(docs): Update help channel for developers by @Mraedis in https://github.com/immich-app/immich/pull/26284
* feat(docs): Explain configuration file location for Docker Compose by @keunes in https://github.com/immich-app/immich/pull/24989
* chore(docs): add quick-start guide for DevPod with docker by @dhlavaty in https://github.com/immich-app/immich/pull/26213
### 🌐 Translations
* chore(web): update translations by @weblate in https://github.com/immich-app/immich/pull/26118
* fix: clarify external domain setting is used for emails too by @chrislongros in https://github.com/immich-app/immich/pull/26009
* chore(web): update translations by @weblate in https://github.com/immich-app/immich/pull/26167

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

**Full Changelog**: https://github.com/immich-app/immich/compare/v2.5.6...v2.6.0

---

