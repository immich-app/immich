//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/asset_job_name.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_jobs_dto.g.dart';

/// AssetJobsDto
///
/// Properties:
/// * [assetIds] 
/// * [name] 
@BuiltValue()
abstract class AssetJobsDto implements Built<AssetJobsDto, AssetJobsDtoBuilder> {
  @BuiltValueField(wireName: r'assetIds')
  BuiltList<String> get assetIds;

  @BuiltValueField(wireName: r'name')
  AssetJobName get name;
  // enum nameEnum {  regenerate-thumbnail,  refresh-metadata,  transcode-video,  };

  AssetJobsDto._();

  factory AssetJobsDto([void updates(AssetJobsDtoBuilder b)]) = _$AssetJobsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetJobsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetJobsDto> get serializer => _$AssetJobsDtoSerializer();
}

class _$AssetJobsDtoSerializer implements PrimitiveSerializer<AssetJobsDto> {
  @override
  final Iterable<Type> types = const [AssetJobsDto, _$AssetJobsDto];

  @override
  final String wireName = r'AssetJobsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetJobsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetIds';
    yield serializers.serialize(
      object.assetIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(AssetJobName),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetJobsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetJobsDtoBuilder result,
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
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetJobName),
          ) as AssetJobName;
          result.name = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetJobsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetJobsDtoBuilder();
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

