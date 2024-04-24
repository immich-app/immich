//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_order.g.dart';

class AssetOrder extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const AssetOrder asc = _$asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const AssetOrder desc = _$desc;

  static Serializer<AssetOrder> get serializer => _$assetOrderSerializer;

  const AssetOrder._(String name): super(name);

  static BuiltSet<AssetOrder> get values => _$values;
  static AssetOrder valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AssetOrderMixin = Object with _$AssetOrderMixin;

