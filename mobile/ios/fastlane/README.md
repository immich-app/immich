fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios gha_testflight_dev

```sh
[bundle exec] fastlane ios gha_testflight_dev
```

iOS Development Build to TestFlight (requires separate bundle ID)

### ios gha_release_prod

```sh
[bundle exec] fastlane ios gha_release_prod
```

iOS Release to TestFlight

### ios release_manual

```sh
[bundle exec] fastlane ios release_manual
```

iOS Manual Release

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
