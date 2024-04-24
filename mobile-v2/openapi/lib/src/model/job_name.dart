//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_name.g.dart';

class JobName extends EnumClass {

  @BuiltValueEnumConst(wireName: r'thumbnailGeneration')
  static const JobName thumbnailGeneration = _$thumbnailGeneration;
  @BuiltValueEnumConst(wireName: r'metadataExtraction')
  static const JobName metadataExtraction = _$metadataExtraction;
  @BuiltValueEnumConst(wireName: r'videoConversion')
  static const JobName videoConversion = _$videoConversion;
  @BuiltValueEnumConst(wireName: r'faceDetection')
  static const JobName faceDetection = _$faceDetection;
  @BuiltValueEnumConst(wireName: r'facialRecognition')
  static const JobName facialRecognition = _$facialRecognition;
  @BuiltValueEnumConst(wireName: r'smartSearch')
  static const JobName smartSearch = _$smartSearch;
  @BuiltValueEnumConst(wireName: r'backgroundTask')
  static const JobName backgroundTask = _$backgroundTask;
  @BuiltValueEnumConst(wireName: r'storageTemplateMigration')
  static const JobName storageTemplateMigration = _$storageTemplateMigration;
  @BuiltValueEnumConst(wireName: r'migration')
  static const JobName migration = _$migration;
  @BuiltValueEnumConst(wireName: r'search')
  static const JobName search = _$search;
  @BuiltValueEnumConst(wireName: r'sidecar')
  static const JobName sidecar = _$sidecar;
  @BuiltValueEnumConst(wireName: r'library')
  static const JobName library_ = _$library_;

  static Serializer<JobName> get serializer => _$jobNameSerializer;

  const JobName._(String name): super(name);

  static BuiltSet<JobName> get values => _$values;
  static JobName valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class JobNameMixin = Object with _$JobNameMixin;

