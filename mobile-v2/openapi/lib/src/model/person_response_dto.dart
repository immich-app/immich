//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/date.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'person_response_dto.g.dart';

/// PersonResponseDto
///
/// Properties:
/// * [birthDate] 
/// * [id] 
/// * [isHidden] 
/// * [name] 
/// * [thumbnailPath] 
@BuiltValue()
abstract class PersonResponseDto implements Built<PersonResponseDto, PersonResponseDtoBuilder> {
  @BuiltValueField(wireName: r'birthDate')
  Date? get birthDate;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isHidden')
  bool get isHidden;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'thumbnailPath')
  String get thumbnailPath;

  PersonResponseDto._();

  factory PersonResponseDto([void updates(PersonResponseDtoBuilder b)]) = _$PersonResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PersonResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PersonResponseDto> get serializer => _$PersonResponseDtoSerializer();
}

class _$PersonResponseDtoSerializer implements PrimitiveSerializer<PersonResponseDto> {
  @override
  final Iterable<Type> types = const [PersonResponseDto, _$PersonResponseDto];

  @override
  final String wireName = r'PersonResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PersonResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'birthDate';
    yield object.birthDate == null ? null : serializers.serialize(
      object.birthDate,
      specifiedType: const FullType.nullable(Date),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'isHidden';
    yield serializers.serialize(
      object.isHidden,
      specifiedType: const FullType(bool),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'thumbnailPath';
    yield serializers.serialize(
      object.thumbnailPath,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PersonResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PersonResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'birthDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(Date),
          ) as Date?;
          if (valueDes == null) continue;
          result.birthDate = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isHidden':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isHidden = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'thumbnailPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.thumbnailPath = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PersonResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PersonResponseDtoBuilder();
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

