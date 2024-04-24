//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/person_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'people_response_dto.g.dart';

/// PeopleResponseDto
///
/// Properties:
/// * [hidden] 
/// * [people] 
/// * [total] 
@BuiltValue()
abstract class PeopleResponseDto implements Built<PeopleResponseDto, PeopleResponseDtoBuilder> {
  @BuiltValueField(wireName: r'hidden')
  int get hidden;

  @BuiltValueField(wireName: r'people')
  BuiltList<PersonResponseDto> get people;

  @BuiltValueField(wireName: r'total')
  int get total;

  PeopleResponseDto._();

  factory PeopleResponseDto([void updates(PeopleResponseDtoBuilder b)]) = _$PeopleResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PeopleResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PeopleResponseDto> get serializer => _$PeopleResponseDtoSerializer();
}

class _$PeopleResponseDtoSerializer implements PrimitiveSerializer<PeopleResponseDto> {
  @override
  final Iterable<Type> types = const [PeopleResponseDto, _$PeopleResponseDto];

  @override
  final String wireName = r'PeopleResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PeopleResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'hidden';
    yield serializers.serialize(
      object.hidden,
      specifiedType: const FullType(int),
    );
    yield r'people';
    yield serializers.serialize(
      object.people,
      specifiedType: const FullType(BuiltList, [FullType(PersonResponseDto)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PeopleResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PeopleResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'hidden':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.hidden = valueDes;
          break;
        case r'people':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(PersonResponseDto)]),
          ) as BuiltList<PersonResponseDto>;
          result.people.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PeopleResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PeopleResponseDtoBuilder();
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

