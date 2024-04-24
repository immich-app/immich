//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_upload_check_result.g.dart';

/// AssetBulkUploadCheckResult
///
/// Properties:
/// * [action] 
/// * [assetId] 
/// * [id] 
/// * [reason] 
@BuiltValue()
abstract class AssetBulkUploadCheckResult implements Built<AssetBulkUploadCheckResult, AssetBulkUploadCheckResultBuilder> {
  @BuiltValueField(wireName: r'action')
  AssetBulkUploadCheckResultActionEnum get action;
  // enum actionEnum {  accept,  reject,  };

  @BuiltValueField(wireName: r'assetId')
  String? get assetId;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'reason')
  AssetBulkUploadCheckResultReasonEnum? get reason;
  // enum reasonEnum {  duplicate,  unsupported-format,  };

  AssetBulkUploadCheckResult._();

  factory AssetBulkUploadCheckResult([void updates(AssetBulkUploadCheckResultBuilder b)]) = _$AssetBulkUploadCheckResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkUploadCheckResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkUploadCheckResult> get serializer => _$AssetBulkUploadCheckResultSerializer();
}

class _$AssetBulkUploadCheckResultSerializer implements PrimitiveSerializer<AssetBulkUploadCheckResult> {
  @override
  final Iterable<Type> types = const [AssetBulkUploadCheckResult, _$AssetBulkUploadCheckResult];

  @override
  final String wireName = r'AssetBulkUploadCheckResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkUploadCheckResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'action';
    yield serializers.serialize(
      object.action,
      specifiedType: const FullType(AssetBulkUploadCheckResultActionEnum),
    );
    if (object.assetId != null) {
      yield r'assetId';
      yield serializers.serialize(
        object.assetId,
        specifiedType: const FullType(String),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType(AssetBulkUploadCheckResultReasonEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkUploadCheckResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkUploadCheckResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetBulkUploadCheckResultActionEnum),
          ) as AssetBulkUploadCheckResultActionEnum;
          result.action = valueDes;
          break;
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetId = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetBulkUploadCheckResultReasonEnum),
          ) as AssetBulkUploadCheckResultReasonEnum;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetBulkUploadCheckResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkUploadCheckResultBuilder();
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

class AssetBulkUploadCheckResultActionEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'accept')
  static const AssetBulkUploadCheckResultActionEnum accept = _$assetBulkUploadCheckResultActionEnum_accept;
  @BuiltValueEnumConst(wireName: r'reject')
  static const AssetBulkUploadCheckResultActionEnum reject = _$assetBulkUploadCheckResultActionEnum_reject;

  static Serializer<AssetBulkUploadCheckResultActionEnum> get serializer => _$assetBulkUploadCheckResultActionEnumSerializer;

  const AssetBulkUploadCheckResultActionEnum._(String name): super(name);

  static BuiltSet<AssetBulkUploadCheckResultActionEnum> get values => _$assetBulkUploadCheckResultActionEnumValues;
  static AssetBulkUploadCheckResultActionEnum valueOf(String name) => _$assetBulkUploadCheckResultActionEnumValueOf(name);
}

class AssetBulkUploadCheckResultReasonEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'duplicate')
  static const AssetBulkUploadCheckResultReasonEnum duplicate = _$assetBulkUploadCheckResultReasonEnum_duplicate;
  @BuiltValueEnumConst(wireName: r'unsupported-format')
  static const AssetBulkUploadCheckResultReasonEnum unsupportedFormat = _$assetBulkUploadCheckResultReasonEnum_unsupportedFormat;

  static Serializer<AssetBulkUploadCheckResultReasonEnum> get serializer => _$assetBulkUploadCheckResultReasonEnumSerializer;

  const AssetBulkUploadCheckResultReasonEnum._(String name): super(name);

  static BuiltSet<AssetBulkUploadCheckResultReasonEnum> get values => _$assetBulkUploadCheckResultReasonEnumValues;
  static AssetBulkUploadCheckResultReasonEnum valueOf(String name) => _$assetBulkUploadCheckResultReasonEnumValueOf(name);
}

