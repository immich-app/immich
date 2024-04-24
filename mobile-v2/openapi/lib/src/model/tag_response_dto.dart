//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/tag_type_enum.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_response_dto.g.dart';

/// TagResponseDto
///
/// Properties:
/// * [id] 
/// * [name] 
/// * [type] 
/// * [userId] 
@BuiltValue()
abstract class TagResponseDto implements Built<TagResponseDto, TagResponseDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'type')
  TagTypeEnum get type;
  // enum typeEnum {  OBJECT,  FACE,  CUSTOM,  };

  @BuiltValueField(wireName: r'userId')
  String get userId;

  TagResponseDto._();

  factory TagResponseDto([void updates(TagResponseDtoBuilder b)]) = _$TagResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagResponseDto> get serializer => _$TagResponseDtoSerializer();
}

class _$TagResponseDtoSerializer implements PrimitiveSerializer<TagResponseDto> {
  @override
  final Iterable<Type> types = const [TagResponseDto, _$TagResponseDto];

  @override
  final String wireName = r'TagResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TagResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
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
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TagResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagResponseDtoBuilder();
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

