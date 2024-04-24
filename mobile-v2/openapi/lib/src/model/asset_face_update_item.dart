//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_face_update_item.g.dart';

/// AssetFaceUpdateItem
///
/// Properties:
/// * [assetId] 
/// * [personId] 
@BuiltValue()
abstract class AssetFaceUpdateItem implements Built<AssetFaceUpdateItem, AssetFaceUpdateItemBuilder> {
  @BuiltValueField(wireName: r'assetId')
  String get assetId;

  @BuiltValueField(wireName: r'personId')
  String get personId;

  AssetFaceUpdateItem._();

  factory AssetFaceUpdateItem([void updates(AssetFaceUpdateItemBuilder b)]) = _$AssetFaceUpdateItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetFaceUpdateItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetFaceUpdateItem> get serializer => _$AssetFaceUpdateItemSerializer();
}

class _$AssetFaceUpdateItemSerializer implements PrimitiveSerializer<AssetFaceUpdateItem> {
  @override
  final Iterable<Type> types = const [AssetFaceUpdateItem, _$AssetFaceUpdateItem];

  @override
  final String wireName = r'AssetFaceUpdateItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetFaceUpdateItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetId';
    yield serializers.serialize(
      object.assetId,
      specifiedType: const FullType(String),
    );
    yield r'personId';
    yield serializers.serialize(
      object.personId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetFaceUpdateItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetFaceUpdateItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetId = valueDes;
          break;
        case r'personId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.personId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetFaceUpdateItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetFaceUpdateItemBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

