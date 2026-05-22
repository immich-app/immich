import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Tracks per-asset upload progress.
/// Key: local asset ID, Value: upload progress 0.0 to 1.0, or -1.0 for error
class AssetUploadProgressNotifier extends Notifier<Map<String, double>> {
  static const double errorValue = -1.0;

  @override
  Map<String, double> build() => {};

  void setProgress(String localAssetId, double progress) {
    state = {...state, localAssetId: progress};
  }

  void setError(String localAssetId) {
    state = {...state, localAssetId: errorValue};
  }

  void remove(String localAssetId) {
    state = Map.from(state)..remove(localAssetId);
  }

  void clear() {
    state = {};
  }
}

final assetUploadProgressProvider = NotifierProvider<AssetUploadProgressNotifier, Map<String, double>>(
  AssetUploadProgressNotifier.new,
);

final manualUploadCancelTokenProvider = StateProvider<Completer<void>?>((ref) => null);
