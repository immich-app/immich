//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_stack_parent_dto.g.dart';

/// UpdateStackParentDto
///
/// Properties:
/// * [newParentId] 
/// * [oldParentId] 
@BuiltValue()
abstract class UpdateStackParentDto implements Built<UpdateStackParentDto, UpdateStackParentDtoBuilder> {
  @BuiltValueField(wireName: r'newParentId')
  String get newParentId;

  @BuiltValueField(wireName: r'oldParentId')
  String get oldParentId;

  UpdateStackParentDto._();

  factory UpdateStackParentDto([void updates(UpdateStackParentDtoBuilder b)]) = _$UpdateStackParentDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateStackParentDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateStackParentDto> get serializer => _$UpdateStackParentDtoSerializer();
}

class _$UpdateStackParentDtoSerializer implements PrimitiveSerializer<UpdateStackParentDto> {
  @override
  final Iterable<Type> types = const [UpdateStackParentDto, _$UpdateStackParentDto];

  @override
  final String wireName = r'UpdateStackParentDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateStackParentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'newParentId';
    yield serializers.serialize(
      object.newParentId,
      specifiedType: const FullType(String),
    );
    yield r'oldParentId';
    yield serializers.serialize(
      object.oldParentId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateStackParentDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateStackParentDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'newParentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.newParentId = valueDes;
          break;
        case r'oldParentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.oldParentId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateStackParentDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateStackParentDtoBuilder();
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

