//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_update_dto.g.dart';

/// AssetBulkUpdateDto
///
/// Properties:
/// * [dateTimeOriginal] 
/// * [ids] 
/// * [isArchived] 
/// * [isFavorite] 
/// * [latitude] 
/// * [longitude] 
/// * [removeParent] 
/// * [stackParentId] 
@BuiltValue()
abstract class AssetBulkUpdateDto implements Built<AssetBulkUpdateDto, AssetBulkUpdateDtoBuilder> {
  @BuiltValueField(wireName: r'dateTimeOriginal')
  String? get dateTimeOriginal;

  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  @BuiltValueField(wireName: r'isArchived')
  bool? get isArchived;

  @BuiltValueField(wireName: r'isFavorite')
  bool? get isFavorite;

  @BuiltValueField(wireName: r'latitude')
  num? get latitude;

  @BuiltValueField(wireName: r'longitude')
  num? get longitude;

  @BuiltValueField(wireName: r'removeParent')
  bool? get removeParent;

  @BuiltValueField(wireName: r'stackParentId')
  String? get stackParentId;

  AssetBulkUpdateDto._();

  factory AssetBulkUpdateDto([void updates(AssetBulkUpdateDtoBuilder b)]) = _$AssetBulkUpdateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkUpdateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkUpdateDto> get serializer => _$AssetBulkUpdateDtoSerializer();
}

class _$AssetBulkUpdateDtoSerializer implements PrimitiveSerializer<AssetBulkUpdateDto> {
  @override
  final Iterable<Type> types = const [AssetBulkUpdateDto, _$AssetBulkUpdateDto];

  @override
  final String wireName = r'AssetBulkUpdateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.dateTimeOriginal != null) {
      yield r'dateTimeOriginal';
      yield serializers.serialize(
        object.dateTimeOriginal,
        specifiedType: const FullType(String),
      );
    }
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    if (object.isArchived != null) {
      yield r'isArchived';
      yield serializers.serialize(
        object.isArchived,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isFavorite != null) {
      yield r'isFavorite';
      yield serializers.serialize(
        object.isFavorite,
        specifiedType: const FullType(bool),
      );
    }
    if (object.latitude != null) {
      yield r'latitude';
      yield serializers.serialize(
        object.latitude,
        specifiedType: const FullType(num),
      );
    }
    if (object.longitude != null) {
      yield r'longitude';
      yield serializers.serialize(
        object.longitude,
        specifiedType: const FullType(num),
      );
    }
    if (object.removeParent != null) {
      yield r'removeParent';
      yield serializers.serialize(
        object.removeParent,
        specifiedType: const FullType(bool),
      );
    }
    if (object.stackParentId != null) {
      yield r'stackParentId';
      yield serializers.serialize(
        object.stackParentId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkUpdateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkUpdateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'dateTimeOriginal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.dateTimeOriginal = valueDes;
          break;
        case r'ids':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.ids.replace(valueDes);
          break;
        case r'isArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isArchived = valueDes;
          break;
        case r'isFavorite':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isFavorite = valueDes;
          break;
        case r'latitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.latitude = valueDes;
          break;
        case r'longitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.longitude = valueDes;
          break;
        case r'removeParent':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.removeParent = valueDes;
          break;
        case r'stackParentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stackParentId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetBulkUpdateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkUpdateDtoBuilder();
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

