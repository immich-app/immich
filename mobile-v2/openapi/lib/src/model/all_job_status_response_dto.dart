//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/job_status_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'all_job_status_response_dto.g.dart';

/// AllJobStatusResponseDto
///
/// Properties:
/// * [backgroundTask] 
/// * [faceDetection] 
/// * [facialRecognition] 
/// * [library_] 
/// * [metadataExtraction] 
/// * [migration] 
/// * [search] 
/// * [sidecar] 
/// * [smartSearch] 
/// * [storageTemplateMigration] 
/// * [thumbnailGeneration] 
/// * [videoConversion] 
@BuiltValue()
abstract class AllJobStatusResponseDto implements Built<AllJobStatusResponseDto, AllJobStatusResponseDtoBuilder> {
  @BuiltValueField(wireName: r'backgroundTask')
  JobStatusDto get backgroundTask;

  @BuiltValueField(wireName: r'faceDetection')
  JobStatusDto get faceDetection;

  @BuiltValueField(wireName: r'facialRecognition')
  JobStatusDto get facialRecognition;

  @BuiltValueField(wireName: r'library')
  JobStatusDto get library_;

  @BuiltValueField(wireName: r'metadataExtraction')
  JobStatusDto get metadataExtraction;

  @BuiltValueField(wireName: r'migration')
  JobStatusDto get migration;

  @BuiltValueField(wireName: r'search')
  JobStatusDto get search;

  @BuiltValueField(wireName: r'sidecar')
  JobStatusDto get sidecar;

  @BuiltValueField(wireName: r'smartSearch')
  JobStatusDto get smartSearch;

  @BuiltValueField(wireName: r'storageTemplateMigration')
  JobStatusDto get storageTemplateMigration;

  @BuiltValueField(wireName: r'thumbnailGeneration')
  JobStatusDto get thumbnailGeneration;

  @BuiltValueField(wireName: r'videoConversion')
  JobStatusDto get videoConversion;

  AllJobStatusResponseDto._();

  factory AllJobStatusResponseDto([void updates(AllJobStatusResponseDtoBuilder b)]) = _$AllJobStatusResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AllJobStatusResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AllJobStatusResponseDto> get serializer => _$AllJobStatusResponseDtoSerializer();
}

class _$AllJobStatusResponseDtoSerializer implements PrimitiveSerializer<AllJobStatusResponseDto> {
  @override
  final Iterable<Type> types = const [AllJobStatusResponseDto, _$AllJobStatusResponseDto];

  @override
  final String wireName = r'AllJobStatusResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AllJobStatusResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'backgroundTask';
    yield serializers.serialize(
      object.backgroundTask,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'faceDetection';
    yield serializers.serialize(
      object.faceDetection,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'facialRecognition';
    yield serializers.serialize(
      object.facialRecognition,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'library';
    yield serializers.serialize(
      object.library_,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'metadataExtraction';
    yield serializers.serialize(
      object.metadataExtraction,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'migration';
    yield serializers.serialize(
      object.migration,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'search';
    yield serializers.serialize(
      object.search,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'sidecar';
    yield serializers.serialize(
      object.sidecar,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'smartSearch';
    yield serializers.serialize(
      object.smartSearch,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'storageTemplateMigration';
    yield serializers.serialize(
      object.storageTemplateMigration,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'thumbnailGeneration';
    yield serializers.serialize(
      object.thumbnailGeneration,
      specifiedType: const FullType(JobStatusDto),
    );
    yield r'videoConversion';
    yield serializers.serialize(
      object.videoConversion,
      specifiedType: const FullType(JobStatusDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AllJobStatusResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AllJobStatusResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'backgroundTask':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.backgroundTask.replace(valueDes);
          break;
        case r'faceDetection':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.faceDetection.replace(valueDes);
          break;
        case r'facialRecognition':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.facialRecognition.replace(valueDes);
          break;
        case r'library':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.library_.replace(valueDes);
          break;
        case r'metadataExtraction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.metadataExtraction.replace(valueDes);
          break;
        case r'migration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.migration.replace(valueDes);
          break;
        case r'search':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.search.replace(valueDes);
          break;
        case r'sidecar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.sidecar.replace(valueDes);
          break;
        case r'smartSearch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.smartSearch.replace(valueDes);
          break;
        case r'storageTemplateMigration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.storageTemplateMigration.replace(valueDes);
          break;
        case r'thumbnailGeneration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
          result.thumbnailGeneration.replace(valueDes);
          break;
        case r'videoConversion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JobStatusDto),
          ) as JobStatusDto;
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
  AllJobStatusResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AllJobStatusResponseDtoBuilder();
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

