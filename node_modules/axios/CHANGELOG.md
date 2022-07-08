# Changelog

### 0.26.1 (March 9, 2022)

Fixes and Functionality:
- Refactored project file structure to avoid circular imports ([##4220](https://github.com/axios/axios/pull/#4220))

### 0.26.0 (February 13, 2022)

Fixes and Functionality:
- Fixed The timeoutErrorMessage property in config not work with Node.js ([#3581](https://github.com/axios/axios/pull/3581))
- Added errors to be displayed when the query parsing process itself fails ([#3961](https://github.com/axios/axios/pull/3961))
- Fix/remove url required ([#4426](https://github.com/axios/axios/pull/4426))
- Update follow-redirects dependency due to Vurnerbility ([#4462](https://github.com/axios/axios/pull/4462))
- Bump karma from 6.3.11 to 6.3.14 ([#4461](https://github.com/axios/axios/pull/4461))
- Bump follow-redirects from 1.14.7 to 1.14.8 ([#4473](https://github.com/axios/axios/pull/4473))

### 0.25.0 (January 18, 2022)

Breaking changes:
- Fixing maxBodyLength enforcement ([#3786](https://github.com/axios/axios/pull/3786))
- Don't rely on strict mode behaviour for arguments ([#3470](https://github.com/axios/axios/pull/3470))
- Adding error handling when missing url ([#3791](https://github.com/axios/axios/pull/3791))
- Update isAbsoluteURL.js removing escaping of non-special characters ([#3809](https://github.com/axios/axios/pull/3809))
- Use native Array.isArray() in utils.js ([#3836](https://github.com/axios/axios/pull/3836))
- Adding error handling inside stream end callback ([#3967](https://github.com/axios/axios/pull/3967))

Fixes and Functionality:
- Added aborted even handler ([#3916](https://github.com/axios/axios/pull/3916))
- Header types expanded allowing `boolean` and `number` types ([#4144](https://github.com/axios/axios/pull/4144))
- Fix cancel signature allowing cancel message to be `undefined` ([#3153](https://github.com/axios/axios/pull/3153))
- Updated type checks to be formulated better ([#3342](https://github.com/axios/axios/pull/3342))
- Avoid unnecessary buffer allocations ([#3321](https://github.com/axios/axios/pull/3321))
- Adding a socket handler to keep TCP connection live when processing long living requests ([#3422](https://github.com/axios/axios/pull/3422))
- Added toFormData helper function ([#3757](https://github.com/axios/axios/pull/3757))
- Adding responseEncoding prop type in AxiosRequestConfig ([#3918](https://github.com/axios/axios/pull/3918))

Internal and Tests:
- Adding axios-test-instance to ecosystem ([#3786](https://github.com/axios/axios/pull/3786))
- Optimize the logic of isAxiosError ([#3546](https://github.com/axios/axios/pull/3546))
- Add tests and documentation to display how multiple inceptors work ([#3564](https://github.com/axios/axios/pull/3564))
- Updating follow-redirects to version 1.14.7 ([#4379](https://github.com/axios/axios/pull/4379))


Documentation:
- Fixing changelog to show corrext pull request ([#4219](https://github.com/axios/axios/pull/4219))
- Update upgrade guide for https proxy setting ([#3604](https://github.com/axios/axios/pull/3604))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Rijk van Zanten](https://github.com/rijkvanzanten)
- [Kohta Ito](https://github.com/koh110)
- [Brandon Faulkner](https://github.com/bfaulk96)
- [Stefano Magni](https://github.com/NoriSte)
- [enofan](https://github.com/fanguangyi)
- [Andrey Pechkurov](https://github.com/puzpuzpuz)
- [Doowonee](https://github.com/doowonee)
- [Emil Broman](https://github.com/emilbroman-eqt)
- [Remco Haszing](https://github.com/remcohaszing)
- [Black-Hole](https://github.com/BlackHole1)
- [Wolfram Kriesing](https://github.com/wolframkriesing)
- [Andrew Ovens](https://github.com/repl-andrew-ovens)
- [Paulo Renato](https://github.com/PauloRSF)
- [Ben Carp](https://github.com/carpben)
- [Hirotaka Tagawa](https://github.com/wafuwafu13)
- [狼族小狈](https://github.com/lzxb)
- [C. Lewis](https://github.com/ctjlewis)
- [Felipe Carvalho](https://github.com/FCarvalhoVII)
- [Daniel](https://github.com/djs113)
- [Gustavo Sales](https://github.com/gussalesdev)

### 0.24.0 (October 25, 2021)

Breaking changes:
- Revert: change type of AxiosResponse to any, please read lengthy discussion here: ([#4141](https://github.com/axios/axios/issues/4141)) pull request: ([#4186](https://github.com/axios/axios/pull/4186))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Rodry](https://github.com/ImRodry)
- [Remco Haszing](https://github.com/remcohaszing)
- [Isaiah Thomason](https://github.com/ITenthusiasm)

### 0.23.0 (October 12, 2021)

Breaking changes:
- Distinguish request and response data types ([#4116](https://github.com/axios/axios/pull/4116))
- Change never type to unknown ([#4142](https://github.com/axios/axios/pull/4142))
- Fixed TransitionalOptions typings ([#4147](https://github.com/axios/axios/pull/4147))

Fixes and Functionality:
- Adding globalObject: 'this' to webpack config ([#3176](https://github.com/axios/axios/pull/3176))
- Adding insecureHTTPParser type to AxiosRequestConfig ([#4066](https://github.com/axios/axios/pull/4066))
- Fix missing semicolon in typings ([#4115](https://github.com/axios/axios/pull/4115))
- Fix response headers types ([#4136](https://github.com/axios/axios/pull/4136))

Internal and Tests:
- Improve timeout error when timeout is browser default ([#3209](https://github.com/axios/axios/pull/3209))
- Fix node version on CI ([#4069](https://github.com/axios/axios/pull/4069))
- Added testing to TypeScript portion of project ([#4140](https://github.com/axios/axios/pull/4140))

Documentation:
- Rename Angular to AngularJS ([#4114](https://github.com/axios/axios/pull/4114))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Evan-Finkelstein](https://github.com/Evan-Finkelstein)
- [Paweł Szymański](https://github.com/Jezorko)
- [Dobes Vandermeer](https://github.com/dobesv)
- [Claas Augner](https://github.com/caugner)
- [Remco Haszing](https://github.com/remcohaszing)
- [Evgeniy](https://github.com/egmen)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)

### 0.22.0 (October 01, 2021)

Fixes and Functionality:
- Caseless header comparing in HTTP adapter ([#2880](https://github.com/axios/axios/pull/2880))
- Avoid package.json import fixing issues and warnings related to this ([#4041](https://github.com/axios/axios/pull/4041)), ([#4065](https://github.com/axios/axios/pull/4065))
- Fixed cancelToken leakage and added AbortController support ([#3305](https://github.com/axios/axios/pull/3305))
- Updating CI to run on release branches
- Bump follow redirects version
- Fixed default transitional config for custom Axios instance; ([#4052](https://github.com/axios/axios/pull/4052))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Matt R. Wilson](https://github.com/mastermatt)
- [Xianming Zhong](https://github.com/chinesedfan)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)

### 0.21.4 (September 6, 2021)

Fixes and Functionality:
- Fixing JSON transform when data is stringified. Providing backward compatability and complying to the JSON RFC standard ([#4020](https://github.com/axios/axios/pull/4020))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Guillaume Fortaine](https://github.com/gfortaine)
- [Yusuke Kawasaki](https://github.com/kawanet)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)

### 0.21.3 (September 4, 2021)

Fixes and Functionality:
- Fixing response interceptor not being called when request interceptor is attached ([#4013](https://github.com/axios/axios/pull/4013))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Julian Hollmann](https://github.com/nerdbeere)

### 0.21.2 (September 4, 2021)

Fixes and Functionality:

- Updating axios requests to be delayed by pre-emptive promise creation ([#2702](https://github.com/axios/axios/pull/2702))
- Adding "synchronous" and "runWhen" options to interceptors api ([#2702](https://github.com/axios/axios/pull/2702))
- Updating of transformResponse ([#3377](https://github.com/axios/axios/pull/3377))
- Adding ability to omit User-Agent header ([#3703](https://github.com/axios/axios/pull/3703))
- Adding multiple JSON improvements ([#3688](https://github.com/axios/axios/pull/3688), [#3763](https://github.com/axios/axios/pull/3763))
- Fixing quadratic runtime and extra memory usage when setting a maxContentLength ([#3738](https://github.com/axios/axios/pull/3738))
- Adding parseInt to config.timeout ([#3781](https://github.com/axios/axios/pull/3781))
- Adding custom return type support to interceptor ([#3783](https://github.com/axios/axios/pull/3783))
- Adding security fix for ReDoS vulnerability ([#3980](https://github.com/axios/axios/pull/3980))

Internal and Tests:

- Updating build dev dependancies ([#3401](https://github.com/axios/axios/pull/3401))
- Fixing builds running on Travis CI ([#3538](https://github.com/axios/axios/pull/3538))
- Updating follow rediect version ([#3694](https://github.com/axios/axios/pull/3694), [#3771](https://github.com/axios/axios/pull/3771))
- Updating karma sauce launcher to fix failing sauce tests ([#3712](https://github.com/axios/axios/pull/3712), [#3717](https://github.com/axios/axios/pull/3717))
- Updating content-type header for application/json to not contain charset field, according do RFC 8259 ([#2154](https://github.com/axios/axios/pull/2154))
- Fixing tests by bumping karma-sauce-launcher version ([#3813](https://github.com/axios/axios/pull/3813))
- Changing testing process from Travis CI to GitHub Actions ([#3938](https://github.com/axios/axios/pull/3938))

Documentation:

- Updating documentation around the use of `AUTH_TOKEN` with multiple domain endpoints ([#3539](https://github.com/axios/axios/pull/3539))
- Remove duplication of item in changelog ([#3523](https://github.com/axios/axios/pull/3523))
- Fixing gramatical errors ([#2642](https://github.com/axios/axios/pull/2642))
- Fixing spelling error ([#3567](https://github.com/axios/axios/pull/3567))
- Moving gitpod metion ([#2637](https://github.com/axios/axios/pull/2637))
- Adding new axios documentation website link ([#3681](https://github.com/axios/axios/pull/3681), [#3707](https://github.com/axios/axios/pull/3707))
- Updating documentation around dispatching requests ([#3772](https://github.com/axios/axios/pull/3772))
- Adding documentation for the type guard isAxiosError ([#3767](https://github.com/axios/axios/pull/3767))
- Adding explanation of cancel token ([#3803](https://github.com/axios/axios/pull/3803))
- Updating CI status badge ([#3953](https://github.com/axios/axios/pull/3953))
- Fixing errors with JSON documentation ([#3936](https://github.com/axios/axios/pull/3936))
- Fixing README typo under Request Config ([#3825](https://github.com/axios/axios/pull/3825))
- Adding axios-multi-api to the ecosystem file ([#3817](https://github.com/axios/axios/pull/3817))
- Adding SECURITY.md to properly disclose security vulnerabilities ([#3981](https://github.com/axios/axios/pull/3981))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- [Jay](mailto:jasonsaayman@gmail.com)
- [Sasha Korotkov](https://github.com/SashaKoro)
- [Daniel Lopretto](https://github.com/timemachine3030)
- [Mike Bishop](https://github.com/MikeBishop)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)
- [Mark](https://github.com/bimbiltu)
- [Philipe Gouveia Paixão](https://github.com/piiih)
- [hippo](https://github.com/hippo2cat)
- [ready-research](https://github.com/ready-research)
- [Xianming Zhong](https://github.com/chinesedfan)
- [Christopher Chrapka](https://github.com/OJezu)
- [Brian Anglin](https://github.com/anglinb)
- [Kohta Ito](https://github.com/koh110)
- [Ali Clark](https://github.com/aliclark)
- [caikan](https://github.com/caikan)
- [Elina Gorshkova](https://github.com/elinagorshkova)
- [Ryota Ikezawa](https://github.com/paveg)
- [Nisar Hassan Naqvi](https://github.com/nisarhassan12)
- [Jake](https://github.com/codemaster138)
- [TagawaHirotaka](https://github.com/wafuwafu13)
- [Johannes Jarbratt](https://github.com/johachi)
- [Mo Sattler](https://github.com/MoSattler)
- [Sam Carlton](https://github.com/ThatGuySam)
- [Matt Czapliński](https://github.com/MattCCC)
- [Ziding Zhang](https://github.com/zidingz)

### 0.21.1 (December 21, 2020)

Fixes and Functionality:

- Hotfix: Prevent SSRF ([#3410](https://github.com/axios/axios/pull/3410))
- Protocol not parsed when setting proxy config from env vars ([#3070](https://github.com/axios/axios/pull/3070))
- Updating axios in types to be lower case ([#2797](https://github.com/axios/axios/pull/2797))
- Adding a type guard for `AxiosError` ([#2949](https://github.com/axios/axios/pull/2949))

Internal and Tests:

- Remove the skipping of the `socket` http test ([#3364](https://github.com/axios/axios/pull/3364))
- Use different socket for Win32 test ([#3375](https://github.com/axios/axios/pull/3375))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- Daniel Lopretto <timemachine3030@users.noreply.github.com>
- Jason Kwok <JasonHK@users.noreply.github.com>
- Jay <jasonsaayman@gmail.com>
- Jonathan Foster <jonathan@jonathanfoster.io>
- Remco Haszing <remcohaszing@gmail.com>
- Xianming Zhong <chinesedfan@qq.com>

### 0.21.0 (October 23, 2020)

Fixes and Functionality:

- Fixing requestHeaders.Authorization ([#3287](https://github.com/axios/axios/pull/3287))
- Fixing node types ([#3237](https://github.com/axios/axios/pull/3237))
- Fixing axios.delete ignores config.data ([#3282](https://github.com/axios/axios/pull/3282))
- Revert "Fixing overwrite Blob/File type as Content-Type in browser. (#1773)" ([#3289](https://github.com/axios/axios/pull/3289))
- Fixing an issue that type 'null' and 'undefined' is not assignable to validateStatus when typescript strict option is enabled ([#3200](https://github.com/axios/axios/pull/3200))

Internal and Tests:

- Lock travis to not use node v15 ([#3361](https://github.com/axios/axios/pull/3361))

Documentation:

- Fixing simple typo, existant -> existent ([#3252](https://github.com/axios/axios/pull/3252))
- Fixing typos ([#3309](https://github.com/axios/axios/pull/3309))

Huge thanks to everyone who contributed to this release via code (authors listed below) or via reviews and triaging on GitHub:

- Allan Cruz <57270969+Allanbcruz@users.noreply.github.com>
- George Cheng <Gerhut@GMail.com>
- Jay <jasonsaayman@gmail.com>
- Kevin Kirsche <Kev.Kirsche+GitHub@gmail.com>
- Remco Haszing <remcohaszing@gmail.com>
- Taemin Shin <cprayer13@gmail.com>
- Tim Gates <tim.gates@iress.com>
- Xianming Zhong <chinesedfan@qq.com>

### 0.20.0 (August 20, 2020)

Release of 0.20.0-pre as a full release with no other changes.

### 0.20.0-pre (July 15, 2020)

Fixes and Functionality:

- Fixing response with utf-8 BOM can not parse to json ([#2419](https://github.com/axios/axios/pull/2419))
  - fix: remove byte order marker (UTF-8 BOM) when transform response
  - fix: remove BOM only utf-8
  - test: utf-8 BOM
  - fix: incorrect param name
- Refactor mergeConfig without utils.deepMerge ([#2844](https://github.com/axios/axios/pull/2844))
  - Adding failing test
  - Fixing #2587 default custom config persisting
  - Adding Concat keys and filter duplicates
  - Fixed value from CPE
  - update for review feedbacks
  - no deepMerge
  - only merge between plain objects
  - fix rename
  - always merge config by mergeConfig
  - extract function mergeDeepProperties
  - refactor mergeConfig with all keys, and add special logic for validateStatus
  - add test for resetting headers
  - add lots of tests and fix a bug
  - should not inherit `data`
  - use simple toString
- Fixing overwrite Blob/File type as Content-Type in browser. ([#1773](https://github.com/axios/axios/pull/1773))
- Fixing an issue that type 'null' is not assignable to validateStatus ([#2773](https://github.com/axios/axios/pull/2773))
- Fixing special char encoding ([#1671](https://github.com/axios/axios/pull/1671))
  - removing @ character from replacement list since it is a reserved character
  - Updating buildURL test to not include the @ character
  - Removing console logs
- Fixing password encoding with special characters in basic authentication ([#1492](https://github.com/axios/axios/pull/1492))
  - Fixing password encoding with special characters in basic authentication
  - Adding test to check if password with non-Latin1 characters pass
- Fixing 'Network Error' in react native android ([#1487](https://github.com/axios/axios/pull/1487))
  There is a bug in react native Android platform when using get method. It will trigger a 'Network Error' when passing the requestData which is an empty string to request.send function. So if the requestData is an empty string we can set it to null as well to fix the bug.
- Fixing Cookie Helper with Async Components ([#1105](https://github.com/axios/axios/pull/1105)) ([#1107](https://github.com/axios/axios/pull/1107))
- Fixing 'progressEvent' type ([#2851](https://github.com/axios/axios/pull/2851))
  - Fix 'progressEvent' type
  - Update axios.ts
- Fixing getting local files (file://) failed ([#2470](https://github.com/axios/axios/pull/2470))
  - fix issue #2416, #2396
  - fix Eslint warn
  - Modify judgment conditions
  - add unit test
  - update unit test
  - update unit test
- Allow PURGE method in typings ([#2191](https://github.com/axios/axios/pull/2191))
- Adding option to disable automatic decompression ([#2661](https://github.com/axios/axios/pull/2661))
  - Adding ability to disable auto decompression
  - Updating decompress documentation in README
  - Fixing test\unit\adapters\http.js lint errors
  - Adding test for disabling auto decompression
  - Removing changes that fixed lint errors in tests
  - Removing formatting change to unit test
- Add independent `maxBodyLength` option ([#2781](https://github.com/axios/axios/pull/2781))
  - Add independent option to set the maximum size of the request body
  - Remove maxBodyLength check
  - Update README
  - Assert for error code and message
- Adding responseEncoding to mergeConfig ([#1745](https://github.com/axios/axios/pull/1745))
- Compatible with follow-redirect aborts the request ([#2689](https://github.com/axios/axios/pull/2689))
  - Compatible with follow-redirect aborts the request
  - Use the error code
- Fix merging of params ([#2656](https://github.com/axios/axios/pull/2656))
  - Name function to avoid ESLint func-names warning
  - Switch params config to merge list and update tests
  - Restore testing of both false and null
  - Restore test cases for keys without defaults
  - Include test for non-object values that aren't false-y.
- Revert `finally` as `then` ([#2683](https://github.com/axios/axios/pull/2683))

Internal and Tests:

- Fix stale bot config ([#3049](https://github.com/axios/axios/pull/3049))
  - fix stale bot config
  - fix multiple lines
- Add days and change name to work ([#3035](https://github.com/axios/axios/pull/3035))
- Update close-issues.yml ([#3031](https://github.com/axios/axios/pull/3031))
  - Update close-issues.yml
    Update close message to read better 😄
  - Fix use of quotations
    Use single quotes as per other .yml files
  - Remove user name form message
- Add GitHub actions to close stale issues/prs ([#3029](https://github.com/axios/axios/pull/3029))
  - prepare stale actions
  - update messages
  - Add exempt labels and lighten up comments
- Add GitHub actions to close invalid issues ([#3022](https://github.com/axios/axios/pull/3022))
  - add close actions
  - fix with checkout
  - update issue templates
  - add reminder
  - update close message
- Add test with Node.js 12 ([#2860](https://github.com/axios/axios/pull/2860))
  - test with Node.js 12
  - test with latest
- Adding console log on sandbox server startup ([#2210](https://github.com/axios/axios/pull/2210))
  - Adding console log on sandbox server startup
  - Update server.js
    Add server error handling
  - Update server.js
    Better error message, remove retry.
- Adding tests for method `options` type definitions ([#1996](https://github.com/axios/axios/pull/1996))
  Update tests.
- Add test for redirecting with too large response ([#2695](https://github.com/axios/axios/pull/2695))
- Fixing unit test failure in Windows OS ([#2601](https://github.com/axios/axios/pull/2601))
- Fixing issue for HEAD method and gzipped response ([#2666](https://github.com/axios/axios/pull/2666))
- Fix tests in browsers ([#2748](https://github.com/axios/axios/pull/2748))
- chore: add `jsdelivr` and `unpkg` support ([#2443](https://github.com/axios/axios/pull/2443))

Documentation:

- Adding support for URLSearchParams in node ([#1900](https://github.com/axios/axios/pull/1900))
  - Adding support for URLSearchParams in node
  - Remove un-needed code
  - Update utils.js
  - Make changes as suggested
- Adding table of content (preview) ([#3050](https://github.com/axios/axios/pull/3050))
  - add toc (preview)
  - remove toc in toc
    Signed-off-by: Moni <usmoni@gmail.com>
  - fix sublinks
  - fix indentation
  - remove redundant table links
  - update caps and indent
  - remove axios
- Replace 'blacklist' with 'blocklist' ([#3006](https://github.com/axios/axios/pull/3006))
- docs(): Detailed config options environment. ([#2088](https://github.com/axios/axios/pull/2088))
  - docs(): Detailed config options environment.
  - Update README.md
- Include axios-data-unpacker in ECOSYSTEM.md ([#2080](https://github.com/axios/axios/pull/2080))
- Allow opening examples in Gitpod ([#1958](https://github.com/axios/axios/pull/1958))
- Remove axios.all() and axios.spread() from Readme.md ([#2727](https://github.com/axios/axios/pull/2727))
  - remove axios.all(), axios.spread()
  - replace example
  - axios.all() -> Promise.all()
  - axios.spread(function (acct, perms)) -> function (acct, perms)
  - add deprecated mark
- Update README.md ([#2887](https://github.com/axios/axios/pull/2887))
  Small change to the data attribute doc of the config. A request body can also be set for DELETE methods but this wasn't mentioned in the documentation (it only mentioned POST, PUT and PATCH). Took my some 10-20 minutes until I realized that I don't need to manipulate the request body with transformRequest in the case of DELETE.
- Include swagger-taxos-codegen in ECOSYSTEM.md ([#2162](https://github.com/axios/axios/pull/2162))
- Add CDNJS version badge in README.md ([#878](https://github.com/axios/axios/pull/878))
  This badge will show the version on CDNJS!
- Documentation update to clear up ambiguity in code examples ([#2928](https://github.com/axios/axios/pull/2928))
  - Made an adjustment to the documentation to clear up any ambiguity around the use of "fs". This should help clear up that the code examples with "fs" cannot be used on the client side.
- Update README.md about validateStatus ([#2912](https://github.com/axios/axios/pull/2912))
  Rewrote the comment from "Reject only if the status code is greater than or equal to 500" to "Resolve only if the status code is less than 500"
- Updating documentation for usage form-data ([#2805](https://github.com/axios/axios/pull/2805))
  Closes #2049
- Fixing CHANGELOG.md issue link ([#2784](https://github.com/axios/axios/pull/2784))
- Include axios-hooks in ECOSYSTEM.md ([#2003](https://github.com/axios/axios/pull/2003))
- Added Response header access instructions ([#1901](https://github.com/axios/axios/pull/1901))
  - Added Response header access instructions
  - Added note about using bracket notation
- Add `onUploadProgress` and `onDownloadProgress` are browser only ([#2763](https://github.com/axios/axios/pull/2763))
  Saw in #928 and #1966 that `onUploadProgress` and `onDownloadProgress` only work in the browser and was missing that from the README.
- Update ' sign to ` in proxy spec ([#2778](https://github.com/axios/axios/pull/2778))
- Adding jsDelivr link in README ([#1110](https://github.com/axios/axios/pull/1110))
  - Adding jsDelivr link
  - Add SRI
  - Remove SRI

Huge thanks to everyone who contributed to this release via code (authors listed
below) or via reviews and triaging on GitHub:

- Alan Wang <wp_scut@163.com>
- Alexandru Ungureanu <khakcarot@gmail.com>
- Anubhav Srivastava <anubhav.srivastava00@gmail.com>
- Benny Neugebauer <bn@bennyn.de>
- Cr <631807682@qq.com>
- David <cygnidavid@gmail.com>
- David Ko <david.ko@pvtmethod.com>
- David Tanner <david.tanner@lifeomic.com>
- Emily Morehouse <emilyemorehouse@gmail.com>
- Felipe Martins <felipewmartins@gmail.com>
- Fonger <5862369+Fonger@users.noreply.github.com>
- Frostack <soulburn007@gmail.com>
- George Cheng <Gerhut@GMail.com>
- grumblerchester <grumblerchester@users.noreply.github.com>
- Gustavo López <gualopezb@gmail.com>
- hexaez <45806662+hexaez@users.noreply.github.com>
- huangzuizui <huangzuizui@gmail.com>
- Ian Wijma <ian@wij.ma>
- Jay <jasonsaayman@gmail.com>
- jeffjing <zgayjjf@qq.com>
- jennynju <46782518+jennynju@users.noreply.github.com>
- Jimmy Liao <52391190+jimmy-liao-gogoro@users.noreply.github.com>
- Jonathan Sharpe <j.r.sharpe@gmail.com>
- JounQin <admin@1stg.me>
- Justin Beckwith <justin.beckwith@gmail.com>
- Kamil Posiadała <3dcreator.pl@gmail.com>
- Lukas Drgon <lukas.drgon@gmail.com>
- marcinx <mail@marcinx.com>
- Martti Laine <martti@codeclown.net>
- Michał Zarach <michal.m.zarach@gmail.com>
- Moni <usmoni@gmail.com>
- Motonori Iwata <121048+iwata@users.noreply.github.com>
- Nikita Galkin <nikita@galk.in>
- Petr Mares <petr@mares.tw>
- Philippe Recto <precto1285@gmal.com>
- Remco Haszing <remcohaszing@gmail.com>
- rockcs1992 <chengshi1219@gmail.com>
- Ryan Bown <rbown@niftee.com.au>
- Samina Fu <sufuf3@gmail.com>
- Simone Busoli <simone.busoli@gmail.com>
- Spencer von der Ohe <s.vonderohe40@gmail.com>
- Sven Efftinge <sven.efftinge@typefox.io>
- Taegyeoung Oh <otk1090@naver.com>
- Taemin Shin <cprayer13@gmail.com>
- Thibault Ehrhart <1208424+ehrhart@users.noreply.github.com>
- Xianming Zhong <chinesedfan@qq.com>
- Yasu Flores <carlosyasu91@gmail.com>
- Zac Delventhal <delventhalz@gmail.com>

### 0.19.2 (Jan 20, 2020)

- Remove unnecessary XSS check ([#2679](https://github.com/axios/axios/pull/2679)) (see ([#2646](https://github.com/axios/axios/issues/2646)) for discussion)

### 0.19.1 (Jan 7, 2020)

Fixes and Functionality:

- Fixing invalid agent issue ([#1904](https://github.com/axios/axios/pull/1904))
- Fix ignore set withCredentials false ([#2582](https://github.com/axios/axios/pull/2582))
- Delete useless default to hash ([#2458](https://github.com/axios/axios/pull/2458))
- Fix HTTP/HTTPs agents passing to follow-redirect ([#1904](https://github.com/axios/axios/pull/1904))
- Fix ignore set withCredentials false ([#2582](https://github.com/axios/axios/pull/2582))
- Fix CI build failure ([#2570](https://github.com/axios/axios/pull/2570))
- Remove dependency on is-buffer from package.json ([#1816](https://github.com/axios/axios/pull/1816))
- Adding options typings ([#2341](https://github.com/axios/axios/pull/2341))
- Adding Typescript HTTP method definition for LINK and UNLINK. ([#2444](https://github.com/axios/axios/pull/2444))
- Update dist with newest changes, fixes Custom Attributes issue
- Change syntax to see if build passes ([#2488](https://github.com/axios/axios/pull/2488))
- Update Webpack + deps, remove now unnecessary polyfills ([#2410](https://github.com/axios/axios/pull/2410))
- Fix to prevent XSS, throw an error when the URL contains a JS script ([#2464](https://github.com/axios/axios/pull/2464))
- Add custom timeout error copy in config ([#2275](https://github.com/axios/axios/pull/2275))
- Add error toJSON example ([#2466](https://github.com/axios/axios/pull/2466))
- Fixing Vulnerability A Fortify Scan finds a critical Cross-Site Scrip… ([#2451](https://github.com/axios/axios/pull/2451))
- Fixing subdomain handling on no_proxy ([#2442](https://github.com/axios/axios/pull/2442))
- Make redirection from HTTP to HTTPS work ([#2426](https://github.com/axios/axios/pull/2426)) and ([#2547](https://github.com/axios/axios/pull/2547))
- Add toJSON property to AxiosError type ([#2427](https://github.com/axios/axios/pull/2427))
- Fixing socket hang up error on node side for slow response. ([#1752](https://github.com/axios/axios/pull/1752))
- Alternative syntax to send data into the body ([#2317](https://github.com/axios/axios/pull/2317))
- Fixing custom config options ([#2207](https://github.com/axios/axios/pull/2207))
- Fixing set `config.method` after mergeConfig for Axios.prototype.request ([#2383](https://github.com/axios/axios/pull/2383))
- Axios create url bug ([#2290](https://github.com/axios/axios/pull/2290))
- Do not modify config.url when using a relative baseURL (resolves [#1628](https://github.com/axios/axios/issues/1098)) ([#2391](https://github.com/axios/axios/pull/2391))

Internal:

- Revert "Update Webpack + deps, remove now unnecessary polyfills" ([#2479](https://github.com/axios/axios/pull/2479))
- Order of if/else blocks is causing unit tests mocking XHR. ([#2201](https://github.com/axios/axios/pull/2201))
- Add license badge ([#2446](https://github.com/axios/axios/pull/2446))
- Fix travis CI build [#2386](https://github.com/axios/axios/pull/2386)
- Fix cancellation error on build master. #2290 #2207 ([#2407](https://github.com/axios/axios/pull/2407))

Documentation:

- Fixing typo in CHANGELOG.md: s/Functionallity/Functionality ([#2639](https://github.com/axios/axios/pull/2639))
- Fix badge, use master branch ([#2538](https://github.com/axios/axios/pull/2538))
- Fix typo in changelog [#2193](https://github.com/axios/axios/pull/2193)
- Document fix ([#2514](https://github.com/axios/axios/pull/2514))
- Update docs with no_proxy change, issue #2484 ([#2513](https://github.com/axios/axios/pull/2513))
- Fixing missing words in docs template ([#2259](https://github.com/axios/axios/pull/2259))
- 🐛Fix request finally documentation in README ([#2189](https://github.com/axios/axios/pull/2189))
- updating spelling and adding link to docs ([#2212](https://github.com/axios/axios/pull/2212))
- docs: minor tweak ([#2404](https://github.com/axios/axios/pull/2404))
- Update response interceptor docs ([#2399](https://github.com/axios/axios/pull/2399))
- Update README.md ([#2504](https://github.com/axios/axios/pull/2504))
- Fix word 'sintaxe' to 'syntax' in README.md ([#2432](https://github.com/axios/axios/pull/2432))
- updating README: notes on CommonJS autocomplete ([#2256](https://github.com/axios/axios/pull/2256))
- Fix grammar in README.md ([#2271](https://github.com/axios/axios/pull/2271))
- Doc fixes, minor examples cleanup ([#2198](https://github.com/axios/axios/pull/2198))

### 0.19.0 (May 30, 2019)

Fixes and Functionality:

- Added support for no_proxy env variable ([#1693](https://github.com/axios/axios/pull/1693/files)) - Chance Dickson
- Unzip response body only for statuses != 204 ([#1129](https://github.com/axios/axios/pull/1129)) - drawski
- Destroy stream on exceeding maxContentLength (fixes [#1098](https://github.com/axios/axios/issues/1098)) ([#1485](https://github.com/axios/axios/pull/1485)) - Gadzhi Gadzhiev
- Makes Axios error generic to use AxiosResponse ([#1738](https://github.com/axios/axios/pull/1738)) - Suman Lama
- Fixing Mocha tests by locking follow-redirects version to 1.5.10 ([#1993](https://github.com/axios/axios/pull/1993)) - grumblerchester
- Allow uppercase methods in typings. ([#1781](https://github.com/axios/axios/pull/1781)) - Ken Powers
- Fixing building url with hash mark ([#1771](https://github.com/axios/axios/pull/1771)) - Anatoly Ryabov
- This commit fix building url with hash map (fragment identifier) when parameters are present: they must not be added after `#`, because client cut everything after `#`
- Preserve HTTP method when following redirect ([#1758](https://github.com/axios/axios/pull/1758)) - Rikki Gibson
- Add `getUri` signature to TypeScript definition. ([#1736](https://github.com/axios/axios/pull/1736)) - Alexander Trauzzi
- Adding isAxiosError flag to errors thrown by axios ([#1419](https://github.com/axios/axios/pull/1419)) - Ayush Gupta

Internal:

- Fixing .eslintrc without extension ([#1789](https://github.com/axios/axios/pull/1789)) - Manoel
- Fix failing SauceLabs tests by updating configuration - Emily Morehouse
- Add issue templates - Emily Morehouse

Documentation:

- Consistent coding style in README ([#1787](https://github.com/axios/axios/pull/1787)) - Ali Servet Donmez
- Add information about auth parameter to README ([#2166](https://github.com/axios/axios/pull/2166)) - xlaguna
- Add DELETE to list of methods that allow data as a config option ([#2169](https://github.com/axios/axios/pull/2169)) - Daniela Borges Matos de Carvalho
- Update ECOSYSTEM.md - Add Axios Endpoints ([#2176](https://github.com/axios/axios/pull/2176)) - Renan
- Add r2curl in ECOSYSTEM ([#2141](https://github.com/axios/axios/pull/2141)) - 유용우 / CX
- Update README.md - Add instructions for installing with yarn ([#2036](https://github.com/axios/axios/pull/2036)) - Victor Hermes
- Fixing spacing for README.md ([#2066](https://github.com/axios/axios/pull/2066)) - Josh McCarty
- Update README.md. - Change `.then` to `.finally` in example code ([#2090](https://github.com/axios/axios/pull/2090)) - Omar Cai
- Clarify what values responseType can have in Node ([#2121](https://github.com/axios/axios/pull/2121)) - Tyler Breisacher
- docs(ECOSYSTEM): add axios-api-versioning ([#2020](https://github.com/axios/axios/pull/2020)) - Weffe
- It seems that `responseType: 'blob'` doesn't actually work in Node (when I tried using it, response.data was a string, not a Blob, since Node doesn't have Blobs), so this clarifies that this option should only be used in the browser
- Update README.md. - Add Querystring library note ([#1896](https://github.com/axios/axios/pull/1896)) - Dmitriy Eroshenko
- Add react-hooks-axios to Libraries section of ECOSYSTEM.md ([#1925](https://github.com/axios/axios/pull/1925)) - Cody Chan
- Clarify in README that default timeout is 0 (no timeout) ([#1750](https://github.com/axios/axios/pull/1750)) - Ben Standefer

### 0.19.0-beta.1 (Aug 9, 2018)

**NOTE:** This is a beta version of this release. There may be functionality that is broken in
certain browsers, though we suspect that builds are hanging and not erroring. See
https://saucelabs.com/u/axios for the most up-to-date information.

New Functionality:

- Add getUri method ([#1712](https://github.com/axios/axios/issues/1712))
- Add support for no_proxy env variable ([#1693](https://github.com/axios/axios/issues/1693))
- Add toJSON to decorated Axios errors to facilitate serialization ([#1625](https://github.com/axios/axios/issues/1625))
- Add second then on axios call ([#1623](https://github.com/axios/axios/issues/1623))
- Typings: allow custom return types
- Add option to specify character set in responses (with http adapter)

Fixes:

- Fix Keep defaults local to instance ([#385](https://github.com/axios/axios/issues/385))
- Correctly catch exception in http test ([#1475](https://github.com/axios/axios/issues/1475))
- Fix accept header normalization ([#1698](https://github.com/axios/axios/issues/1698))
- Fix http adapter to allow HTTPS connections via HTTP ([#959](https://github.com/axios/axios/issues/959))
- Fix Removes usage of deprecated Buffer constructor. ([#1555](https://github.com/axios/axios/issues/1555), [#1622](https://github.com/axios/axios/issues/1622))
- Fix defaults to use httpAdapter if available ([#1285](https://github.com/axios/axios/issues/1285))
  - Fixing defaults to use httpAdapter if available
  - Use a safer, cross-platform method to detect the Node environment
- Fix Reject promise if request is cancelled by the browser ([#537](https://github.com/axios/axios/issues/537))
- [Typescript] Fix missing type parameters on delete/head methods
- [NS]: Send `false` flag isStandardBrowserEnv for Nativescript
- Fix missing type parameters on delete/head
- Fix Default method for an instance always overwritten by get
- Fix type error when socketPath option in AxiosRequestConfig
- Capture errors on request data streams
- Decorate resolve and reject to clear timeout in all cases

Huge thanks to everyone who contributed to this release via code (authors listed
below) or via reviews and triaging on GitHub:

- Andrew Scott <ascott18@gmail.com>
- Anthony Gauthier <antho325@hotmail.com>
- arpit <arpit2438735@gmail.com>
- ascott18
- Benedikt Rötsch <axe312ger@users.noreply.github.com>
- Chance Dickson <me@chancedickson.com>
- Dave Stewart <info@davestewart.co.uk>
- Deric Cain <deric.cain@gmail.com>
- Guillaume Briday <guillaumebriday@gmail.com>
- Jacob Wejendorp <jacob@wejendorp.dk>
- Jim Lynch <mrdotjim@gmail.com>
- johntron
- Justin Beckwith <beckwith@google.com>
- Justin Beckwith <justin.beckwith@gmail.com>
- Khaled Garbaya <khaledgarbaya@gmail.com>
- Lim Jing Rong <jjingrong@users.noreply.github.com>
- Mark van den Broek <mvdnbrk@gmail.com>
- Martti Laine <martti@codeclown.net>
- mattridley
- mattridley <matt.r@joinblink.com>
- Nicolas Del Valle <nicolas.delvalle@gmail.com>
- Nilegfx
- pbarbiero
- Rikki Gibson <rikkigibson@gmail.com>
- Sako Hartounian <sakohartounian@yahoo.com>
- Shane Fitzpatrick <fitzpasd@gmail.com>
- Stephan Schneider <stephanschndr@gmail.com>
- Steven <steven@ceriously.com>
- Tim Garthwaite <tim.garthwaite@jibo.com>
- Tim Johns <timjohns@yahoo.com>
- Yutaro Miyazaki <yutaro@studio-rubbish.com>

### 0.18.0 (Feb 19, 2018)

- Adding support for UNIX Sockets when running with Node.js ([#1070](https://github.com/axios/axios/pull/1070))
- Fixing typings ([#1177](https://github.com/axios/axios/pull/1177)):
  - AxiosRequestConfig.proxy: allows type false
  - AxiosProxyConfig: added auth field
- Adding function signature in AxiosInstance interface so AxiosInstance can be invoked ([#1192](https://github.com/axios/axios/pull/1192), [#1254](https://github.com/axios/axios/pull/1254))
- Allowing maxContentLength to pass through to redirected calls as maxBodyLength in follow-redirects config ([#1287](https://github.com/axios/axios/pull/1287))
- Fixing configuration when using an instance - method can now be set ([#1342](https://github.com/axios/axios/pull/1342))

### 0.17.1 (Nov 11, 2017)

- Fixing issue with web workers ([#1160](https://github.com/axios/axios/pull/1160))
- Allowing overriding transport ([#1080](https://github.com/axios/axios/pull/1080))
- Updating TypeScript typings ([#1165](https://github.com/axios/axios/pull/1165), [#1125](https://github.com/axios/axios/pull/1125), [#1131](https://github.com/axios/axios/pull/1131))

### 0.17.0 (Oct 21, 2017)

- **BREAKING** Fixing issue with `baseURL` and interceptors ([#950](https://github.com/axios/axios/pull/950))
- **BREAKING** Improving handing of duplicate headers ([#874](https://github.com/axios/axios/pull/874))
- Adding support for disabling proxies ([#691](https://github.com/axios/axios/pull/691))
- Updating TypeScript typings with generic type parameters ([#1061](https://github.com/axios/axios/pull/1061))

### 0.16.2 (Jun 3, 2017)

- Fixing issue with including `buffer` in bundle ([#887](https://github.com/axios/axios/pull/887))
- Including underlying request in errors ([#830](https://github.com/axios/axios/pull/830))
- Convert `method` to lowercase ([#930](https://github.com/axios/axios/pull/930))

### 0.16.1 (Apr 8, 2017)

- Improving HTTP adapter to return last request in case of redirects ([#828](https://github.com/axios/axios/pull/828))
- Updating `follow-redirects` dependency ([#829](https://github.com/axios/axios/pull/829))
- Adding support for passing `Buffer` in node ([#773](https://github.com/axios/axios/pull/773))

### 0.16.0 (Mar 31, 2017)

- **BREAKING** Removing `Promise` from axios typings in favor of built-in type declarations ([#480](https://github.com/axios/axios/issues/480))
- Adding `options` shortcut method ([#461](https://github.com/axios/axios/pull/461))
- Fixing issue with using `responseType: 'json'` in browsers incompatible with XHR Level 2 ([#654](https://github.com/axios/axios/pull/654))
- Improving React Native detection ([#731](https://github.com/axios/axios/pull/731))
- Fixing `combineURLs` to support empty `relativeURL` ([#581](https://github.com/axios/axios/pull/581))
- Removing `PROTECTION_PREFIX` support ([#561](https://github.com/axios/axios/pull/561))

### 0.15.3 (Nov 27, 2016)

- Fixing issue with custom instances and global defaults ([#443](https://github.com/axios/axios/issues/443))
- Renaming `axios.d.ts` to `index.d.ts` ([#519](https://github.com/axios/axios/issues/519))
- Adding `get`, `head`, and `delete` to `defaults.headers` ([#509](https://github.com/axios/axios/issues/509))
- Fixing issue with `btoa` and IE ([#507](https://github.com/axios/axios/issues/507))
- Adding support for proxy authentication ([#483](https://github.com/axios/axios/pull/483))
- Improving HTTP adapter to use `http` protocol by default ([#493](https://github.com/axios/axios/pull/493))
- Fixing proxy issues ([#491](https://github.com/axios/axios/pull/491))

### 0.15.2 (Oct 17, 2016)

- Fixing issue with calling `cancel` after response has been received ([#482](https://github.com/axios/axios/issues/482))

### 0.15.1 (Oct 14, 2016)

- Fixing issue with UMD ([#485](https://github.com/axios/axios/issues/485))

### 0.15.0 (Oct 10, 2016)

- Adding cancellation support ([#452](https://github.com/axios/axios/pull/452))
- Moving default adapter to global defaults ([#437](https://github.com/axios/axios/pull/437))
- Fixing issue with `file` URI scheme ([#440](https://github.com/axios/axios/pull/440))
- Fixing issue with `params` objects that have no prototype ([#445](https://github.com/axios/axios/pull/445))

### 0.14.0 (Aug 27, 2016)

- **BREAKING** Updating TypeScript definitions ([#419](https://github.com/axios/axios/pull/419))
- **BREAKING** Replacing `agent` option with `httpAgent` and `httpsAgent` ([#387](https://github.com/axios/axios/pull/387))
- **BREAKING** Splitting `progress` event handlers into `onUploadProgress` and `onDownloadProgress` ([#423](https://github.com/axios/axios/pull/423))
- Adding support for `http_proxy` and `https_proxy` environment variables ([#366](https://github.com/axios/axios/pull/366))
- Fixing issue with `auth` config option and `Authorization` header ([#397](https://github.com/axios/axios/pull/397))
- Don't set XSRF header if `xsrfCookieName` is `null` ([#406](https://github.com/axios/axios/pull/406))

### 0.13.1 (Jul 16, 2016)

- Fixing issue with response data not being transformed on error ([#378](https://github.com/axios/axios/issues/378))

### 0.13.0 (Jul 13, 2016)

- **BREAKING** Improved error handling ([#345](https://github.com/axios/axios/pull/345))
- **BREAKING** Response transformer now invoked in dispatcher not adapter ([10eb238](https://github.com/axios/axios/commit/10eb23865101f9347570552c04e9d6211376e25e))
- **BREAKING** Request adapters now return a `Promise` ([157efd5](https://github.com/axios/axios/commit/157efd5615890301824e3121cc6c9d2f9b21f94a))
- Fixing issue with `withCredentials` not being overwritten ([#343](https://github.com/axios/axios/issues/343))
- Fixing regression with request transformer being called before request interceptor ([#352](https://github.com/axios/axios/issues/352))
- Fixing custom instance defaults ([#341](https://github.com/axios/axios/issues/341))
- Fixing instances created from `axios.create` to have same API as default axios ([#217](https://github.com/axios/axios/issues/217))

### 0.12.0 (May 31, 2016)

- Adding support for `URLSearchParams` ([#317](https://github.com/axios/axios/pull/317))
- Adding `maxRedirects` option ([#307](https://github.com/axios/axios/pull/307))

### 0.11.1 (May 17, 2016)

- Fixing IE CORS support ([#313](https://github.com/axios/axios/pull/313))
- Fixing detection of `FormData` ([#325](https://github.com/axios/axios/pull/325))
- Adding `Axios` class to exports ([#321](https://github.com/axios/axios/pull/321))

### 0.11.0 (Apr 26, 2016)

- Adding support for Stream with HTTP adapter ([#296](https://github.com/axios/axios/pull/296))
- Adding support for custom HTTP status code error ranges ([#308](https://github.com/axios/axios/pull/308))
- Fixing issue with ArrayBuffer ([#299](https://github.com/axios/axios/pull/299))

### 0.10.0 (Apr 20, 2016)

- Fixing issue with some requests sending `undefined` instead of `null` ([#250](https://github.com/axios/axios/pull/250))
- Fixing basic auth for HTTP adapter ([#252](https://github.com/axios/axios/pull/252))
- Fixing request timeout for XHR adapter ([#227](https://github.com/axios/axios/pull/227))
- Fixing IE8 support by using `onreadystatechange` instead of `onload` ([#249](https://github.com/axios/axios/pull/249))
- Fixing IE9 cross domain requests ([#251](https://github.com/axios/axios/pull/251))
- Adding `maxContentLength` option ([#275](https://github.com/axios/axios/pull/275))
- Fixing XHR support for WebWorker environment ([#279](https://github.com/axios/axios/pull/279))
- Adding request instance to response ([#200](https://github.com/axios/axios/pull/200))

### 0.9.1 (Jan 24, 2016)

- Improving handling of request timeout in node ([#124](https://github.com/axios/axios/issues/124))
- Fixing network errors not rejecting ([#205](https://github.com/axios/axios/pull/205))
- Fixing issue with IE rejecting on HTTP 204 ([#201](https://github.com/axios/axios/issues/201))
- Fixing host/port when following redirects ([#198](https://github.com/axios/axios/pull/198))

### 0.9.0 (Jan 18, 2016)

- Adding support for custom adapters
- Fixing Content-Type header being removed when data is false ([#195](https://github.com/axios/axios/pull/195))
- Improving XDomainRequest implementation ([#185](https://github.com/axios/axios/pull/185))
- Improving config merging and order of precedence ([#183](https://github.com/axios/axios/pull/183))
- Fixing XDomainRequest support for only <= IE9 ([#182](https://github.com/axios/axios/pull/182))

### 0.8.1 (Dec 14, 2015)

- Adding support for passing XSRF token for cross domain requests when using `withCredentials` ([#168](https://github.com/axios/axios/pull/168))
- Fixing error with format of basic auth header ([#178](https://github.com/axios/axios/pull/173))
- Fixing error with JSON payloads throwing `InvalidStateError` in some cases ([#174](https://github.com/axios/axios/pull/174))

### 0.8.0 (Dec 11, 2015)

- Adding support for creating instances of axios ([#123](https://github.com/axios/axios/pull/123))
- Fixing http adapter to use `Buffer` instead of `String` in case of `responseType === 'arraybuffer'` ([#128](https://github.com/axios/axios/pull/128))
- Adding support for using custom parameter serializer with `paramsSerializer` option ([#121](https://github.com/axios/axios/pull/121))
- Fixing issue in IE8 caused by `forEach` on `arguments` ([#127](https://github.com/axios/axios/pull/127))
- Adding support for following redirects in node ([#146](https://github.com/axios/axios/pull/146))
- Adding support for transparent decompression if `content-encoding` is set ([#149](https://github.com/axios/axios/pull/149))
- Adding support for transparent XDomainRequest to handle cross domain requests in IE9 ([#140](https://github.com/axios/axios/pull/140))
- Adding support for HTTP basic auth via Authorization header ([#167](https://github.com/axios/axios/pull/167))
- Adding support for baseURL option ([#160](https://github.com/axios/axios/pull/160))

### 0.7.0 (Sep 29, 2015)

- Fixing issue with minified bundle in IE8 ([#87](https://github.com/axios/axios/pull/87))
- Adding support for passing agent in node ([#102](https://github.com/axios/axios/pull/102))
- Adding support for returning result from `axios.spread` for chaining ([#106](https://github.com/axios/axios/pull/106))
- Fixing typescript definition ([#105](https://github.com/axios/axios/pull/105))
- Fixing default timeout config for node ([#112](https://github.com/axios/axios/pull/112))
- Adding support for use in web workers, and react-native ([#70](https://github.com/axios/axios/issue/70)), ([#98](https://github.com/axios/axios/pull/98))
- Adding support for fetch like API `axios(url[, config])` ([#116](https://github.com/axios/axios/issues/116))

### 0.6.0 (Sep 21, 2015)

- Removing deprecated success/error aliases
- Fixing issue with array params not being properly encoded ([#49](https://github.com/axios/axios/pull/49))
- Fixing issue with User-Agent getting overridden ([#69](https://github.com/axios/axios/issues/69))
- Adding support for timeout config ([#56](https://github.com/axios/axios/issues/56))
- Removing es6-promise dependency
- Fixing issue preventing `length` to be used as a parameter ([#91](https://github.com/axios/axios/pull/91))
- Fixing issue with IE8 ([#85](https://github.com/axios/axios/pull/85))
- Converting build to UMD

### 0.5.4 (Apr 08, 2015)

- Fixing issue with FormData not being sent ([#53](https://github.com/axios/axios/issues/53))

### 0.5.3 (Apr 07, 2015)

- Using JSON.parse unconditionally when transforming response string ([#55](https://github.com/axios/axios/issues/55))

### 0.5.2 (Mar 13, 2015)

- Adding support for `statusText` in response ([#46](https://github.com/axios/axios/issues/46))

### 0.5.1 (Mar 10, 2015)

- Fixing issue using strict mode ([#45](https://github.com/axios/axios/issues/45))
- Fixing issue with standalone build ([#47](https://github.com/axios/axios/issues/47))

### 0.5.0 (Jan 23, 2015)

- Adding support for intercepetors ([#14](https://github.com/axios/axios/issues/14))
- Updating es6-promise dependency

### 0.4.2 (Dec 10, 2014)

- Fixing issue with `Content-Type` when using `FormData` ([#22](https://github.com/axios/axios/issues/22))
- Adding support for TypeScript ([#25](https://github.com/axios/axios/issues/25))
- Fixing issue with standalone build ([#29](https://github.com/axios/axios/issues/29))
- Fixing issue with verbs needing to be capitalized in some browsers ([#30](https://github.com/axios/axios/issues/30))

### 0.4.1 (Oct 15, 2014)

- Adding error handling to request for node.js ([#18](https://github.com/axios/axios/issues/18))

### 0.4.0 (Oct 03, 2014)

- Adding support for `ArrayBuffer` and `ArrayBufferView` ([#10](https://github.com/axios/axios/issues/10))
- Adding support for utf-8 for node.js ([#13](https://github.com/axios/axios/issues/13))
- Adding support for SSL for node.js ([#12](https://github.com/axios/axios/issues/12))
- Fixing incorrect `Content-Type` header ([#9](https://github.com/axios/axios/issues/9))
- Adding standalone build without bundled es6-promise ([#11](https://github.com/axios/axios/issues/11))
- Deprecating `success`/`error` in favor of `then`/`catch`

### 0.3.1 (Sep 16, 2014)

- Fixing missing post body when using node.js ([#3](https://github.com/axios/axios/issues/3))

### 0.3.0 (Sep 16, 2014)

- Fixing `success` and `error` to properly receive response data as individual arguments ([#8](https://github.com/axios/axios/issues/8))
- Updating `then` and `catch` to receive response data as a single object ([#6](https://github.com/axios/axios/issues/6))
- Fixing issue with `all` not working ([#7](https://github.com/axios/axios/issues/7))

### 0.2.2 (Sep 14, 2014)

- Fixing bundling with browserify ([#4](https://github.com/axios/axios/issues/4))

### 0.2.1 (Sep 12, 2014)

- Fixing build problem causing ridiculous file sizes

### 0.2.0 (Sep 12, 2014)

- Adding support for `all` and `spread`
- Adding support for node.js ([#1](https://github.com/axios/axios/issues/1))

### 0.1.0 (Aug 29, 2014)

- Initial release
