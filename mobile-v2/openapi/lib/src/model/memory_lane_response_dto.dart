//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'memory_lane_response_dto.g.dart';

/// MemoryLaneResponseDto
///
/// Properties:
/// * [assets] 
/// * [title] 
/// * [yearsAgo] 
@BuiltValue()
abstract class MemoryLaneResponseDto implements Built<MemoryLaneResponseDto, MemoryLaneResponseDtoBuilder> {
  @BuiltValueField(wireName: r'assets')
  BuiltList<AssetResponseDto> get assets;

  @Deprecated('title has been deprecated')
  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'yearsAgo')
  int get yearsAgo;

  MemoryLaneResponseDto._();

  factory MemoryLaneResponseDto([void updates(MemoryLaneResponseDtoBuilder b)]) = _$MemoryLaneResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MemoryLaneResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MemoryLaneResponseDto> get serializer => _$MemoryLaneResponseDtoSerializer();
}

class _$MemoryLaneResponseDtoSerializer implements PrimitiveSerializer<MemoryLaneResponseDto> {
  @override
  final Iterable<Type> types = const [MemoryLaneResponseDto, _$MemoryLaneResponseDto];

  @override
  final String wireName = r'MemoryLaneResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MemoryLaneResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assets';
    yield serializers.serialize(
      object.assets,
      specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'yearsAgo';
    yield serializers.serialize(
      object.yearsAgo,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MemoryLaneResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MemoryLaneResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetResponseDto)]),
          ) as BuiltList<AssetResponseDto>;
          result.assets.replace(valueDes);
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'yearsAgo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.yearsAgo = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MemoryLaneResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MemoryLaneResponseDtoBuilder();
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

