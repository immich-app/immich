import 'package:hive/hive.dart';
part 'hive_asset_type_enum_info.model.g.dart';

@HiveType(typeId: 4)
class HiveAssetTypeEnum {
  /// The underlying value of this enum member.
  @HiveField(0)
  final String value;

  HiveAssetTypeEnum({required this.value});
}
