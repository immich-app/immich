//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'api_key_create_dto.g.dart';

/// APIKeyCreateDto
///
/// Properties:
/// * [name] 
@BuiltValue()
abstract class APIKeyCreateDto implements Built<APIKeyCreateDto, APIKeyCreateDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  APIKeyCreateDto._();

  factory APIKeyCreateDto([void updates(APIKeyCreateDtoBuilder b)]) = _$APIKeyCreateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(APIKeyCreateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<APIKeyCreateDto> get serializer => _$APIKeyCreateDtoSerializer();
}

class _$APIKeyCreateDtoSerializer implements PrimitiveSerializer<APIKeyCreateDto> {
  @override
  final Iterable<Type> types = const [APIKeyCreateDto, _$APIKeyCreateDto];

  @override
  final String wireName = r'APIKeyCreateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    APIKeyCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    APIKeyCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required APIKeyCreateDtoBuilder result,
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
  APIKeyCreateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = APIKeyCreateDtoBuilder();
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

