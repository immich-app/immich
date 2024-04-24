//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_stats_response_dto.g.dart';

/// LibraryStatsResponseDto
///
/// Properties:
/// * [photos] 
/// * [total] 
/// * [usage] 
/// * [videos] 
@BuiltValue()
abstract class LibraryStatsResponseDto implements Built<LibraryStatsResponseDto, LibraryStatsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'photos')
  int get photos;

  @BuiltValueField(wireName: r'total')
  int get total;

  @BuiltValueField(wireName: r'usage')
  int get usage;

  @BuiltValueField(wireName: r'videos')
  int get videos;

  LibraryStatsResponseDto._();

  factory LibraryStatsResponseDto([void updates(LibraryStatsResponseDtoBuilder b)]) = _$LibraryStatsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LibraryStatsResponseDtoBuilder b) => b
      ..photos = 0
      ..total = 0
      ..usage = 0
      ..videos = 0;

  @BuiltValueSerializer(custom: true)
  static Serializer<LibraryStatsResponseDto> get serializer => _$LibraryStatsResponseDtoSerializer();
}

class _$LibraryStatsResponseDtoSerializer implements PrimitiveSerializer<LibraryStatsResponseDto> {
  @override
  final Iterable<Type> types = const [LibraryStatsResponseDto, _$LibraryStatsResponseDto];

  @override
  final String wireName = r'LibraryStatsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LibraryStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'photos';
    yield serializers.serialize(
      object.photos,
      specifiedType: const FullType(int),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
    yield r'usage';
    yield serializers.serialize(
      object.usage,
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
    LibraryStatsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LibraryStatsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'photos':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.photos = valueDes;
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        case r'usage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.usage = valueDes;
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
  LibraryStatsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LibraryStatsResponseDtoBuilder();
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

