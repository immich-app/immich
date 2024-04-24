//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'bulk_ids_dto.g.dart';

/// BulkIdsDto
///
/// Properties:
/// * [ids] 
@BuiltValue()
abstract class BulkIdsDto implements Built<BulkIdsDto, BulkIdsDtoBuilder> {
  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  BulkIdsDto._();

  factory BulkIdsDto([void updates(BulkIdsDtoBuilder b)]) = _$BulkIdsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BulkIdsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BulkIdsDto> get serializer => _$BulkIdsDtoSerializer();
}

class _$BulkIdsDtoSerializer implements PrimitiveSerializer<BulkIdsDto> {
  @override
  final Iterable<Type> types = const [BulkIdsDto, _$BulkIdsDto];

  @override
  final String wireName = r'BulkIdsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BulkIdsDto object, {
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
    BulkIdsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BulkIdsDtoBuilder result,
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
  BulkIdsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BulkIdsDtoBuilder();
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

