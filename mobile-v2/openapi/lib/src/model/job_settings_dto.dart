//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'job_settings_dto.g.dart';

/// JobSettingsDto
///
/// Properties:
/// * [concurrency] 
@BuiltValue()
abstract class JobSettingsDto implements Built<JobSettingsDto, JobSettingsDtoBuilder> {
  @BuiltValueField(wireName: r'concurrency')
  int get concurrency;

  JobSettingsDto._();

  factory JobSettingsDto([void updates(JobSettingsDtoBuilder b)]) = _$JobSettingsDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(JobSettingsDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<JobSettingsDto> get serializer => _$JobSettingsDtoSerializer();
}

class _$JobSettingsDtoSerializer implements PrimitiveSerializer<JobSettingsDto> {
  @override
  final Iterable<Type> types = const [JobSettingsDto, _$JobSettingsDto];

  @override
  final String wireName = r'JobSettingsDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    JobSettingsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'concurrency';
    yield serializers.serialize(
      object.concurrency,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    JobSettingsDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required JobSettingsDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'concurrency':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.concurrency = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  JobSettingsDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = JobSettingsDtoBuilder();
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

