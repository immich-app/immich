# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.15.3](https://github.com/nuxt/consola/compare/v2.15.2...v2.15.3) (2021-02-07)


### Bug Fixes

* add `.raw` to mocked functions ([987dadc](https://github.com/nuxt/consola/commit/987dadcc81a82698051ade2384ae2f0fc12d8aef))

### [2.15.2](https://github.com/nuxt/consola/compare/v2.15.1...v2.15.2) (2021-02-03)


### Bug Fixes

* add isRaw flag only for wrapped calls ([23b1184](https://github.com/nuxt/consola/commit/23b1184e2897f5d33943bec7180fb2427402d400)), closes [nuxt/nuxt.js#8752](https://github.com/nuxt/nuxt.js/issues/8752)

### [2.15.1](https://github.com/nuxt/consola/compare/v2.15.0...v2.15.1) (2021-02-02)


### Bug Fixes

* skip logObj check for wrapped calls (fixes [#109](https://github.com/nuxt/consola/issues/109)) ([091a244](https://github.com/nuxt/consola/commit/091a24423bb9c28b7371e7af849b15c7e39747fa))

## [2.15.0](https://github.com/nuxt/consola/compare/v2.14.0...v2.15.0) (2020-08-05)


### Features

* **types:** use union type for `ConsolaLogObject.type`  ([#100](https://github.com/nuxt/consola/issues/100)) ([a6eba53](https://github.com/nuxt/consola/commit/a6eba532381bcec9c84ac5600ac668aca87c8487))
* support `formatOptions.date` to optionally hide date ([#101](https://github.com/nuxt/consola/issues/101)) ([6bf733f](https://github.com/nuxt/consola/commit/6bf733f2b9a5320584bdd0de7de08f4341c74335))

## [2.14.0](https://github.com/nuxt/consola/compare/v2.13.0...v2.14.0) (2020-06-26)


### Features

* improve spam throttle ([5314eee](https://github.com/nuxt/consola/commit/5314eeebb4b564408a4ab14cb457bdbd426f6124))

## [2.13.0](https://github.com/nuxt/consola/compare/v2.12.2...v2.13.0) (2020-06-12)


### Features

* remove level boundary check ([8972d47](https://github.com/nuxt/consola/commit/8972d478c93690fafb909f49d9d0edbcb67bddae))


### Bug Fixes

* **types:** fix silent/verbose levels ([7ab0a65](https://github.com/nuxt/consola/commit/7ab0a65f383d9dd1b68a18ee439bf19468a57885))

### [2.12.2](https://github.com/nuxt/consola/compare/v2.12.1...v2.12.2) (2020-05-26)


### Bug Fixes

* silent log level does not work ([#98](https://github.com/nuxt/consola/issues/98)) ([6a4a79c](https://github.com/nuxt/consola/commit/6a4a79c24b8db902b078ad92a6ee7a33880ed26c))

### [2.12.1](https://github.com/nuxt/consola/compare/v2.12.0...v2.12.1) (2020-05-07)


### Bug Fixes

* new LogLevel enum is not exported properly [#95](https://github.com/nuxt/consola/issues/95) ([#96](https://github.com/nuxt/consola/issues/96)) ([fafbec2](https://github.com/nuxt/consola/commit/fafbec2b1bc75912eea5d0618a27b982738d6cda))

## [2.12.0](https://github.com/nuxt/consola/compare/v2.11.3...v2.12.0) (2020-05-07)


### Features

* **types:** add missing typescript definitions for reporters  ([#94](https://github.com/nuxt/consola/issues/94)) ([4a08ef0](https://github.com/nuxt/consola/commit/4a08ef02bc48ddc887f2b91713520eda50793a27))

### [2.11.3](https://github.com/nuxt/consola/compare/v2.11.2...v2.11.3) (2019-12-31)


### Bug Fixes

* **typescript:** remove cjs export (fixes [#88](https://github.com/nuxt/consola/issues/88)) ([0d9ab1b](https://github.com/nuxt/consola/commit/0d9ab1bba8645853c721069c57527764ed708869))

### [2.11.2](https://github.com/nuxt/consola/compare/v2.11.1...v2.11.2) (2019-12-27)


### Bug Fixes

* **types:** `const consola = require('consola')` type is wrong ([#80](https://github.com/nuxt/consola/issues/80)) ([5c22d8c](https://github.com/nuxt/consola/commit/5c22d8cd4624e3bbd7294b9eba09f131ed786332))
* throttle expiration ([#81](https://github.com/nuxt/consola/issues/81)) ([940474d](https://github.com/nuxt/consola/commit/940474d3b64a4969acdec04290734e700920c19f)), closes [#68](https://github.com/nuxt/consola/issues/68)

### [2.11.1](https://github.com/nuxt/consola/compare/v2.11.0...v2.11.1) (2019-12-17)


### Bug Fixes

* **consola:** use `options.stderr` ([#77](https://github.com/nuxt/consola/issues/77)) ([774c673](https://github.com/nuxt/consola/commit/774c6739e794665bc5e2c40aa84921b7f2a26387))

## [2.11.0](https://github.com/nuxt/consola/compare/v2.10.0...v2.11.0) (2019-11-10)


### Features

* **browser:** add support of formatted strings ([#66](https://github.com/nuxt/consola/issues/66)) ([920f313](https://github.com/nuxt/consola/commit/920f313dba322c34ccd1b2f08afba59122c3b8e7))


### Bug Fixes

* typecheck type and tag before normalize ([1984deb](https://github.com/nuxt/consola/commit/1984deb0a5214a3aa82dab972ec76af20ba14d1b))
* **types:** reporter in remove methods are optional ([#70](https://github.com/nuxt/consola/issues/70)) ([a17cdb1](https://github.com/nuxt/consola/commit/a17cdb1a423e41076c58692130955d5a9f5e36ba))

### [2.10.1](https://github.com/nuxt/consola/compare/v2.10.0...v2.10.1) (2019-08-05)

## [2.10.0](https://github.com/nuxt/consola/compare/v2.9.0...v2.10.0) (2019-08-05)


### Bug Fixes

* add missing typescript declaration for level, stdout and stderr ([#58](https://github.com/nuxt/consola/issues/58)) ([a149dbb](https://github.com/nuxt/consola/commit/a149dbb))


### Features

* improve typescript type definitions ([#57](https://github.com/nuxt/consola/issues/57)) ([80eefd8](https://github.com/nuxt/consola/commit/80eefd8))

## [2.9.0](https://github.com/nuxt/consola/compare/v2.8.0...v2.9.0) (2019-06-18)


### Features

* count spam log ([197a6b3](https://github.com/nuxt/consola/commit/197a6b3))



## [2.8.0](https://github.com/nuxt/consola/compare/v2.7.1...v2.8.0) (2019-06-18)


### Features

* spam preventation ([7da806b](https://github.com/nuxt/consola/commit/7da806b))



### [2.7.1](https://github.com/nuxt/consola/compare/v2.7.0...v2.7.1) (2019-05-26)


### Bug Fixes

* **browser:** hide `:` with tag and normal log ([8250d5a](https://github.com/nuxt/consola/commit/8250d5a))



## [2.7.0](https://github.com/nuxt/consola/compare/v2.6.2...v2.7.0) (2019-05-26)


### Bug Fixes

* correctly calculate line width when using grave accent ([bad52bd](https://github.com/nuxt/consola/commit/bad52bd))


### Features

* always hide right side on width < 80 ([07d8246](https://github.com/nuxt/consola/commit/07d8246))
* improve basic logs ([ea6ce59](https://github.com/nuxt/consola/commit/ea6ce59))
* **browser:** fancier logs ([b64f337](https://github.com/nuxt/consola/commit/b64f337))
* hide time from basic logger as it is commonly used in CI environments ([68c3bae](https://github.com/nuxt/consola/commit/68c3bae))
* smart hide time and tag when there is no space ([00a375f](https://github.com/nuxt/consola/commit/00a375f))



### [2.6.2](https://github.com/nuxt/consola/compare/v2.6.1...v2.6.2) (2019-05-15)


### Bug Fixes

* transpile browser dist to ES5 ([1f81eea](https://github.com/nuxt/consola/commit/1f81eea)), closes [nuxt/nuxt.js#5743](https://github.com/nuxt/consola/issues/5743)



### [2.6.1](https://github.com/nuxt/consola/compare/v2.6.0...v2.6.1) (2019-05-08)


### Bug Fixes

* **browser:** use `console.warn` when possible ([#49](https://github.com/nuxt/consola/issues/49)) ([e386ede](https://github.com/nuxt/consola/commit/e386ede))



# [2.6.0](https://github.com/nuxt/consola/compare/v2.5.8...v2.6.0) (2019-04-12)


### Features

* expose constructor and reporters ([3a8f662](https://github.com/nuxt/consola/commit/3a8f662))



## [2.5.8](https://github.com/nuxt/consola/compare/v2.5.7...v2.5.8) (2019-03-29)


### Bug Fixes

* **types:** allow passing extra arguments ([#46](https://github.com/nuxt/consola/issues/46)) ([d29fc46](https://github.com/nuxt/consola/commit/d29fc46))



## [2.5.7](https://github.com/nuxt/consola/compare/v2.5.6...v2.5.7) (2019-03-19)


### Bug Fixes

* **formatting:** fix formatting when multiple back-quotes ([#44](https://github.com/nuxt/consola/issues/44)) ([669a12e](https://github.com/nuxt/consola/commit/669a12e))



## [2.5.6](https://github.com/nuxt/consola/compare/v2.5.5...v2.5.6) (2019-02-25)


### Bug Fixes

* **ts:** revert export consola ts declarations ([#43](https://github.com/nuxt/consola/issues/43)) ([6bd4f85](https://github.com/nuxt/consola/commit/6bd4f85))



<a name="2.4.1"></a>
## [2.4.1](https://github.com/nuxt/consola/compare/v2.4.0...v2.4.1) (2019-02-12)


### Bug Fixes

* **ts:** set type "any" ([#40](https://github.com/nuxt/consola/issues/40)) ([ea9d551](https://github.com/nuxt/consola/commit/ea9d551))



<a name="2.4.0"></a>
# [2.4.0](https://github.com/nuxt/consola/compare/v2.3.2...v2.4.0) (2019-02-05)


### Bug Fixes

* **esm:** fix esm compatibility ([8ddecc3](https://github.com/nuxt/consola/commit/8ddecc3))
* **consola:** return `this` in setReporters ([544a887](https://github.com/nuxt/consola/commit/544a887))
* **types:** set message type to "any" ([#39](https://github.com/nuxt/consola/issues/39)) ([ff97b09](https://github.com/nuxt/consola/commit/ff97b09)), closes [#38](https://github.com/nuxt/consola/issues/38)

### Features

* **types:** update types ([d0d7455](https://github.com/nuxt/consola/commit/d0d7455))



<a name="2.3.2"></a>
## [2.3.2](https://github.com/nuxt/consola/compare/v2.3.1...v2.3.2) (2019-01-06)


### Bug Fixes

* **types:** add some of the missing types ([#35](https://github.com/nuxt/consola/issues/35)) ([5e3e69b](https://github.com/nuxt/consola/commit/5e3e69b))
* ignore winston dep in webpack ([#37](https://github.com/nuxt/consola/issues/37)) ([e534a28](https://github.com/nuxt/consola/commit/e534a28))



<a name="2.3.1"></a>
## [2.3.1](https://github.com/nuxt/consola/compare/v2.3.0...v2.3.1) (2019-01-02)


### Bug Fixes

* bypass webpack for lazy required version of winston ([500b509](https://github.com/nuxt/consola/commit/500b509))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/nuxt/consola/compare/v2.2.6...v2.3.0) (2018-11-19)


### Bug Fixes

* **isLogObj:** handle non-standard error objects ([8748c81](https://github.com/nuxt/consola/commit/8748c81))


### Features

* browser reporter improvements ([591d0b4](https://github.com/nuxt/consola/commit/591d0b4)), closes [#31](https://github.com/nuxt/consola/issues/31)
* **fancy:** look like jest traces ([ecae238](https://github.com/nuxt/consola/commit/ecae238))



<a name="2.2.6"></a>
## [2.2.6](https://github.com/nuxt/consola/compare/v2.2.5...v2.2.6) (2018-11-14)


### Bug Fixes

* **json-reporter:** add a default value to the constructor ([#33](https://github.com/nuxt/consola/issues/33)) ([c59db36](https://github.com/nuxt/consola/commit/c59db36))



<a name="2.2.5"></a>
## [2.2.5](https://github.com/nuxt/consola/compare/v2.2.4...v2.2.5) (2018-11-14)


### Bug Fixes

* expose typescript typings ([f0398ed](https://github.com/nuxt/consola/commit/f0398ed))



<a name="2.2.4"></a>
## [2.2.4](https://github.com/nuxt/consola/compare/v2.2.3...v2.2.4) (2018-11-08)


### Bug Fixes

* use basic reporter only for ci and test environments ([33220e4](https://github.com/nuxt/consola/commit/33220e4))



<a name="2.2.3"></a>
## [2.2.3](https://github.com/nuxt/consola/compare/v2.2.2...v2.2.3) (2018-11-07)


### Bug Fixes

* **fancy:** honor logObj.icon ([d56fa38](https://github.com/nuxt/consola/commit/d56fa38))



<a name="2.2.2"></a>
## [2.2.2](https://github.com/nuxt/consola/compare/v2.2.1...v2.2.2) (2018-11-04)


### Bug Fixes

* update std-env to 2.1.1 ([32a9c67](https://github.com/nuxt/consola/commit/32a9c67))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/nuxt/consola/compare/v2.2.0...v2.2.1) (2018-11-04)


### Bug Fixes

* remove file:// from error stack traces ([ff24b69](https://github.com/nuxt/consola/commit/ff24b69))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/nuxt/consola/compare/v2.1.1...v2.2.0) (2018-11-04)


### Bug Fixes

* correctly handle falsy values ([367fb19](https://github.com/nuxt/consola/commit/367fb19))


### Features

* support formatOptions. resolves [#29](https://github.com/nuxt/consola/issues/29). ([7ed640f](https://github.com/nuxt/consola/commit/7ed640f))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/nuxt/consola/compare/v2.1.0...v2.1.1) (2018-11-03)


### Bug Fixes

* add legacy ready and start levels for more backward compatibility ([f54b5c2](https://github.com/nuxt/consola/commit/f54b5c2))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/nuxt/consola/compare/v2.0.9...v2.1.0) (2018-11-03)


### Features

* add aliases ([cbea7bd](https://github.com/nuxt/consola/commit/cbea7bd))
* mockTypes for easy mocking ([a332890](https://github.com/nuxt/consola/commit/a332890))



<a name="2.0.9"></a>
## [2.0.9](https://github.com/nuxt/consola/compare/v2.0.8...v2.0.9) (2018-11-03)



<a name="2.0.8"></a>
## [2.0.8](https://github.com/nuxt/consola/compare/v2.0.7...v2.0.8) (2018-11-03)



<a name="2.0.7"></a>
## [2.0.7](https://github.com/nuxt/consola/compare/v2.0.6...v2.0.7) (2018-11-02)


### Bug Fixes

* always use computed values for stdout/stderr ([f91abc0](https://github.com/nuxt/consola/commit/f91abc0))



<a name="2.0.6"></a>
## [2.0.6](https://github.com/nuxt/consola/compare/v2.0.5...v2.0.6) (2018-11-02)



<a name="2.0.5"></a>
## [2.0.5](https://github.com/nuxt/consola/compare/v2.0.4...v2.0.5) (2018-11-02)



<a name="2.0.4"></a>
## [2.0.4](https://github.com/nuxt/consola/compare/v2.0.3...v2.0.4) (2018-11-02)


### Bug Fixes

* **fancy:** remove extra icons ([b66fde0](https://github.com/nuxt/consola/commit/b66fde0))



<a name="2.0.3"></a>
## [2.0.3](https://github.com/nuxt/consola/compare/v2.0.2...v2.0.3) (2018-11-02)


### Bug Fixes

* **pkg:** exclude src from package ([4b1fb7d](https://github.com/nuxt/consola/commit/4b1fb7d))
* use live console._stdout bindings for default stream ([d9573c3](https://github.com/nuxt/consola/commit/d9573c3))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/nuxt/consola/compare/v2.0.1...v2.0.2) (2018-11-02)


### Bug Fixes

* **error:** always strip first line from stack ([3afa9aa](https://github.com/nuxt/consola/commit/3afa9aa))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/nuxt/consola/compare/v2.0.0...v2.0.1) (2018-11-02)


### Bug Fixes

* **fancy:** use proper color for log paths ([7c75283](https://github.com/nuxt/consola/commit/7c75283))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/nuxt/consola/compare/v2.0.0-2...v2.0.0) (2018-11-02)



<a name="2.0.0-2"></a>
# [2.0.0-2](https://github.com/nuxt/consola/compare/v2.0.0-1...v2.0.0-2) (2018-11-02)


### Bug Fixes

* add methods for legacy support ([4bdd034](https://github.com/nuxt/consola/commit/4bdd034))
* preserve additional new lines ([340a001](https://github.com/nuxt/consola/commit/340a001))
* update std-env to 2.1.0 ([2dc2a50](https://github.com/nuxt/consola/commit/2dc2a50))


### Features

* support badge with fancy ([38600fe](https://github.com/nuxt/consola/commit/38600fe))



<a name="2.0.0-1"></a>
# [2.0.0-1](https://github.com/nuxt/consola/compare/v2.0.0-0...v2.0.0-1) (2018-10-31)



<a name="2.0.0-0"></a>
# [2.0.0-0](https://github.com/nuxt/consola/compare/v1.4.4...v2.0.0-0) (2018-10-31)


### Bug Fixes

* add schmance.js ([2929648](https://github.com/nuxt/consola/commit/2929648))
* **docs:** update readme ([#22](https://github.com/nuxt/consola/issues/22)) ([e75f2a0](https://github.com/nuxt/consola/commit/e75f2a0))
* add default/undefined color for browser ([39584d2](https://github.com/nuxt/consola/commit/39584d2))
* add missing parseStack import ([da53dee](https://github.com/nuxt/consola/commit/da53dee))
* also copy symbols in assignGlobalReference ([b0eefb5](https://github.com/nuxt/consola/commit/b0eefb5))
* don't return this when calling log functions ([f07e056](https://github.com/nuxt/consola/commit/f07e056))
* fix badge display ([e036eed](https://github.com/nuxt/consola/commit/e036eed))
* fix main field ([4b56e48](https://github.com/nuxt/consola/commit/4b56e48))
* fix typos ([45e2f99](https://github.com/nuxt/consola/commit/45e2f99))
* handle null value of obj for assignToLogObj ([d2402af](https://github.com/nuxt/consola/commit/d2402af))
* improve browser packaging ([4d8c8d0](https://github.com/nuxt/consola/commit/4d8c8d0))
* lint ([f909761](https://github.com/nuxt/consola/commit/f909761))
* lint ([d976620](https://github.com/nuxt/consola/commit/d976620))
* only one color ending parameter is enough ([d213634](https://github.com/nuxt/consola/commit/d213634))
* readme: icon string length is digit ([31f1894](https://github.com/nuxt/consola/commit/31f1894))
* remove name assignment ([8d59075](https://github.com/nuxt/consola/commit/8d59075))
* remove pushes for better readability ([418d84a](https://github.com/nuxt/consola/commit/418d84a))
* rename private fields ([244fe5c](https://github.com/nuxt/consola/commit/244fe5c))
* rename require test file ([cfc8f9e](https://github.com/nuxt/consola/commit/cfc8f9e))
* return earlier on not displaying levels ([cfdcf04](https://github.com/nuxt/consola/commit/cfdcf04))
* support Error as logObject ([134ff54](https://github.com/nuxt/consola/commit/134ff54))
* text color comment ([9336fbc](https://github.com/nuxt/consola/commit/9336fbc))
* update demo ([3842e0e](https://github.com/nuxt/consola/commit/3842e0e))
* use symbols for private property access ([8e6343c](https://github.com/nuxt/consola/commit/8e6343c))


### Code Refactoring

* additionalStyle ~> additionalColor ([3f808e9](https://github.com/nuxt/consola/commit/3f808e9))


### Features

* add __VERSION__ to consola prototype ([982c8ca](https://github.com/nuxt/consola/commit/982c8ca))
* add assignGlobalConsola helper ([1af28f7](https://github.com/nuxt/consola/commit/1af28f7))
* add getter/setter for level ([7af5ed5](https://github.com/nuxt/consola/commit/7af5ed5))
* add global.consola ([4da784d](https://github.com/nuxt/consola/commit/4da784d))
* add shmancy reporter ([dc6121a](https://github.com/nuxt/consola/commit/dc6121a))
* add symbols to browser ([30cd4f0](https://github.com/nuxt/consola/commit/30cd4f0))
* add sync/async write ([8525525](https://github.com/nuxt/consola/commit/8525525))
* add typescript typings ([#24](https://github.com/nuxt/consola/issues/24)) ([0853a6f](https://github.com/nuxt/consola/commit/0853a6f))
* align basic and fancy reporter tags ([38a4729](https://github.com/nuxt/consola/commit/38a4729))
* better stack formater ([f5acb3c](https://github.com/nuxt/consola/commit/f5acb3c))
* detect version changes and throw a warning ([73bdd1a](https://github.com/nuxt/consola/commit/73bdd1a))
* improve packaging and exports ([90da862](https://github.com/nuxt/consola/commit/90da862))
* improve packaging for browser support ([47af1df](https://github.com/nuxt/consola/commit/47af1df))
* initial works for v2.0.0 ([455b6f9](https://github.com/nuxt/consola/commit/455b6f9))
* log formatting using printf ([2afb025](https://github.com/nuxt/consola/commit/2afb025))
* no more side effects ([c015c31](https://github.com/nuxt/consola/commit/c015c31))
* pause/resume ([f217cc1](https://github.com/nuxt/consola/commit/f217cc1))
* return new consola instance with consola.create ([4ae3614](https://github.com/nuxt/consola/commit/4ae3614))
* rework _createLogFn with better argument handling ([2d4af39](https://github.com/nuxt/consola/commit/2d4af39))
* scope inheritance support ([#23](https://github.com/nuxt/consola/issues/23)) ([0070c54](https://github.com/nuxt/consola/commit/0070c54))
* **fancy/basic:** support logObj.stack field ([aa2216f](https://github.com/nuxt/consola/commit/aa2216f))
* setReporters, withDefaults and withTag ([912446f](https://github.com/nuxt/consola/commit/912446f))
* showType option ([ed294e4](https://github.com/nuxt/consola/commit/ed294e4))
* style browser reporter ([d39684d](https://github.com/nuxt/consola/commit/d39684d))
* support all chalk colors ([2cec678](https://github.com/nuxt/consola/commit/2cec678)), closes [#20](https://github.com/nuxt/consola/issues/20)
* wrapConsole ([3962a1f](https://github.com/nuxt/consola/commit/3962a1f))
* wrapStd ([f8bfbeb](https://github.com/nuxt/consola/commit/f8bfbeb))
* write error and warns to process.stderr by default ([6565254](https://github.com/nuxt/consola/commit/6565254))


### Performance Improvements

* **basic:** refactor getWriteMethod ([c52db69](https://github.com/nuxt/consola/commit/c52db69))
* remove all DEPRECATED helpers for less bundle size ([fe39d37](https://github.com/nuxt/consola/commit/fe39d37))


### BREAKING CHANGES

* Use new additionalColor prop
* lot's of internals had been changed.
* Behavior may be changed in some conditions



<a name="1.4.4"></a>
## [1.4.4](https://github.com/nuxt/consola/compare/v1.4.3...v1.4.4) (2018-10-13)


### Bug Fixes

* add global.consola ([558cae5](https://github.com/nuxt/consola/commit/558cae5))



<a name="1.4.3"></a>
## [1.4.3](https://github.com/nuxt/consola/compare/v1.4.2...v1.4.3) (2018-08-18)


### Bug Fixes

* use more compatible string to clear the console ([82ce410](https://github.com/nuxt/consola/commit/82ce410))



<a name="1.4.2"></a>
## [1.4.2](https://github.com/nuxt/consola/compare/v1.4.1...v1.4.2) (2018-08-12)


### Bug Fixes

* cannot set level as 0 in options ([4c1ecce](https://github.com/nuxt/consola/commit/4c1ecce))



<a name="1.4.1"></a>
## [1.4.1](https://github.com/nuxt/consola/compare/v1.4.0...v1.4.1) (2018-05-27)


### Bug Fixes

* **fancy:** logObj.type ([418be28](https://github.com/nuxt/consola/commit/418be28))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/nuxt/consola/compare/v1.3.0...v1.4.0) (2018-05-27)


### Features

* support custom additional style ([#18](https://github.com/nuxt/consola/issues/18)) ([7a750bf](https://github.com/nuxt/consola/commit/7a750bf))
* **fancy:** support icon field ([0123bed](https://github.com/nuxt/consola/commit/0123bed))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/nuxt/consola/compare/v1.2.0...v1.3.0) (2018-04-15)


### Bug Fixes

* **reporters/fancy:** extra space for additional ([efeab44](https://github.com/nuxt/consola/commit/efeab44))
* prevent duplicate consola instances when different versions used by packages ([0bce262](https://github.com/nuxt/consola/commit/0bce262))


### Features

* support extra log arguments ([8b6d3d2](https://github.com/nuxt/consola/commit/8b6d3d2))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/nuxt/consola/compare/v1.1.4...v1.2.0) (2018-04-02)


### Features

* **basic:** support additional field ([b50cad8](https://github.com/nuxt/consola/commit/b50cad8))
* improve packaging ([158e8ef](https://github.com/nuxt/consola/commit/158e8ef))


### Performance Improvements

* require needed lodash methods only ([91065e4](https://github.com/nuxt/consola/commit/91065e4))



<a name="1.1.4"></a>
## [1.1.4](https://github.com/nuxt/consola/compare/v1.1.3...v1.1.4) (2018-03-31)


### Bug Fixes

* **package:** add chalk to dependencies ([3f738e9](https://github.com/nuxt/consola/commit/3f738e9))



<a name="1.1.3"></a>
## [1.1.3](https://github.com/nuxt/consola/compare/v1.1.2...v1.1.3) (2018-03-31)


### Bug Fixes

* only include dist and src in package ([8b477ec](https://github.com/nuxt/consola/commit/8b477ec))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/nuxt/consola/compare/v1.1.1...v1.1.2) (2018-03-31)


### Bug Fixes

* handle null and undefined calls ([1f98bb1](https://github.com/nuxt/consola/commit/1f98bb1))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/nuxt/consola/compare/v1.1.0...v1.1.1) (2018-03-31)


### Bug Fixes

* add prepublish script ([8dd8700](https://github.com/nuxt/consola/commit/8dd8700))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/nuxt/consola/compare/v1.0.0...v1.1.0) (2018-03-31)


### Features

* rewrite FancyReporter without ora ([73c1ddc](https://github.com/nuxt/consola/commit/73c1ddc))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/nuxt/consola/compare/v0.1.0...v1.0.0) (2018-03-31)



<a name="0.1.0"></a>
# 0.1.0 (2018-03-31)


### Features

* add log type for console compability ([96a8162](https://github.com/nuxt/consola/commit/96a8162))
