import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_data/data_controller.dart';

// TODO(rewrite): Rename file once `store.provider.dart` is migrated

/// Global data layer, providing access to Drift and HTTP APIs, scoped by entity
// TODO(rewrite): Possibly codegen?
abstract final class Store {
  static Override overrideWithValue(DataController dataController) =>
      _dataControllerProvider.overrideWithValue(dataController);

  static final people = _store((c) => c.people);

  static final activities = _store((c) => c.activities);

  /// Direct database access for the repositories that have not yet moved into `immich_data`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `immich_data`
  static final db = _store((c) => c.db);

  // ----- Internal -----

  static ProviderListenable<T> _store<T>(T Function(DataController) get) => _dataControllerProvider.select(get);

  static final _dataControllerProvider = Provider<DataController>(
    (ref) => throw UnimplementedError(
      "dataControllerProvider must be overridden in the isolate's ProviderContainer before use",
    ),
  );
}
