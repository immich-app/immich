import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class VersionAnnouncementOverlay extends HookConsumerWidget {
  VersionAnnouncementOverlay({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void goToReleaseNote() {
      print("tap this");
    }

    return ValueListenableBuilder<bool>(
      valueListenable:
          VersionAnnouncementOverlayController.appLoader.loaderShowingNotifier,
      builder: (context, shouldShow, child) {
        if (shouldShow) {
          return Scaffold(
            backgroundColor: Colors.black38,
            body: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 350),
                child: Wrap(
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(30.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "New Version Available 🎉",
                              style: TextStyle(
                                fontSize: 16,
                                fontFamily: 'WorkSans',
                                fontWeight: FontWeight.bold,
                                color: Colors.indigo,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: RichText(
                                text: TextSpan(
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontFamily: 'WorkSans',
                                      color: Colors.black87,
                                      height: 1.5),
                                  children: <TextSpan>[
                                    const TextSpan(
                                      text:
                                          'Hi friend, there is a new release of',
                                    ),
                                    const TextSpan(
                                      text: ' Immich ',
                                      style: TextStyle(
                                        fontFamily: "SnowBurstOne",
                                        color: Colors.indigo,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const TextSpan(
                                      text:
                                          "please take your time to visit the ",
                                    ),
                                    TextSpan(
                                      text: "release note",
                                      style: const TextStyle(
                                        decoration: TextDecoration.underline,
                                      ),
                                      recognizer: TapGestureRecognizer()
                                        ..onTap = goToReleaseNote,
                                    ),
                                    const TextSpan(
                                      text:
                                          " and ensure your docker-compose and .env setup is up-to-date to prevent any misconfigurations, especially if you use WatchTower or any mechanism that handles updating your application automatically.",
                                    )
                                  ],
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        } else {
          return Container();
        }
      },
    );
  }
}

class VersionAnnouncementOverlayController {
  static final VersionAnnouncementOverlayController appLoader =
      VersionAnnouncementOverlayController();
  ValueNotifier<bool> loaderShowingNotifier = ValueNotifier(false);
  ValueNotifier<String> loaderTextNotifier = ValueNotifier('error message');

  void show() {
    loaderShowingNotifier.value = true;
  }

  void hide() {
    loaderShowingNotifier.value = false;
  }
}
