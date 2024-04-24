//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_type_enum.g.dart';

class AssetTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'IMAGE')
  static const AssetTypeEnum IMAGE = _$IMAGE;
  @BuiltValueEnumConst(wireName: r'VIDEO')
  static const AssetTypeEnum VIDEO = _$VIDEO;
  @BuiltValueEnumConst(wireName: r'AUDIO')
  static const AssetTypeEnum AUDIO = _$AUDIO;
  @BuiltValueEnumConst(wireName: r'OTHER')
  static const AssetTypeEnum OTHER = _$OTHER;

  static Serializer<AssetTypeEnum> get serializer => _$assetTypeEnumSerializer;

  const AssetTypeEnum._(String name): super(name);

  static BuiltSet<AssetTypeEnum> get values => _$values;
  static AssetTypeEnum valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AssetTypeEnumMixin = Object with _$AssetTypeEnumMixin;

