import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class VersionAnnouncementOverlay extends StatelessWidget {
  const VersionAnnouncementOverlay({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
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
                        padding: const EdgeInsets.all(24.0),
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
                                text: const TextSpan(
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontFamily: 'WorkSans',
                                    color: Colors.black87,
                                  ),
                                  children: <TextSpan>[
                                    TextSpan(
                                      text:
                                          'Hi friend, there is a new release of, Hi friend, there is a new release of, Hi friend, there is a new release of, Hi friend, there is a new release of',
                                    ),
                                    TextSpan(text: ' world!'),
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
