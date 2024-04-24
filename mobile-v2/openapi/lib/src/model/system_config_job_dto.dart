//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/job_settings_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_job_dto.g.dart';

/// SystemConfigJobDto
///
/// Properties:
/// * [backgroundTask] 
/// * [faceDetection] 
/// * [library_] 
/// * [metadataExtraction] 
/// * [migration] 
/// * [search] 
/// * [sidecar] 
/// * [smartSearch] 
/// * [thumbnailGeneration] 
/// * [videoConversion] 
@BuiltValue()
abstract class SystemConfigJobDto implements Built<SystemConfigJobDto, SystemConfigJobDtoBuilder> {
  @BuiltValueField(wireName: r'backgroundTask')
  JobSettingsDto get backgroundTask;

  @BuiltValueField(wireName: r'faceDetection')
  JobSettingsDto get faceDetection;

  @BuiltValueField(wireName: r'library')
  JobSettingsDto get library_;

  @BuiltValueField(wireName: r'metadataExtraction')
  JobSettingsDto get metadataExtraction;

  @BuiltValueField(wireName: r'migration')
  JobSettingsDto get migration;

  @BuiltValueField(wireName: r'search')
  JobSettingsDto get search;

  @BuiltValueField(wireName: r'sidecar')
  JobSettingsDto get sidecar;

  @BuiltValueField(wireName: r'smartSearch')
  JobSettingsDto get smartSearch;

  @BuiltValueField(wireName: r'thumbnailGeneration')
  JobSettingsDto get thumbnailGeneration;

  @BuiltValueField(wireName: r'videoConversion')
  JobSettingsDto get videoConversion;

  SystemConfigJobDto._();

  factory SystemConfigJobDto([void updates(SystemConfigJobDtoBuilder b)]) = _$SystemConfigJobDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigJobDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigJobDto> get serializer => _$SystemConfigJobDtoSerializer();
}

class _$SystemConfigJobDtoSerializer implements PrimitiveSerializer<SystemConfigJobDto> {
  @override
  final Iterable<Type> types = const [SystemConfigJobDto, _$SystemConfigJobDto];

  @override
  final String wireName = r'SystemConfigJobDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'backgroundTask';
    yield serializers.serialize(
      object.backgroundTask,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'faceDetection';
    yield serializers.serialize(
      object.faceDetection,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'library';
    yield serializers.serialize(
      object.library_,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'metadataExtraction';
    yield serializers.serialize(
      object.metadataExtraction,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'migration';
    yield serializers.serialize(
      object.migration,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'search';
    yield serializers.serialize(
      object.search,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'sidecar';
    yield serializers.serialize(
      object.sidecar,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'smartSearch';
    yield serializers.serialize(
      object.smartSearch,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'thumbnailGeneration';
    yield serializers.serialize(
      object.thumbnailGeneration,
      specifiedType: const FullType(JobSettingsDto),
    );
    yield r'videoConversion';
    yield serializers.serialize(
      object.videoConversion,
      specifiedType: const FullType(JobSettingsDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigJobDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'backgroundTask':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.backgroundTask.replace(valueDes);
          break;
        case r'faceDetection':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.faceDetection.replace(valueDes);
          break;
        case r'library':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.library_.replace(valueDes);
          break;
        case r'metadataExtraction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.metadataExtraction.replace(valueDes);
          break;
        case r'migration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.migration.replace(valueDes);
          break;
        case r'search':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.search.replace(valueDes);
          break;
        case r'sidecar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.sidecar.replace(valueDes);
          break;
        case r'smartSearch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.smartSearch.replace(valueDes);
          break;
        case r'thumbnailGeneration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.thumbnailGeneration.replace(valueDes);
          break;
        case r'videoConversion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobSettingsDto),
          ) as JobSettingsDto;
          result.videoConversion.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigJobDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigJobDtoBuilder();
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

