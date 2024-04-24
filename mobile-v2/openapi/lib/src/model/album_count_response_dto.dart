//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'album_count_response_dto.g.dart';

/// AlbumCountResponseDto
///
/// Properties:
/// * [notShared] 
/// * [owned] 
/// * [shared] 
@BuiltValue()
abstract class AlbumCountResponseDto implements Built<AlbumCountResponseDto, AlbumCountResponseDtoBuilder> {
  @BuiltValueField(wireName: r'notShared')
  int get notShared;

  @BuiltValueField(wireName: r'owned')
  int get owned;

  @BuiltValueField(wireName: r'shared')
  int get shared;

  AlbumCountResponseDto._();

  factory AlbumCountResponseDto([void updates(AlbumCountResponseDtoBuilder b)]) = _$AlbumCountResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AlbumCountResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AlbumCountResponseDto> get serializer => _$AlbumCountResponseDtoSerializer();
}

class _$AlbumCountResponseDtoSerializer implements PrimitiveSerializer<AlbumCountResponseDto> {
  @override
  final Iterable<Type> types = const [AlbumCountResponseDto, _$AlbumCountResponseDto];

  @override
  final String wireName = r'AlbumCountResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AlbumCountResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'notShared';
    yield serializers.serialize(
      object.notShared,
      specifiedType: const FullType(int),
    );
    yield r'owned';
    yield serializers.serialize(
      object.owned,
      specifiedType: const FullType(int),
    );
    yield r'shared';
    yield serializers.serialize(
      object.shared,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AlbumCountResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AlbumCountResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'notShared':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.notShared = valueDes;
          break;
        case r'owned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.owned = valueDes;
          break;
        case r'shared':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.shared = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AlbumCountResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AlbumCountResponseDtoBuilder();
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

