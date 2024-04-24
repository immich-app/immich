//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/date.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'person_create_dto.g.dart';

/// PersonCreateDto
///
/// Properties:
/// * [birthDate] - Person date of birth. Note: the mobile app cannot currently set the birth date to null.
/// * [isHidden] - Person visibility
/// * [name] - Person name.
@BuiltValue()
abstract class PersonCreateDto implements Built<PersonCreateDto, PersonCreateDtoBuilder> {
  /// Person date of birth. Note: the mobile app cannot currently set the birth date to null.
  @BuiltValueField(wireName: r'birthDate')
  Date? get birthDate;

  /// Person visibility
  @BuiltValueField(wireName: r'isHidden')
  bool? get isHidden;

  /// Person name.
  @BuiltValueField(wireName: r'name')
  String? get name;

  PersonCreateDto._();

  factory PersonCreateDto([void updates(PersonCreateDtoBuilder b)]) = _$PersonCreateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PersonCreateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PersonCreateDto> get serializer => _$PersonCreateDtoSerializer();
}

class _$PersonCreateDtoSerializer implements PrimitiveSerializer<PersonCreateDto> {
  @override
  final Iterable<Type> types = const [PersonCreateDto, _$PersonCreateDto];

  @override
  final String wireName = r'PersonCreateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PersonCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.birthDate != null) {
      yield r'birthDate';
      yield serializers.serialize(
        object.birthDate,
        specifiedType: const FullType.nullable(Date),
      );
    }
    if (object.isHidden != null) {
      yield r'isHidden';
      yield serializers.serialize(
        object.isHidden,
        specifiedType: const FullType(bool),
      );
    }
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
    PersonCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PersonCreateDtoBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PersonCreateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PersonCreateDtoBuilder();
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

