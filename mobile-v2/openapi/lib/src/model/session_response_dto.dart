//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'session_response_dto.g.dart';

/// SessionResponseDto
///
/// Properties:
/// * [createdAt] 
/// * [current] 
/// * [deviceOS] 
/// * [deviceType] 
/// * [id] 
/// * [updatedAt] 
@BuiltValue()
abstract class SessionResponseDto implements Built<SessionResponseDto, SessionResponseDtoBuilder> {
  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'current')
  bool get current;

  @BuiltValueField(wireName: r'deviceOS')
  String get deviceOS;

  @BuiltValueField(wireName: r'deviceType')
  String get deviceType;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  SessionResponseDto._();

  factory SessionResponseDto([void updates(SessionResponseDtoBuilder b)]) = _$SessionResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SessionResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SessionResponseDto> get serializer => _$SessionResponseDtoSerializer();
}

class _$SessionResponseDtoSerializer implements PrimitiveSerializer<SessionResponseDto> {
  @override
  final Iterable<Type> types = const [SessionResponseDto, _$SessionResponseDto];

  @override
  final String wireName = r'SessionResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SessionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'current';
    yield serializers.serialize(
      object.current,
      specifiedType: const FullType(bool),
    );
    yield r'deviceOS';
    yield serializers.serialize(
      object.deviceOS,
      specifiedType: const FullType(String),
    );
    yield r'deviceType';
    yield serializers.serialize(
      object.deviceType,
      specifiedType: const FullType(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SessionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SessionResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'current':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.current = valueDes;
          break;
        case r'deviceOS':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceOS = valueDes;
          break;
        case r'deviceType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceType = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SessionResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SessionResponseDtoBuilder();
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

