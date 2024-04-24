//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_face_update_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_face_update_dto.g.dart';

/// AssetFaceUpdateDto
///
/// Properties:
/// * [data] 
@BuiltValue()
abstract class AssetFaceUpdateDto implements Built<AssetFaceUpdateDto, AssetFaceUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'data')
  BuiltList<AssetFaceUpdateItem> get data;

  AssetFaceUpdateDto._();

  factory AssetFaceUpdateDto([void updates(AssetFaceUpdateDtoBuilder b)]) = _$AssetFaceUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetFaceUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetFaceUpdateDto> get serializer => _$AssetFaceUpdateDtoSerializer();
}

class _$AssetFaceUpdateDtoSerializer implements PrimitiveSerializer<AssetFaceUpdateDto> {
  @override
  final Iterable<Type> types = const [AssetFaceUpdateDto, _$AssetFaceUpdateDto];

  @override
  final String wireName = r'AssetFaceUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetFaceUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(BuiltList, [FullType(AssetFaceUpdateItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetFaceUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetFaceUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetFaceUpdateItem)]),
          ) as BuiltList<AssetFaceUpdateItem>;
          result.data.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetFaceUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetFaceUpdateDtoBuilder();
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

