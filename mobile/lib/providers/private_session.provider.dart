import 'dart:async';

import 'package:flutter/painting.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/pin.dart';
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';

final privateSessionProvider = StateNotifierProvider<PrivateSession, bool>((ref) {
  final session = PrivateSession(ref.watch(pinApiRepositoryProvider));
  ref.listen(appStateProvider, (_, state) {
    if (state == AppLifeCycleEnum.paused || state == AppLifeCycleEnum.detached) {
      unawaited(session.lock());
    }
  });
  ref.listen(authProvider.select((auth) => auth.isAuthenticated), (_, authenticated) {
    if (!authenticated) {
      session.clear();
    }
  });
  return session;
});

final privateContentVisibleProvider = Provider<bool>((ref) {
  final unlocked = ref.watch(privateSessionProvider);
  final lifecycle = ref.watch(appStateProvider);
  return unlocked && (lifecycle == AppLifeCycleEnum.active || lifecycle == AppLifeCycleEnum.resumed);
});

class PrivateSession extends StateNotifier<bool> {
  PrivateSession(this._api) : super(false);

  final PinApiRepository _api;
  Timer? _expiry;
  int _revision = 0;

  Future<bool> activate() async {
    final revision = ++_revision;
    final status = await _api.getPinStatus();
    final expires = status.expiresAt;
    if (!mounted || revision != _revision) {
      return false;
    }
    if (expires == null) {
      clear();
      return false;
    }
    final remaining = expires.difference(DateTime.now());
    if (remaining <= Duration.zero) {
      clear();
      return false;
    }
    _expiry?.cancel();
    _expiry = Timer(remaining, clear);
    state = true;
    return true;
  }

  Future<void> revalidate() async {
    if (!state) {
      return;
    }
    try {
      await activate();
    } on Exception {
      if (mounted) {
        clear();
      }
    }
  }

  Future<void> lock() async {
    final wasUnlocked = state;
    clear();
    if (wasUnlocked) {
      try {
        await _api.lockPinCode();
      } on Exception {
        return;
      }
    }
  }

  void clear() {
    _revision++;
    _expiry?.cancel();
    if (state) {
      state = false;
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();
    }
  }

  @override
  void dispose() {
    _expiry?.cancel();
    super.dispose();
  }
}
