//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_upload_check_item.g.dart';

/// AssetBulkUploadCheckItem
///
/// Properties:
/// * [checksum] - base64 or hex encoded sha1 hash
/// * [id] 
@BuiltValue()
abstract class AssetBulkUploadCheckItem implements Built<AssetBulkUploadCheckItem, AssetBulkUploadCheckItemBuilder> {
  /// base64 or hex encoded sha1 hash
  @BuiltValueField(wireName: r'checksum')
  String get checksum;

  @BuiltValueField(wireName: r'id')
  String get id;

  AssetBulkUploadCheckItem._();

  factory AssetBulkUploadCheckItem([void updates(AssetBulkUploadCheckItemBuilder b)]) = _$AssetBulkUploadCheckItem;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkUploadCheckItemBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkUploadCheckItem> get serializer => _$AssetBulkUploadCheckItemSerializer();
}

class _$AssetBulkUploadCheckItemSerializer implements PrimitiveSerializer<AssetBulkUploadCheckItem> {
  @override
  final Iterable<Type> types = const [AssetBulkUploadCheckItem, _$AssetBulkUploadCheckItem];

  @override
  final String wireName = r'AssetBulkUploadCheckItem';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkUploadCheckItem object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'checksum';
    yield serializers.serialize(
      object.checksum,
      specifiedType: const FullType(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkUploadCheckItem object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkUploadCheckItemBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'checksum':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.checksum = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetBulkUploadCheckItem deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkUploadCheckItemBuilder();
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

