//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_ids_dto.g.dart';

/// AssetIdsDto
///
/// Properties:
/// * [assetIds] 
@BuiltValue()
abstract class AssetIdsDto implements Built<AssetIdsDto, AssetIdsDtoBuilder> {
  @BuiltValueField(wireName: r'assetIds')
  BuiltList<String> get assetIds;

  AssetIdsDto._();

  factory AssetIdsDto([void updates(AssetIdsDtoBuilder b)]) = _$AssetIdsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetIdsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetIdsDto> get serializer => _$AssetIdsDtoSerializer();
}

class _$AssetIdsDtoSerializer implements PrimitiveSerializer<AssetIdsDto> {
  @override
  final Iterable<Type> types = const [AssetIdsDto, _$AssetIdsDto];

  @override
  final String wireName = r'AssetIdsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetIdsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetIds';
    yield serializers.serialize(
      object.assetIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetIdsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetIdsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.assetIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetIdsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetIdsDtoBuilder();
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

