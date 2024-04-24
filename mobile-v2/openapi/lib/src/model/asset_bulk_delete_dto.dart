//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_delete_dto.g.dart';

/// AssetBulkDeleteDto
///
/// Properties:
/// * [force] 
/// * [ids] 
@BuiltValue()
abstract class AssetBulkDeleteDto implements Built<AssetBulkDeleteDto, AssetBulkDeleteDtoBuilder> {
  @BuiltValueField(wireName: r'force')
  bool? get force;

  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  AssetBulkDeleteDto._();

  factory AssetBulkDeleteDto([void updates(AssetBulkDeleteDtoBuilder b)]) = _$AssetBulkDeleteDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkDeleteDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkDeleteDto> get serializer => _$AssetBulkDeleteDtoSerializer();
}

class _$AssetBulkDeleteDtoSerializer implements PrimitiveSerializer<AssetBulkDeleteDto> {
  @override
  final Iterable<Type> types = const [AssetBulkDeleteDto, _$AssetBulkDeleteDto];

  @override
  final String wireName = r'AssetBulkDeleteDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkDeleteDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.force != null) {
      yield r'force';
      yield serializers.serialize(
        object.force,
        specifiedType: const FullType(bool),
      );
    }
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkDeleteDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkDeleteDtoBuilder result,
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
  AssetBulkDeleteDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkDeleteDtoBuilder();
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

