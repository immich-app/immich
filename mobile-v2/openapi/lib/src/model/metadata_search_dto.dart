//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/asset_order.dart';
import 'package:openapi/src/model/asset_type_enum.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'metadata_search_dto.g.dart';

/// MetadataSearchDto
///
/// Properties:
/// * [checksum] 
/// * [city] 
/// * [country] 
/// * [createdAfter] 
/// * [createdBefore] 
/// * [deviceAssetId] 
/// * [deviceId] 
/// * [encodedVideoPath] 
/// * [id] 
/// * [isArchived] 
/// * [isEncoded] 
/// * [isExternal] 
/// * [isFavorite] 
/// * [isMotion] 
/// * [isNotInAlbum] 
/// * [isOffline] 
/// * [isReadOnly] 
/// * [isVisible] 
/// * [lensModel] 
/// * [libraryId] 
/// * [make] 
/// * [model] 
/// * [order] 
/// * [originalFileName] 
/// * [originalPath] 
/// * [page] 
/// * [personIds] 
/// * [previewPath] 
/// * [resizePath] 
/// * [size] 
/// * [state] 
/// * [takenAfter] 
/// * [takenBefore] 
/// * [thumbnailPath] 
/// * [trashedAfter] 
/// * [trashedBefore] 
/// * [type] 
/// * [updatedAfter] 
/// * [updatedBefore] 
/// * [webpPath] 
/// * [withArchived] 
/// * [withDeleted] 
/// * [withExif] 
/// * [withPeople] 
/// * [withStacked] 
@BuiltValue()
abstract class MetadataSearchDto implements Built<MetadataSearchDto, MetadataSearchDtoBuilder> {
  @BuiltValueField(wireName: r'checksum')
  String? get checksum;

  @BuiltValueField(wireName: r'city')
  String? get city;

  @BuiltValueField(wireName: r'country')
  String? get country;

  @BuiltValueField(wireName: r'createdAfter')
  DateTime? get createdAfter;

  @BuiltValueField(wireName: r'createdBefore')
  DateTime? get createdBefore;

  @BuiltValueField(wireName: r'deviceAssetId')
  String? get deviceAssetId;

  @BuiltValueField(wireName: r'deviceId')
  String? get deviceId;

  @BuiltValueField(wireName: r'encodedVideoPath')
  String? get encodedVideoPath;

  @BuiltValueField(wireName: r'id')
  String? get id;

  @BuiltValueField(wireName: r'isArchived')
  bool? get isArchived;

  @BuiltValueField(wireName: r'isEncoded')
  bool? get isEncoded;

  @BuiltValueField(wireName: r'isExternal')
  bool? get isExternal;

  @BuiltValueField(wireName: r'isFavorite')
  bool? get isFavorite;

  @BuiltValueField(wireName: r'isMotion')
  bool? get isMotion;

  @BuiltValueField(wireName: r'isNotInAlbum')
  bool? get isNotInAlbum;

  @BuiltValueField(wireName: r'isOffline')
  bool? get isOffline;

  @BuiltValueField(wireName: r'isReadOnly')
  bool? get isReadOnly;

  @BuiltValueField(wireName: r'isVisible')
  bool? get isVisible;

  @BuiltValueField(wireName: r'lensModel')
  String? get lensModel;

  @BuiltValueField(wireName: r'libraryId')
  String? get libraryId;

  @BuiltValueField(wireName: r'make')
  String? get make;

  @BuiltValueField(wireName: r'model')
  String? get model;

  @BuiltValueField(wireName: r'order')
  AssetOrder? get order;
  // enum orderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'originalFileName')
  String? get originalFileName;

  @BuiltValueField(wireName: r'originalPath')
  String? get originalPath;

  @BuiltValueField(wireName: r'page')
  num? get page;

  @BuiltValueField(wireName: r'personIds')
  BuiltList<String>? get personIds;

  @BuiltValueField(wireName: r'previewPath')
  String? get previewPath;

  @Deprecated('resizePath has been deprecated')
  @BuiltValueField(wireName: r'resizePath')
  String? get resizePath;

  @BuiltValueField(wireName: r'size')
  num? get size;

  @BuiltValueField(wireName: r'state')
  String? get state;

  @BuiltValueField(wireName: r'takenAfter')
  DateTime? get takenAfter;

  @BuiltValueField(wireName: r'takenBefore')
  DateTime? get takenBefore;

  @BuiltValueField(wireName: r'thumbnailPath')
  String? get thumbnailPath;

  @BuiltValueField(wireName: r'trashedAfter')
  DateTime? get trashedAfter;

  @BuiltValueField(wireName: r'trashedBefore')
  DateTime? get trashedBefore;

  @BuiltValueField(wireName: r'type')
  AssetTypeEnum? get type;
  // enum typeEnum {  IMAGE,  VIDEO,  AUDIO,  OTHER,  };

  @BuiltValueField(wireName: r'updatedAfter')
  DateTime? get updatedAfter;

  @BuiltValueField(wireName: r'updatedBefore')
  DateTime? get updatedBefore;

  @Deprecated('webpPath has been deprecated')
  @BuiltValueField(wireName: r'webpPath')
  String? get webpPath;

  @BuiltValueField(wireName: r'withArchived')
  bool? get withArchived;

  @BuiltValueField(wireName: r'withDeleted')
  bool? get withDeleted;

  @BuiltValueField(wireName: r'withExif')
  bool? get withExif;

  @BuiltValueField(wireName: r'withPeople')
  bool? get withPeople;

  @BuiltValueField(wireName: r'withStacked')
  bool? get withStacked;

  MetadataSearchDto._();

  factory MetadataSearchDto([void updates(MetadataSearchDtoBuilder b)]) = _$MetadataSearchDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MetadataSearchDtoBuilder b) => b
      ..withArchived = false;

  @BuiltValueSerializer(custom: true)
  static Serializer<MetadataSearchDto> get serializer => _$MetadataSearchDtoSerializer();
}

class _$MetadataSearchDtoSerializer implements PrimitiveSerializer<MetadataSearchDto> {
  @override
  final Iterable<Type> types = const [MetadataSearchDto, _$MetadataSearchDto];

  @override
  final String wireName = r'MetadataSearchDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MetadataSearchDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.checksum != null) {
      yield r'checksum';
      yield serializers.serialize(
        object.checksum,
        specifiedType: const FullType(String),
      );
    }
    if (object.city != null) {
      yield r'city';
      yield serializers.serialize(
        object.city,
        specifiedType: const FullType(String),
      );
    }
    if (object.country != null) {
      yield r'country';
      yield serializers.serialize(
        object.country,
        specifiedType: const FullType(String),
      );
    }
    if (object.createdAfter != null) {
      yield r'createdAfter';
      yield serializers.serialize(
        object.createdAfter,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.createdBefore != null) {
      yield r'createdBefore';
      yield serializers.serialize(
        object.createdBefore,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.deviceAssetId != null) {
      yield r'deviceAssetId';
      yield serializers.serialize(
        object.deviceAssetId,
        specifiedType: const FullType(String),
      );
    }
    if (object.deviceId != null) {
      yield r'deviceId';
      yield serializers.serialize(
        object.deviceId,
        specifiedType: const FullType(String),
      );
    }
    if (object.encodedVideoPath != null) {
      yield r'encodedVideoPath';
      yield serializers.serialize(
        object.encodedVideoPath,
        specifiedType: const FullType(String),
      );
    }
    if (object.id != null) {
      yield r'id';
      yield serializers.serialize(
        object.id,
        specifiedType: const FullType(String),
      );
    }
    if (object.isArchived != null) {
      yield r'isArchived';
      yield serializers.serialize(
        object.isArchived,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isEncoded != null) {
      yield r'isEncoded';
      yield serializers.serialize(
        object.isEncoded,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isExternal != null) {
      yield r'isExternal';
      yield serializers.serialize(
        object.isExternal,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isFavorite != null) {
      yield r'isFavorite';
      yield serializers.serialize(
        object.isFavorite,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isMotion != null) {
      yield r'isMotion';
      yield serializers.serialize(
        object.isMotion,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isNotInAlbum != null) {
      yield r'isNotInAlbum';
      yield serializers.serialize(
        object.isNotInAlbum,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isOffline != null) {
      yield r'isOffline';
      yield serializers.serialize(
        object.isOffline,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isReadOnly != null) {
      yield r'isReadOnly';
      yield serializers.serialize(
        object.isReadOnly,
        specifiedType: const FullType(bool),
      );
    }
    if (object.isVisible != null) {
      yield r'isVisible';
      yield serializers.serialize(
        object.isVisible,
        specifiedType: const FullType(bool),
      );
    }
    if (object.lensModel != null) {
      yield r'lensModel';
      yield serializers.serialize(
        object.lensModel,
        specifiedType: const FullType(String),
      );
    }
    if (object.libraryId != null) {
      yield r'libraryId';
      yield serializers.serialize(
        object.libraryId,
        specifiedType: const FullType(String),
      );
    }
    if (object.make != null) {
      yield r'make';
      yield serializers.serialize(
        object.make,
        specifiedType: const FullType(String),
      );
    }
    if (object.model != null) {
      yield r'model';
      yield serializers.serialize(
        object.model,
        specifiedType: const FullType(String),
      );
    }
    if (object.order != null) {
      yield r'order';
      yield serializers.serialize(
        object.order,
        specifiedType: const FullType(AssetOrder),
      );
    }
    if (object.originalFileName != null) {
      yield r'originalFileName';
      yield serializers.serialize(
        object.originalFileName,
        specifiedType: const FullType(String),
      );
    }
    if (object.originalPath != null) {
      yield r'originalPath';
      yield serializers.serialize(
        object.originalPath,
        specifiedType: const FullType(String),
      );
    }
    if (object.page != null) {
      yield r'page';
      yield serializers.serialize(
        object.page,
        specifiedType: const FullType(num),
      );
    }
    if (object.personIds != null) {
      yield r'personIds';
      yield serializers.serialize(
        object.personIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.previewPath != null) {
      yield r'previewPath';
      yield serializers.serialize(
        object.previewPath,
        specifiedType: const FullType(String),
      );
    }
    if (object.resizePath != null) {
      yield r'resizePath';
      yield serializers.serialize(
        object.resizePath,
        specifiedType: const FullType(String),
      );
    }
    if (object.size != null) {
      yield r'size';
      yield serializers.serialize(
        object.size,
        specifiedType: const FullType(num),
      );
    }
    if (object.state != null) {
      yield r'state';
      yield serializers.serialize(
        object.state,
        specifiedType: const FullType(String),
      );
    }
    if (object.takenAfter != null) {
      yield r'takenAfter';
      yield serializers.serialize(
        object.takenAfter,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.takenBefore != null) {
      yield r'takenBefore';
      yield serializers.serialize(
        object.takenBefore,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.thumbnailPath != null) {
      yield r'thumbnailPath';
      yield serializers.serialize(
        object.thumbnailPath,
        specifiedType: const FullType(String),
      );
    }
    if (object.trashedAfter != null) {
      yield r'trashedAfter';
      yield serializers.serialize(
        object.trashedAfter,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.trashedBefore != null) {
      yield r'trashedBefore';
      yield serializers.serialize(
        object.trashedBefore,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.type != null) {
      yield r'type';
      yield serializers.serialize(
        object.type,
        specifiedType: const FullType(AssetTypeEnum),
      );
    }
    if (object.updatedAfter != null) {
      yield r'updatedAfter';
      yield serializers.serialize(
        object.updatedAfter,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.updatedBefore != null) {
      yield r'updatedBefore';
      yield serializers.serialize(
        object.updatedBefore,
        specifiedType: const FullType(DateTime),
      );
    }
    if (object.webpPath != null) {
      yield r'webpPath';
      yield serializers.serialize(
        object.webpPath,
        specifiedType: const FullType(String),
      );
    }
    if (object.withArchived != null) {
      yield r'withArchived';
      yield serializers.serialize(
        object.withArchived,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withDeleted != null) {
      yield r'withDeleted';
      yield serializers.serialize(
        object.withDeleted,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withExif != null) {
      yield r'withExif';
      yield serializers.serialize(
        object.withExif,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withPeople != null) {
      yield r'withPeople';
      yield serializers.serialize(
        object.withPeople,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withStacked != null) {
      yield r'withStacked';
      yield serializers.serialize(
        object.withStacked,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    MetadataSearchDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MetadataSearchDtoBuilder result,
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
        case r'city':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.city = valueDes;
          break;
        case r'country':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.country = valueDes;
          break;
        case r'createdAfter':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAfter = valueDes;
          break;
        case r'createdBefore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdBefore = valueDes;
          break;
        case r'deviceAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceAssetId = valueDes;
          break;
        case r'deviceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceId = valueDes;
          break;
        case r'encodedVideoPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.encodedVideoPath = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'isArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isArchived = valueDes;
          break;
        case r'isEncoded':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isEncoded = valueDes;
          break;
        case r'isExternal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isExternal = valueDes;
          break;
        case r'isFavorite':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isFavorite = valueDes;
          break;
        case r'isMotion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isMotion = valueDes;
          break;
        case r'isNotInAlbum':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isNotInAlbum = valueDes;
          break;
        case r'isOffline':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isOffline = valueDes;
          break;
        case r'isReadOnly':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isReadOnly = valueDes;
          break;
        case r'isVisible':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isVisible = valueDes;
          break;
        case r'lensModel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lensModel = valueDes;
          break;
        case r'libraryId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.libraryId = valueDes;
          break;
        case r'make':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.make = valueDes;
          break;
        case r'model':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.model = valueDes;
          break;
        case r'order':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetOrder),
          ) as AssetOrder;
          result.order = valueDes;
          break;
        case r'originalFileName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalFileName = valueDes;
          break;
        case r'originalPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalPath = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'personIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.personIds.replace(valueDes);
          break;
        case r'previewPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.previewPath = valueDes;
          break;
        case r'resizePath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.resizePath = valueDes;
          break;
        case r'size':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.size = valueDes;
          break;
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.state = valueDes;
          break;
        case r'takenAfter':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.takenAfter = valueDes;
          break;
        case r'takenBefore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.takenBefore = valueDes;
          break;
        case r'thumbnailPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.thumbnailPath = valueDes;
          break;
        case r'trashedAfter':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.trashedAfter = valueDes;
          break;
        case r'trashedBefore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.trashedBefore = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AssetTypeEnum),
          ) as AssetTypeEnum;
          result.type = valueDes;
          break;
        case r'updatedAfter':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAfter = valueDes;
          break;
        case r'updatedBefore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedBefore = valueDes;
          break;
        case r'webpPath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.webpPath = valueDes;
          break;
        case r'withArchived':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withArchived = valueDes;
          break;
        case r'withDeleted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withDeleted = valueDes;
          break;
        case r'withExif':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withExif = valueDes;
          break;
        case r'withPeople':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withPeople = valueDes;
          break;
        case r'withStacked':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withStacked = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MetadataSearchDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MetadataSearchDtoBuilder();
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

