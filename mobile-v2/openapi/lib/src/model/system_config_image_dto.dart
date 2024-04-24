//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/colorspace.dart';
import 'package:openapi/src/model/image_format.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_image_dto.g.dart';

/// SystemConfigImageDto
///
/// Properties:
/// * [colorspace] 
/// * [extractEmbedded] 
/// * [previewFormat] 
/// * [previewSize] 
/// * [quality] 
/// * [thumbnailFormat] 
/// * [thumbnailSize] 
@BuiltValue()
abstract class SystemConfigImageDto implements Built<SystemConfigImageDto, SystemConfigImageDtoBuilder> {
  @BuiltValueField(wireName: r'colorspace')
  Colorspace get colorspace;
  // enum colorspaceEnum {  srgb,  p3,  };

  @BuiltValueField(wireName: r'extractEmbedded')
  bool get extractEmbedded;

  @BuiltValueField(wireName: r'previewFormat')
  ImageFormat get previewFormat;
  // enum previewFormatEnum {  jpeg,  webp,  };

  @BuiltValueField(wireName: r'previewSize')
  int get previewSize;

  @BuiltValueField(wireName: r'quality')
  int get quality;

  @BuiltValueField(wireName: r'thumbnailFormat')
  ImageFormat get thumbnailFormat;
  // enum thumbnailFormatEnum {  jpeg,  webp,  };

  @BuiltValueField(wireName: r'thumbnailSize')
  int get thumbnailSize;

  SystemConfigImageDto._();

  factory SystemConfigImageDto([void updates(SystemConfigImageDtoBuilder b)]) = _$SystemConfigImageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigImageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigImageDto> get serializer => _$SystemConfigImageDtoSerializer();
}

class _$SystemConfigImageDtoSerializer implements PrimitiveSerializer<SystemConfigImageDto> {
  @override
  final Iterable<Type> types = const [SystemConfigImageDto, _$SystemConfigImageDto];

  @override
  final String wireName = r'SystemConfigImageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'colorspace';
    yield serializers.serialize(
      object.colorspace,
      specifiedType: const FullType(Colorspace),
    );
    yield r'extractEmbedded';
    yield serializers.serialize(
      object.extractEmbedded,
      specifiedType: const FullType(bool),
    );
    yield r'previewFormat';
    yield serializers.serialize(
      object.previewFormat,
      specifiedType: const FullType(ImageFormat),
    );
    yield r'previewSize';
    yield serializers.serialize(
      object.previewSize,
      specifiedType: const FullType(int),
    );
    yield r'quality';
    yield serializers.serialize(
      object.quality,
      specifiedType: const FullType(int),
    );
    yield r'thumbnailFormat';
    yield serializers.serialize(
      object.thumbnailFormat,
      specifiedType: const FullType(ImageFormat),
    );
    yield r'thumbnailSize';
    yield serializers.serialize(
      object.thumbnailSize,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigImageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'colorspace':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Colorspace),
          ) as Colorspace;
          result.colorspace = valueDes;
          break;
        case r'extractEmbedded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.extractEmbedded = valueDes;
          break;
        case r'previewFormat':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ImageFormat),
          ) as ImageFormat;
          result.previewFormat = valueDes;
          break;
        case r'previewSize':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.previewSize = valueDes;
          break;
        case r'quality':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.quality = valueDes;
          break;
        case r'thumbnailFormat':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ImageFormat),
          ) as ImageFormat;
          result.thumbnailFormat = valueDes;
          break;
        case r'thumbnailSize':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.thumbnailSize = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigImageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigImageDtoBuilder();
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

