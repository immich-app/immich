//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'usage_by_user_dto.g.dart';

/// UsageByUserDto
///
/// Properties:
/// * [photos] 
/// * [quotaSizeInBytes] 
/// * [usage] 
/// * [userId] 
/// * [userName] 
/// * [videos] 
@BuiltValue()
abstract class UsageByUserDto implements Built<UsageByUserDto, UsageByUserDtoBuilder> {
  @BuiltValueField(wireName: r'photos')
  int get photos;

  @BuiltValueField(wireName: r'quotaSizeInBytes')
  int? get quotaSizeInBytes;

  @BuiltValueField(wireName: r'usage')
  int get usage;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'userName')
  String get userName;

  @BuiltValueField(wireName: r'videos')
  int get videos;

  UsageByUserDto._();

  factory UsageByUserDto([void updates(UsageByUserDtoBuilder b)]) = _$UsageByUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UsageByUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UsageByUserDto> get serializer => _$UsageByUserDtoSerializer();
}

class _$UsageByUserDtoSerializer implements PrimitiveSerializer<UsageByUserDto> {
  @override
  final Iterable<Type> types = const [UsageByUserDto, _$UsageByUserDto];

  @override
  final String wireName = r'UsageByUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UsageByUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'photos';
    yield serializers.serialize(
      object.photos,
      specifiedType: const FullType(int),
    );
    yield r'quotaSizeInBytes';
    yield object.quotaSizeInBytes == null ? null : serializers.serialize(
      object.quotaSizeInBytes,
      specifiedType: const FullType.nullable(int),
    );
    yield r'usage';
    yield serializers.serialize(
      object.usage,
      specifiedType: const FullType(int),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'userName';
    yield serializers.serialize(
      object.userName,
      specifiedType: const FullType(String),
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
    UsageByUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UsageByUserDtoBuilder result,
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
        case r'quotaSizeInBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.quotaSizeInBytes = valueDes;
          break;
        case r'usage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.usage = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'userName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userName = valueDes;
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
  UsageByUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UsageByUserDtoBuilder();
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

