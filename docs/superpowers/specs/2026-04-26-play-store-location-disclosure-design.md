# Play Store Location Disclosure Design

## Context

Google Play rejected the Android app for an inadequate prominent disclosure under the User Data policy. The rejection says the in-app disclosure does not disclose the usage of accessed or collected location data.

The mobile app currently requests Android location permissions in two visible flows:

- Map/current-location features call `MapUtils.checkPermAndGetLocation()` before reading the device's current location.
- Automatic endpoint switching asks for foreground and background location permission so Android allows the app to read the current Wi-Fi network name.

Both flows already show an in-app dialog before requesting permission, but the wording is not explicit enough for Play review. The map copy says location permission is needed, but does not clearly disclose precise current location access or how it is used. The networking dialogs explain Wi-Fi-name access, but the consent UI only offers a grant action and no clear decline action.

## Goal

Make Android location disclosures clear, prominent, and immediately actionable before each runtime permission request.

The disclosure should tell users:

- The app accesses device location data.
- Whether the use is current/precise location or background location.
- Why the data is used in the feature.
- That the request happens only after an affirmative user action.

## Design

Keep the existing location-dependent features and update their permission flows.

For map/current-location requests:

- Update the map permission disclosure text to explicitly say Noodle Gallery accesses the device's precise current location.
- State that the location is used to center the map and show assets from the current area.
- Keep the existing cancel and allow actions. The app should only call `Geolocator.requestPermission()` if the user taps the allow action.

For automatic endpoint switching:

- Add a cancel/decline action to the foreground and background location disclosure dialogs.
- Update foreground disclosure copy to say precise location permission is used to read the current Wi-Fi network name for automatic server switching.
- Update background disclosure copy to say background location permission lets the app continue reading the Wi-Fi network name while automatic server switching runs in the background.
- Keep the existing behavior of opening app settings if background permission is denied after an explicit request.

## Scope

In scope:

- `i18n/en.json`
- Generated mobile localization files
- `mobile/lib/presentation/widgets/map/map_utils.dart`
- `mobile/lib/utils/map_utils.dart`
- `mobile/lib/widgets/settings/networking_settings/networking_settings.dart`
- Focused mobile tests for disclosure copy and consent behavior where practical

Out of scope:

- Removing any Android location permission from the manifest
- Reworking automatic endpoint switching
- Changing server, web, or iOS behavior
- Rewriting the privacy policy or Play Console data safety form

## Testing

Use focused Flutter tests first:

- Verify the map disclosure contains explicit location-data usage wording.
- Verify the networking disclosure dialog has both decline and grant actions.
- Verify declining the networking disclosure does not request permission.

Then run targeted mobile tests and Dart analysis if feasible in the worktree.

## Risks

Google Play policy review is ultimately manual and may flag other screens or Play Console metadata. This change addresses the in-app prominent disclosure issue identified in the rejection, but the Play Console Data safety form and privacy policy should still match the app's actual location access.
