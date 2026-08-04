import 'package:immich_mobile/providers/infrastructure/data_store.dart';

/// Direct database access for the repositories that have not yet moved into `immich_data`
// TODO(rewrite): Remove this provider once all repositories have migrated to `immich_data`
final driftProvider = Store.db;
