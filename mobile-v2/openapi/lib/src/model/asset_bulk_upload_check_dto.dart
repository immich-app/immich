//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_bulk_upload_check_item.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_upload_check_dto.g.dart';

/// AssetBulkUploadCheckDto
///
/// Properties:
/// * [assets] 
@BuiltValue()
abstract class AssetBulkUploadCheckDto implements Built<AssetBulkUploadCheckDto, AssetBulkUploadCheckDtoBuilder> {
  @BuiltValueField(wireName: r'assets')
  BuiltList<AssetBulkUploadCheckItem> get assets;

  AssetBulkUploadCheckDto._();

  factory AssetBulkUploadCheckDto([void updates(AssetBulkUploadCheckDtoBuilder b)]) = _$AssetBulkUploadCheckDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkUploadCheckDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkUploadCheckDto> get serializer => _$AssetBulkUploadCheckDtoSerializer();
}

class _$AssetBulkUploadCheckDtoSerializer implements PrimitiveSerializer<AssetBulkUploadCheckDto> {
  @override
  final Iterable<Type> types = const [AssetBulkUploadCheckDto, _$AssetBulkUploadCheckDto];

  @override
  final String wireName = r'AssetBulkUploadCheckDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkUploadCheckDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assets';
    yield serializers.serialize(
      object.assets,
      specifiedType: const FullType(BuiltList, [FullType(AssetBulkUploadCheckItem)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkUploadCheckDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkUploadCheckDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetBulkUploadCheckItem)]),
          ) as BuiltList<AssetBulkUploadCheckItem>;
          result.assets.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetBulkUploadCheckDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkUploadCheckDtoBuilder();
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

