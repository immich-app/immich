import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/data_controller.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/store/activity.dart';
import 'package:immich_mobile/data/store/person.dart';
import 'package:immich_mobile/services/api.service.dart';

/// The [DataController] backing this container's store
///
/// Must be overridden with a constructed instance (`Store.overrideWithValue`)
final _dataControllerProvider = Provider<DataController>(
  (ref) => throw UnimplementedError("DataController instance must be set via Store.overrideWith"),
);

final _apiServiceProvider = Provider<ApiService>(
  (ref) => throw UnimplementedError("ApiService instance must be set via Store.overrideWith"),
);

/// Global data layer, providing access to Drift and HTTP APIs, scoped by entity
abstract final class Store {
  static List<Override> overrideWith({required DataController dataController, ApiService? apiService}) => [
    _dataControllerProvider.overrideWithValue(dataController),
    _apiServiceProvider.overrideWithValue(apiService ?? ApiService()),
  ];

  /// Direct database access for the repositories that have not yet been migrated to `Store`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `Store`
  static final db = Provider<Drift>((ref) => ref.watch(_dataControllerProvider).db);

  /// Direct API access for the repositories that have not yet been migrated to `Store`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `Store`
  static final api = Provider<ApiService>((ref) => ref.watch(_apiServiceProvider));

  // ----

  static final people = PersonStore.instance;

  static final activity = ActivityStore.instance;
}
