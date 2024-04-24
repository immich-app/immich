//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'api_key_update_dto.g.dart';

/// APIKeyUpdateDto
///
/// Properties:
/// * [name] 
@BuiltValue()
abstract class APIKeyUpdateDto implements Built<APIKeyUpdateDto, APIKeyUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  APIKeyUpdateDto._();

  factory APIKeyUpdateDto([void updates(APIKeyUpdateDtoBuilder b)]) = _$APIKeyUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(APIKeyUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<APIKeyUpdateDto> get serializer => _$APIKeyUpdateDtoSerializer();
}

class _$APIKeyUpdateDtoSerializer implements PrimitiveSerializer<APIKeyUpdateDto> {
  @override
  final Iterable<Type> types = const [APIKeyUpdateDto, _$APIKeyUpdateDto];

  @override
  final String wireName = r'APIKeyUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    APIKeyUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    APIKeyUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required APIKeyUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  APIKeyUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = APIKeyUpdateDtoBuilder();
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

