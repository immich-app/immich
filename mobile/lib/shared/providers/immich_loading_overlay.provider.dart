import 'package:hooks_riverpod/hooks_riverpod.dart';

class ImmichLoadingOverlayNotifier extends StateNotifier<bool> {
  ImmichLoadingOverlayNotifier() : super(false);

  void show() => state = true;

  void hide() => state = false;
}

final immichLoadingOverlayController =
    StateNotifierProvider.autoDispose<ImmichLoadingOverlayNotifier, bool>(
  (_) => ImmichLoadingOverlayNotifier(),
);
