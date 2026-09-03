import 'package:immich_mobile/data/store/activity.dart';
import 'package:immich_mobile/data/store/person.dart';

/// Global data layer, providing access to Drift and HTTP APIs, scoped by entity
abstract final class Store {
  static final people = PersonStore.instance;

  static final activity = ActivityStore.instance;
}
