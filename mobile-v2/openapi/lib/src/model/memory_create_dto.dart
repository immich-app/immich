//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/memory_type.dart';
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/on_this_day_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'memory_create_dto.g.dart';

/// MemoryCreateDto
///
/// Properties:
/// * [assetIds] 
/// * [data] 
/// * [isSaved] 
/// * [memoryAt] 
/// * [seenAt] 
/// * [type] 
@BuiltValue()
abstract class MemoryCreateDto implements Built<MemoryCreateDto, MemoryCreateDtoBuilder> {
  @BuiltValueField(wireName: r'assetIds')
  BuiltList<String>? get assetIds;

  @BuiltValueField(wireName: r'data')
  OnThisDayDto get data;

  @BuiltValueField(wireName: r'isSaved')
  bool? get isSaved;

  @BuiltValueField(wireName: r'memoryAt')
  DateTime get memoryAt;

  @BuiltValueField(wireName: r'seenAt')
  DateTime? get seenAt;

  @BuiltValueField(wireName: r'type')
  MemoryType get type;
  // enum typeEnum {  on_this_day,  };

  MemoryCreateDto._();

  factory MemoryCreateDto([void updates(MemoryCreateDtoBuilder b)]) = _$MemoryCreateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MemoryCreateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MemoryCreateDto> get serializer => _$MemoryCreateDtoSerializer();
}

class _$MemoryCreateDtoSerializer implements PrimitiveSerializer<MemoryCreateDto> {
  @override
  final Iterable<Type> types = const [MemoryCreateDto, _$MemoryCreateDto];

  @override
  final String wireName = r'MemoryCreateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MemoryCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.assetIds != null) {
      yield r'assetIds';
      yield serializers.serialize(
        object.assetIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(OnThisDayDto),
    );
    if (object.isSaved != null) {
      yield r'isSaved';
      yield serializers.serialize(
        object.isSaved,
        specifiedType: const FullType(bool),
      );
    }
    yield r'memoryAt';
    yield serializers.serialize(
      object.memoryAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.seenAt != null) {
      yield r'seenAt';
      yield serializers.serialize(
        object.seenAt,
        specifiedType: const FullType(DateTime),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(MemoryType),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MemoryCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MemoryCreateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.assetIds.replace(valueDes);
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(OnThisDayDto),
          ) as OnThisDayDto;
          result.data.replace(valueDes);
          break;
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
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MemoryType),
          ) as MemoryType;
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
  MemoryCreateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MemoryCreateDtoBuilder();
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

