//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'memory_update_dto.g.dart';

/// MemoryUpdateDto
///
/// Properties:
/// * [isSaved] 
/// * [memoryAt] 
/// * [seenAt] 
@BuiltValue()
abstract class MemoryUpdateDto implements Built<MemoryUpdateDto, MemoryUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'isSaved')
  bool? get isSaved;

  @BuiltValueField(wireName: r'memoryAt')
  DateTime? get memoryAt;

  @BuiltValueField(wireName: r'seenAt')
  DateTime? get seenAt;

  MemoryUpdateDto._();

  factory MemoryUpdateDto([void updates(MemoryUpdateDtoBuilder b)]) = _$MemoryUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MemoryUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MemoryUpdateDto> get serializer => _$MemoryUpdateDtoSerializer();
}

class _$MemoryUpdateDtoSerializer implements PrimitiveSerializer<MemoryUpdateDto> {
  @override
  final Iterable<Type> types = const [MemoryUpdateDto, _$MemoryUpdateDto];

  @override
  final String wireName = r'MemoryUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MemoryUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.isSaved != null) {
      yield r'isSaved';
      yield serializers.serialize(
        object.isSaved,
        specifiedType: const FullType(bool),
      );
    }
    if (object.memoryAt != null) {
      yield r'memoryAt';
      yield serializers.serialize(
        object.memoryAt,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.seenAt != null) {
      yield r'seenAt';
      yield serializers.serialize(
        object.seenAt,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    MemoryUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MemoryUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'isSaved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isSaved = valueDes;
          break;
        case r'memoryAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.memoryAt = valueDes;
          break;
        case r'seenAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.seenAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MemoryUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MemoryUpdateDtoBuilder();
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

