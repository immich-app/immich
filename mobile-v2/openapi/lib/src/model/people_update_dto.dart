//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/people_update_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'people_update_dto.g.dart';

/// PeopleUpdateDto
///
/// Properties:
/// * [people] 
@BuiltValue()
abstract class PeopleUpdateDto implements Built<PeopleUpdateDto, PeopleUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'people')
  BuiltList<PeopleUpdateItem> get people;

  PeopleUpdateDto._();

  factory PeopleUpdateDto([void updates(PeopleUpdateDtoBuilder b)]) = _$PeopleUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PeopleUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PeopleUpdateDto> get serializer => _$PeopleUpdateDtoSerializer();
}

class _$PeopleUpdateDtoSerializer implements PrimitiveSerializer<PeopleUpdateDto> {
  @override
  final Iterable<Type> types = const [PeopleUpdateDto, _$PeopleUpdateDto];

  @override
  final String wireName = r'PeopleUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PeopleUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'people';
    yield serializers.serialize(
      object.people,
      specifiedType: const FullType(BuiltList, [FullType(PeopleUpdateItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PeopleUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PeopleUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'people':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(PeopleUpdateItem)]),
          ) as BuiltList<PeopleUpdateItem>;
          result.people.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PeopleUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PeopleUpdateDtoBuilder();
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

