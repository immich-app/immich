//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/asset_bulk_upload_check_result.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_bulk_upload_check_response_dto.g.dart';

/// AssetBulkUploadCheckResponseDto
///
/// Properties:
/// * [results] 
@BuiltValue()
abstract class AssetBulkUploadCheckResponseDto implements Built<AssetBulkUploadCheckResponseDto, AssetBulkUploadCheckResponseDtoBuilder> {
  @BuiltValueField(wireName: r'results')
  BuiltList<AssetBulkUploadCheckResult> get results;

  AssetBulkUploadCheckResponseDto._();

  factory AssetBulkUploadCheckResponseDto([void updates(AssetBulkUploadCheckResponseDtoBuilder b)]) = _$AssetBulkUploadCheckResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetBulkUploadCheckResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetBulkUploadCheckResponseDto> get serializer => _$AssetBulkUploadCheckResponseDtoSerializer();
}

class _$AssetBulkUploadCheckResponseDtoSerializer implements PrimitiveSerializer<AssetBulkUploadCheckResponseDto> {
  @override
  final Iterable<Type> types = const [AssetBulkUploadCheckResponseDto, _$AssetBulkUploadCheckResponseDto];

  @override
  final String wireName = r'AssetBulkUploadCheckResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetBulkUploadCheckResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'results';
    yield serializers.serialize(
      object.results,
      specifiedType: const FullType(BuiltList, [FullType(AssetBulkUploadCheckResult)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetBulkUploadCheckResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetBulkUploadCheckResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'results':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AssetBulkUploadCheckResult)]),
          ) as BuiltList<AssetBulkUploadCheckResult>;
          result.results.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetBulkUploadCheckResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetBulkUploadCheckResponseDtoBuilder();
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

