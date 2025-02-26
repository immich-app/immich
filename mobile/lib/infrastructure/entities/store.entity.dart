import 'package:isar/isar.dart';

part 'store.entity.g.dart';

/// Internal class for `Store`, do not use elsewhere.
@Collection(inheritance: false)
class StoreValue {
  const StoreValue(this.id, {this.intValue, this.strValue});
  final Id id;
  final int? intValue;
  final String? strValue;
}
