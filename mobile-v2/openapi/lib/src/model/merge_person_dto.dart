//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'merge_person_dto.g.dart';

/// MergePersonDto
///
/// Properties:
/// * [ids] 
@BuiltValue()
abstract class MergePersonDto implements Built<MergePersonDto, MergePersonDtoBuilder> {
  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  MergePersonDto._();

  factory MergePersonDto([void updates(MergePersonDtoBuilder b)]) = _$MergePersonDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MergePersonDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MergePersonDto> get serializer => _$MergePersonDtoSerializer();
}

class _$MergePersonDtoSerializer implements PrimitiveSerializer<MergePersonDto> {
  @override
  final Iterable<Type> types = const [MergePersonDto, _$MergePersonDto];

  @override
  final String wireName = r'MergePersonDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MergePersonDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MergePersonDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MergePersonDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ids':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.ids.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MergePersonDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MergePersonDtoBuilder();
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

