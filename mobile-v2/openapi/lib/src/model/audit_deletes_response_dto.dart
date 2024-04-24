//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audit_deletes_response_dto.g.dart';

/// AuditDeletesResponseDto
///
/// Properties:
/// * [ids] 
/// * [needsFullSync] 
@BuiltValue()
abstract class AuditDeletesResponseDto implements Built<AuditDeletesResponseDto, AuditDeletesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  @BuiltValueField(wireName: r'needsFullSync')
  bool get needsFullSync;

  AuditDeletesResponseDto._();

  factory AuditDeletesResponseDto([void updates(AuditDeletesResponseDtoBuilder b)]) = _$AuditDeletesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuditDeletesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuditDeletesResponseDto> get serializer => _$AuditDeletesResponseDtoSerializer();
}

class _$AuditDeletesResponseDtoSerializer implements PrimitiveSerializer<AuditDeletesResponseDto> {
  @override
  final Iterable<Type> types = const [AuditDeletesResponseDto, _$AuditDeletesResponseDto];

  @override
  final String wireName = r'AuditDeletesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuditDeletesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'needsFullSync';
    yield serializers.serialize(
      object.needsFullSync,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuditDeletesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AuditDeletesResponseDtoBuilder result,
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
        case r'needsFullSync':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.needsFullSync = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuditDeletesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuditDeletesResponseDtoBuilder();
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

