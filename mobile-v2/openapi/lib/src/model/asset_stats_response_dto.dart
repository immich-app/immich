//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_stats_response_dto.g.dart';

/// AssetStatsResponseDto
///
/// Properties:
/// * [images] 
/// * [total] 
/// * [videos] 
@BuiltValue()
abstract class AssetStatsResponseDto implements Built<AssetStatsResponseDto, AssetStatsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'images')
  int get images;

  @BuiltValueField(wireName: r'total')
  int get total;

  @BuiltValueField(wireName: r'videos')
  int get videos;

  AssetStatsResponseDto._();

  factory AssetStatsResponseDto([void updates(AssetStatsResponseDtoBuilder b)]) = _$AssetStatsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetStatsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetStatsResponseDto> get serializer => _$AssetStatsResponseDtoSerializer();
}

class _$AssetStatsResponseDtoSerializer implements PrimitiveSerializer<AssetStatsResponseDto> {
  @override
  final Iterable<Type> types = const [AssetStatsResponseDto, _$AssetStatsResponseDto];

  @override
  final String wireName = r'AssetStatsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'images';
    yield serializers.serialize(
      object.images,
      specifiedType: const FullType(int),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
    yield r'videos';
    yield serializers.serialize(
      object.videos,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetStatsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'images':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.images = valueDes;
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        case r'videos':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.videos = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetStatsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetStatsResponseDtoBuilder();
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

