//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'delete_user_dto.g.dart';

/// DeleteUserDto
///
/// Properties:
/// * [force] 
@BuiltValue()
abstract class DeleteUserDto implements Built<DeleteUserDto, DeleteUserDtoBuilder> {
  @BuiltValueField(wireName: r'force')
  bool? get force;

  DeleteUserDto._();

  factory DeleteUserDto([void updates(DeleteUserDtoBuilder b)]) = _$DeleteUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeleteUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeleteUserDto> get serializer => _$DeleteUserDtoSerializer();
}

class _$DeleteUserDtoSerializer implements PrimitiveSerializer<DeleteUserDto> {
  @override
  final Iterable<Type> types = const [DeleteUserDto, _$DeleteUserDto];

  @override
  final String wireName = r'DeleteUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeleteUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.force != null) {
      yield r'force';
      yield serializers.serialize(
        object.force,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DeleteUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DeleteUserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'force':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.force = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeleteUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeleteUserDtoBuilder();
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

