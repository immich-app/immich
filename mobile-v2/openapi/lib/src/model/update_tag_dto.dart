//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_tag_dto.g.dart';

/// UpdateTagDto
///
/// Properties:
/// * [name] 
@BuiltValue()
abstract class UpdateTagDto implements Built<UpdateTagDto, UpdateTagDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  UpdateTagDto._();

  factory UpdateTagDto([void updates(UpdateTagDtoBuilder b)]) = _$UpdateTagDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateTagDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateTagDto> get serializer => _$UpdateTagDtoSerializer();
}

class _$UpdateTagDtoSerializer implements PrimitiveSerializer<UpdateTagDto> {
  @override
  final Iterable<Type> types = const [UpdateTagDto, _$UpdateTagDto];

  @override
  final String wireName = r'UpdateTagDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateTagDto object, {
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
    UpdateTagDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateTagDtoBuilder result,
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
  UpdateTagDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateTagDtoBuilder();
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

