import 'package:immich_data/data_controller.dart';
import 'package:immich_data/store/activity.dart';
import 'package:riverpod/riverpod.dart';

/// Global data layer, providing access to Drift and HTTP APIs, scoped by entity
// TODO(rewrite): Possibly codegen?
abstract final class Store {
  static Override overrideWithValue(DataController dataController) =>
      dataControllerProvider.overrideWithValue(dataController);

  static final people = _store((c) => c.people);

  static final activity = ActivityStore.instance;

  /// Direct database access for the repositories that have not yet moved into `immich_data`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `immich_data`
  static final db = _store((c) => c.db);

  // ----- Internal -----

  static ProviderListenable<T> _store<T>(T Function(DataController) get) => dataControllerProvider.select(get);
}
