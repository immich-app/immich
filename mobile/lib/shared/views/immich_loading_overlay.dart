import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class ImmichLoadingOverlay extends StatelessWidget {
  const ImmichLoadingOverlay({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable:
          ImmichLoadingOverlayController.appLoader.loaderShowingNotifier,
      builder: (context, shouldShow, child) {
        return shouldShow
            ? const Scaffold(
                backgroundColor: Colors.black54,
                body: Center(
                  child: ImmichLoadingIndicator(),
                ),
              )
            : const SizedBox();
      },
    );
  }
}

class ImmichLoadingOverlayController {
  static final ImmichLoadingOverlayController appLoader =
      ImmichLoadingOverlayController();
  ValueNotifier<bool> loaderShowingNotifier = ValueNotifier(false);
  ValueNotifier<String> loaderTextNotifier = ValueNotifier('error message');

  void show() {
    loaderShowingNotifier.value = true;
  }

  void hide() {
    loaderShowingNotifier.value = false;
  }
}
