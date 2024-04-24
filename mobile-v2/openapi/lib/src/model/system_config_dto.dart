//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/system_config_new_version_check_dto.dart';
import 'package:openapi/src/model/system_config_image_dto.dart';
import 'package:openapi/src/model/system_config_o_auth_dto.dart';
import 'package:openapi/src/model/system_config_library_dto.dart';
import 'package:openapi/src/model/system_config_theme_dto.dart';
import 'package:openapi/src/model/system_config_trash_dto.dart';
import 'package:openapi/src/model/system_config_password_login_dto.dart';
import 'package:openapi/src/model/system_config_machine_learning_dto.dart';
import 'package:openapi/src/model/system_config_reverse_geocoding_dto.dart';
import 'package:openapi/src/model/system_config_logging_dto.dart';
import 'package:openapi/src/model/system_config_map_dto.dart';
import 'package:openapi/src/model/system_config_user_dto.dart';
import 'package:openapi/src/model/system_config_job_dto.dart';
import 'package:openapi/src/model/system_config_server_dto.dart';
import 'package:openapi/src/model/system_config_f_fmpeg_dto.dart';
import 'package:openapi/src/model/system_config_storage_template_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_dto.g.dart';

/// SystemConfigDto
///
/// Properties:
/// * [ffmpeg] 
/// * [image] 
/// * [job] 
/// * [library_] 
/// * [logging] 
/// * [machineLearning] 
/// * [map] 
/// * [newVersionCheck] 
/// * [oauth] 
/// * [passwordLogin] 
/// * [reverseGeocoding] 
/// * [server] 
/// * [storageTemplate] 
/// * [theme] 
/// * [trash] 
/// * [user] 
@BuiltValue()
abstract class SystemConfigDto implements Built<SystemConfigDto, SystemConfigDtoBuilder> {
  @BuiltValueField(wireName: r'ffmpeg')
  SystemConfigFFmpegDto get ffmpeg;

  @BuiltValueField(wireName: r'image')
  SystemConfigImageDto get image;

  @BuiltValueField(wireName: r'job')
  SystemConfigJobDto get job;

  @BuiltValueField(wireName: r'library')
  SystemConfigLibraryDto get library_;

  @BuiltValueField(wireName: r'logging')
  SystemConfigLoggingDto get logging;

  @BuiltValueField(wireName: r'machineLearning')
  SystemConfigMachineLearningDto get machineLearning;

  @BuiltValueField(wireName: r'map')
  SystemConfigMapDto get map;

  @BuiltValueField(wireName: r'newVersionCheck')
  SystemConfigNewVersionCheckDto get newVersionCheck;

  @BuiltValueField(wireName: r'oauth')
  SystemConfigOAuthDto get oauth;

  @BuiltValueField(wireName: r'passwordLogin')
  SystemConfigPasswordLoginDto get passwordLogin;

  @BuiltValueField(wireName: r'reverseGeocoding')
  SystemConfigReverseGeocodingDto get reverseGeocoding;

  @BuiltValueField(wireName: r'server')
  SystemConfigServerDto get server;

  @BuiltValueField(wireName: r'storageTemplate')
  SystemConfigStorageTemplateDto get storageTemplate;

  @BuiltValueField(wireName: r'theme')
  SystemConfigThemeDto get theme;

  @BuiltValueField(wireName: r'trash')
  SystemConfigTrashDto get trash;

  @BuiltValueField(wireName: r'user')
  SystemConfigUserDto get user;

  SystemConfigDto._();

  factory SystemConfigDto([void updates(SystemConfigDtoBuilder b)]) = _$SystemConfigDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigDto> get serializer => _$SystemConfigDtoSerializer();
}

class _$SystemConfigDtoSerializer implements PrimitiveSerializer<SystemConfigDto> {
  @override
  final Iterable<Type> types = const [SystemConfigDto, _$SystemConfigDto];

  @override
  final String wireName = r'SystemConfigDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ffmpeg';
    yield serializers.serialize(
      object.ffmpeg,
      specifiedType: const FullType(SystemConfigFFmpegDto),
    );
    yield r'image';
    yield serializers.serialize(
      object.image,
      specifiedType: const FullType(SystemConfigImageDto),
    );
    yield r'job';
    yield serializers.serialize(
      object.job,
      specifiedType: const FullType(SystemConfigJobDto),
    );
    yield r'library';
    yield serializers.serialize(
      object.library_,
      specifiedType: const FullType(SystemConfigLibraryDto),
    );
    yield r'logging';
    yield serializers.serialize(
      object.logging,
      specifiedType: const FullType(SystemConfigLoggingDto),
    );
    yield r'machineLearning';
    yield serializers.serialize(
      object.machineLearning,
      specifiedType: const FullType(SystemConfigMachineLearningDto),
    );
    yield r'map';
    yield serializers.serialize(
      object.map,
      specifiedType: const FullType(SystemConfigMapDto),
    );
    yield r'newVersionCheck';
    yield serializers.serialize(
      object.newVersionCheck,
      specifiedType: const FullType(SystemConfigNewVersionCheckDto),
    );
    yield r'oauth';
    yield serializers.serialize(
      object.oauth,
      specifiedType: const FullType(SystemConfigOAuthDto),
    );
    yield r'passwordLogin';
    yield serializers.serialize(
      object.passwordLogin,
      specifiedType: const FullType(SystemConfigPasswordLoginDto),
    );
    yield r'reverseGeocoding';
    yield serializers.serialize(
      object.reverseGeocoding,
      specifiedType: const FullType(SystemConfigReverseGeocodingDto),
    );
    yield r'server';
    yield serializers.serialize(
      object.server,
      specifiedType: const FullType(SystemConfigServerDto),
    );
    yield r'storageTemplate';
    yield serializers.serialize(
      object.storageTemplate,
      specifiedType: const FullType(SystemConfigStorageTemplateDto),
    );
    yield r'theme';
    yield serializers.serialize(
      object.theme,
      specifiedType: const FullType(SystemConfigThemeDto),
    );
    yield r'trash';
    yield serializers.serialize(
      object.trash,
      specifiedType: const FullType(SystemConfigTrashDto),
    );
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(SystemConfigUserDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ffmpeg':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigFFmpegDto),
          ) as SystemConfigFFmpegDto;
          result.ffmpeg.replace(valueDes);
          break;
        case r'image':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigImageDto),
          ) as SystemConfigImageDto;
          result.image.replace(valueDes);
          break;
        case r'job':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigJobDto),
          ) as SystemConfigJobDto;
          result.job.replace(valueDes);
          break;
        case r'library':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigLibraryDto),
          ) as SystemConfigLibraryDto;
          result.library_.replace(valueDes);
          break;
        case r'logging':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigLoggingDto),
          ) as SystemConfigLoggingDto;
          result.logging.replace(valueDes);
          break;
        case r'machineLearning':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigMachineLearningDto),
          ) as SystemConfigMachineLearningDto;
          result.machineLearning.replace(valueDes);
          break;
        case r'map':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigMapDto),
          ) as SystemConfigMapDto;
          result.map.replace(valueDes);
          break;
        case r'newVersionCheck':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigNewVersionCheckDto),
          ) as SystemConfigNewVersionCheckDto;
          result.newVersionCheck.replace(valueDes);
          break;
        case r'oauth':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigOAuthDto),
          ) as SystemConfigOAuthDto;
          result.oauth.replace(valueDes);
          break;
        case r'passwordLogin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigPasswordLoginDto),
          ) as SystemConfigPasswordLoginDto;
          result.passwordLogin.replace(valueDes);
          break;
        case r'reverseGeocoding':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigReverseGeocodingDto),
          ) as SystemConfigReverseGeocodingDto;
          result.reverseGeocoding.replace(valueDes);
          break;
        case r'server':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigServerDto),
          ) as SystemConfigServerDto;
          result.server.replace(valueDes);
          break;
        case r'storageTemplate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigStorageTemplateDto),
          ) as SystemConfigStorageTemplateDto;
          result.storageTemplate.replace(valueDes);
          break;
        case r'theme':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigThemeDto),
          ) as SystemConfigThemeDto;
          result.theme.replace(valueDes);
          break;
        case r'trash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigTrashDto),
          ) as SystemConfigTrashDto;
          result.trash.replace(valueDes);
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigUserDto),
          ) as SystemConfigUserDto;
          result.user.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigDtoBuilder();
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

