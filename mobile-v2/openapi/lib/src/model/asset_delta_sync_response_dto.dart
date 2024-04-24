//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_delta_sync_response_dto.g.dart';

/// AssetDeltaSyncResponseDto
///
/// Properties:
/// * [deleted] 
/// * [needsFullSync] 
/// * [upserted] 
@BuiltValue()
abstract class AssetDeltaSyncResponseDto implements Built<AssetDeltaSyncResponseDto, AssetDeltaSyncResponseDtoBuilder> {
  @BuiltValueField(wireName: r'deleted')
  BuiltList<String> get deleted;

  @BuiltValueField(wireName: r'needsFullSync')
  bool get needsFullSync;

  @BuiltValueField(wireName: r'upserted')
  BuiltList<AssetResponseDto> get upserted;

  AssetDeltaSyncResponseDto._();

  factory AssetDeltaSyncResponseDto([void updates(AssetDeltaSyncResponseDtoBuilder b)]) = _$AssetDeltaSyncResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetDeltaSyncResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetDeltaSyncResponseDto> get serializer => _$AssetDeltaSyncResponseDtoSerializer();
}

class _$AssetDeltaSyncResponseDtoSerializer implements PrimitiveSerializer<AssetDeltaSyncResponseDto> {
  @override
  final Iterable<Type> types = const [AssetDeltaSyncResponseDto, _$AssetDeltaSyncResponseDto];

  @override
  final String wireName = r'AssetDeltaSyncResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetDeltaSyncResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'deleted';
    yield serializers.serialize(
      object.deleted,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'needsFullSync';
    yield serializers.serialize(
      object.needsFullSync,
      specifiedType: const FullType(bool),
    );
    yield r'upserted';
    yield serializers.serialize(
      object.upserted,
      specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetDeltaSyncResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetDeltaSyncResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.deleted.replace(valueDes);
          break;
        case r'needsFullSync':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.needsFullSync = valueDes;
          break;
        case r'upserted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
          ) as BuiltList<AssetResponseDto>;
          result.upserted.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetDeltaSyncResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetDeltaSyncResponseDtoBuilder();
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

