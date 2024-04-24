//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/tag_type_enum.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_tag_dto.g.dart';

/// CreateTagDto
///
/// Properties:
/// * [name] 
/// * [type] 
@BuiltValue()
abstract class CreateTagDto implements Built<CreateTagDto, CreateTagDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'type')
  TagTypeEnum get type;
  // enum typeEnum {  OBJECT,  FACE,  CUSTOM,  };

  CreateTagDto._();

  factory CreateTagDto([void updates(CreateTagDtoBuilder b)]) = _$CreateTagDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateTagDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateTagDto> get serializer => _$CreateTagDtoSerializer();
}

class _$CreateTagDtoSerializer implements PrimitiveSerializer<CreateTagDto> {
  @override
  final Iterable<Type> types = const [CreateTagDto, _$CreateTagDto];

  @override
  final String wireName = r'CreateTagDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateTagDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(TagTypeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateTagDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateTagDtoBuilder result,
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
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TagTypeEnum),
          ) as TagTypeEnum;
          result.type = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateTagDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateTagDtoBuilder();
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

