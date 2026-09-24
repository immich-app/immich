import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/data_controller.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/store/activity.dart';
import 'package:immich_mobile/data/store/ocr.dart';
import 'package:immich_mobile/data/store/person.dart';
import 'package:immich_mobile/data/store/tag.dart';
import 'package:immich_mobile/data/store/user_metadata.dart';
import 'package:immich_mobile/services/api.service.dart';

final _apiServiceProvider = Provider<ApiService>(
  (ref) => throw UnimplementedError("ApiService instance must be set via Store.overrideWith"),
);

/// Global data layer, providing access to Drift and HTTP APIs, scoped by entity
abstract final class Store {
  static List<Override> overrideWith({required DataController dataController, required ApiService apiService}) => [
    DataController.all.overrideWithValue(dataController),
    _apiServiceProvider.overrideWithValue(apiService),
  ];

  @visibleForTesting
  static List<Override> overrideForTest({DataController? dataController, ApiService? apiService}) => [
    if (dataController != null) DataController.all.overrideWithValue(dataController),
    if (apiService != null) _apiServiceProvider.overrideWithValue(apiService),
  ];

  /// Direct database access for the repositories that have not yet been migrated to `Store`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `Store`
  static final db = Provider<Drift>((ref) => ref.watch(DataController.all).db);

  /// Direct API access for the repositories that have not yet been migrated to `Store`
  // TODO(rewrite): Remove this provider once all repositories have migrated to `Store`
  static final api = Provider<ApiService>((ref) => ref.watch(_apiServiceProvider));

  // ----

  static final activity = ActivityStore.instance;
  static final ocr = OcrStore.instance;
  static final people = PersonStore.instance;
  static final tags = TagStore.instance;

  static final userMetadata = UserMetadataStore.instance;
}
