// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'exif.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$ExifInfo {

 int? get assetId; int? get fileSize; String? get description; bool get isFlipped; String? get orientation; String? get timeZone; DateTime? get dateTimeOriginal; int? get rating; int? get width; int? get height;// GPS
 double? get latitude; double? get longitude; String? get city; String? get state; String? get country;// Camera related
 String? get make; String? get model; String? get lens; double? get f; double? get mm; int? get iso; double? get exposureSeconds;
/// Create a copy of ExifInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExifInfoCopyWith<ExifInfo> get copyWith => _$ExifInfoCopyWithImpl<ExifInfo>(this as ExifInfo, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ExifInfo&&(identical(other.assetId, assetId) || other.assetId == assetId)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.description, description) || other.description == description)&&(identical(other.isFlipped, isFlipped) || other.isFlipped == isFlipped)&&(identical(other.orientation, orientation) || other.orientation == orientation)&&(identical(other.timeZone, timeZone) || other.timeZone == timeZone)&&(identical(other.dateTimeOriginal, dateTimeOriginal) || other.dateTimeOriginal == dateTimeOriginal)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.width, width) || other.width == width)&&(identical(other.height, height) || other.height == height)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.city, city) || other.city == city)&&(identical(other.state, state) || other.state == state)&&(identical(other.country, country) || other.country == country)&&(identical(other.make, make) || other.make == make)&&(identical(other.model, model) || other.model == model)&&(identical(other.lens, lens) || other.lens == lens)&&(identical(other.f, f) || other.f == f)&&(identical(other.mm, mm) || other.mm == mm)&&(identical(other.iso, iso) || other.iso == iso)&&(identical(other.exposureSeconds, exposureSeconds) || other.exposureSeconds == exposureSeconds));
}


@override
int get hashCode => Object.hashAll([runtimeType,assetId,fileSize,description,isFlipped,orientation,timeZone,dateTimeOriginal,rating,width,height,latitude,longitude,city,state,country,make,model,lens,f,mm,iso,exposureSeconds]);

@override
String toString() {
  return 'ExifInfo(assetId: $assetId, fileSize: $fileSize, description: $description, isFlipped: $isFlipped, orientation: $orientation, timeZone: $timeZone, dateTimeOriginal: $dateTimeOriginal, rating: $rating, width: $width, height: $height, latitude: $latitude, longitude: $longitude, city: $city, state: $state, country: $country, make: $make, model: $model, lens: $lens, f: $f, mm: $mm, iso: $iso, exposureSeconds: $exposureSeconds)';
}


}

/// @nodoc
abstract mixin class $ExifInfoCopyWith<$Res>  {
  factory $ExifInfoCopyWith(ExifInfo value, $Res Function(ExifInfo) _then) = _$ExifInfoCopyWithImpl;
@useResult
$Res call({
 int? assetId, int? fileSize, String? description, bool isFlipped, String? orientation, String? timeZone, DateTime? dateTimeOriginal, int? rating, int? width, int? height, double? latitude, double? longitude, String? city, String? state, String? country, String? make, String? model, String? lens, double? f, double? mm, int? iso, double? exposureSeconds
});




}
/// @nodoc
class _$ExifInfoCopyWithImpl<$Res>
    implements $ExifInfoCopyWith<$Res> {
  _$ExifInfoCopyWithImpl(this._self, this._then);

  final ExifInfo _self;
  final $Res Function(ExifInfo) _then;

/// Create a copy of ExifInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? assetId = freezed,Object? fileSize = freezed,Object? description = freezed,Object? isFlipped = null,Object? orientation = freezed,Object? timeZone = freezed,Object? dateTimeOriginal = freezed,Object? rating = freezed,Object? width = freezed,Object? height = freezed,Object? latitude = freezed,Object? longitude = freezed,Object? city = freezed,Object? state = freezed,Object? country = freezed,Object? make = freezed,Object? model = freezed,Object? lens = freezed,Object? f = freezed,Object? mm = freezed,Object? iso = freezed,Object? exposureSeconds = freezed,}) {
  return _then(_self.copyWith(
assetId: freezed == assetId ? _self.assetId : assetId // ignore: cast_nullable_to_non_nullable
as int?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,isFlipped: null == isFlipped ? _self.isFlipped : isFlipped // ignore: cast_nullable_to_non_nullable
as bool,orientation: freezed == orientation ? _self.orientation : orientation // ignore: cast_nullable_to_non_nullable
as String?,timeZone: freezed == timeZone ? _self.timeZone : timeZone // ignore: cast_nullable_to_non_nullable
as String?,dateTimeOriginal: freezed == dateTimeOriginal ? _self.dateTimeOriginal : dateTimeOriginal // ignore: cast_nullable_to_non_nullable
as DateTime?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,width: freezed == width ? _self.width : width // ignore: cast_nullable_to_non_nullable
as int?,height: freezed == height ? _self.height : height // ignore: cast_nullable_to_non_nullable
as int?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,state: freezed == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String?,country: freezed == country ? _self.country : country // ignore: cast_nullable_to_non_nullable
as String?,make: freezed == make ? _self.make : make // ignore: cast_nullable_to_non_nullable
as String?,model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,lens: freezed == lens ? _self.lens : lens // ignore: cast_nullable_to_non_nullable
as String?,f: freezed == f ? _self.f : f // ignore: cast_nullable_to_non_nullable
as double?,mm: freezed == mm ? _self.mm : mm // ignore: cast_nullable_to_non_nullable
as double?,iso: freezed == iso ? _self.iso : iso // ignore: cast_nullable_to_non_nullable
as int?,exposureSeconds: freezed == exposureSeconds ? _self.exposureSeconds : exposureSeconds // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [ExifInfo].
extension ExifInfoPatterns on ExifInfo {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ExifInfo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ExifInfo() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ExifInfo value)  $default,){
final _that = this;
switch (_that) {
case _ExifInfo():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ExifInfo value)?  $default,){
final _that = this;
switch (_that) {
case _ExifInfo() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int? assetId,  int? fileSize,  String? description,  bool isFlipped,  String? orientation,  String? timeZone,  DateTime? dateTimeOriginal,  int? rating,  int? width,  int? height,  double? latitude,  double? longitude,  String? city,  String? state,  String? country,  String? make,  String? model,  String? lens,  double? f,  double? mm,  int? iso,  double? exposureSeconds)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ExifInfo() when $default != null:
return $default(_that.assetId,_that.fileSize,_that.description,_that.isFlipped,_that.orientation,_that.timeZone,_that.dateTimeOriginal,_that.rating,_that.width,_that.height,_that.latitude,_that.longitude,_that.city,_that.state,_that.country,_that.make,_that.model,_that.lens,_that.f,_that.mm,_that.iso,_that.exposureSeconds);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int? assetId,  int? fileSize,  String? description,  bool isFlipped,  String? orientation,  String? timeZone,  DateTime? dateTimeOriginal,  int? rating,  int? width,  int? height,  double? latitude,  double? longitude,  String? city,  String? state,  String? country,  String? make,  String? model,  String? lens,  double? f,  double? mm,  int? iso,  double? exposureSeconds)  $default,) {final _that = this;
switch (_that) {
case _ExifInfo():
return $default(_that.assetId,_that.fileSize,_that.description,_that.isFlipped,_that.orientation,_that.timeZone,_that.dateTimeOriginal,_that.rating,_that.width,_that.height,_that.latitude,_that.longitude,_that.city,_that.state,_that.country,_that.make,_that.model,_that.lens,_that.f,_that.mm,_that.iso,_that.exposureSeconds);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int? assetId,  int? fileSize,  String? description,  bool isFlipped,  String? orientation,  String? timeZone,  DateTime? dateTimeOriginal,  int? rating,  int? width,  int? height,  double? latitude,  double? longitude,  String? city,  String? state,  String? country,  String? make,  String? model,  String? lens,  double? f,  double? mm,  int? iso,  double? exposureSeconds)?  $default,) {final _that = this;
switch (_that) {
case _ExifInfo() when $default != null:
return $default(_that.assetId,_that.fileSize,_that.description,_that.isFlipped,_that.orientation,_that.timeZone,_that.dateTimeOriginal,_that.rating,_that.width,_that.height,_that.latitude,_that.longitude,_that.city,_that.state,_that.country,_that.make,_that.model,_that.lens,_that.f,_that.mm,_that.iso,_that.exposureSeconds);case _:
  return null;

}
}

}

/// @nodoc


class _ExifInfo extends ExifInfo {
  const _ExifInfo({this.assetId, this.fileSize, this.description, this.isFlipped = false, this.orientation, this.timeZone, this.dateTimeOriginal, this.rating, this.width, this.height, this.latitude, this.longitude, this.city, this.state, this.country, this.make, this.model, this.lens, this.f, this.mm, this.iso, this.exposureSeconds}): super._();
  

@override final  int? assetId;
@override final  int? fileSize;
@override final  String? description;
@override@JsonKey() final  bool isFlipped;
@override final  String? orientation;
@override final  String? timeZone;
@override final  DateTime? dateTimeOriginal;
@override final  int? rating;
@override final  int? width;
@override final  int? height;
// GPS
@override final  double? latitude;
@override final  double? longitude;
@override final  String? city;
@override final  String? state;
@override final  String? country;
// Camera related
@override final  String? make;
@override final  String? model;
@override final  String? lens;
@override final  double? f;
@override final  double? mm;
@override final  int? iso;
@override final  double? exposureSeconds;

/// Create a copy of ExifInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExifInfoCopyWith<_ExifInfo> get copyWith => __$ExifInfoCopyWithImpl<_ExifInfo>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ExifInfo&&(identical(other.assetId, assetId) || other.assetId == assetId)&&(identical(other.fileSize, fileSize) || other.fileSize == fileSize)&&(identical(other.description, description) || other.description == description)&&(identical(other.isFlipped, isFlipped) || other.isFlipped == isFlipped)&&(identical(other.orientation, orientation) || other.orientation == orientation)&&(identical(other.timeZone, timeZone) || other.timeZone == timeZone)&&(identical(other.dateTimeOriginal, dateTimeOriginal) || other.dateTimeOriginal == dateTimeOriginal)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.width, width) || other.width == width)&&(identical(other.height, height) || other.height == height)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.city, city) || other.city == city)&&(identical(other.state, state) || other.state == state)&&(identical(other.country, country) || other.country == country)&&(identical(other.make, make) || other.make == make)&&(identical(other.model, model) || other.model == model)&&(identical(other.lens, lens) || other.lens == lens)&&(identical(other.f, f) || other.f == f)&&(identical(other.mm, mm) || other.mm == mm)&&(identical(other.iso, iso) || other.iso == iso)&&(identical(other.exposureSeconds, exposureSeconds) || other.exposureSeconds == exposureSeconds));
}


@override
int get hashCode => Object.hashAll([runtimeType,assetId,fileSize,description,isFlipped,orientation,timeZone,dateTimeOriginal,rating,width,height,latitude,longitude,city,state,country,make,model,lens,f,mm,iso,exposureSeconds]);

@override
String toString() {
  return 'ExifInfo(assetId: $assetId, fileSize: $fileSize, description: $description, isFlipped: $isFlipped, orientation: $orientation, timeZone: $timeZone, dateTimeOriginal: $dateTimeOriginal, rating: $rating, width: $width, height: $height, latitude: $latitude, longitude: $longitude, city: $city, state: $state, country: $country, make: $make, model: $model, lens: $lens, f: $f, mm: $mm, iso: $iso, exposureSeconds: $exposureSeconds)';
}


}

/// @nodoc
abstract mixin class _$ExifInfoCopyWith<$Res> implements $ExifInfoCopyWith<$Res> {
  factory _$ExifInfoCopyWith(_ExifInfo value, $Res Function(_ExifInfo) _then) = __$ExifInfoCopyWithImpl;
@override @useResult
$Res call({
 int? assetId, int? fileSize, String? description, bool isFlipped, String? orientation, String? timeZone, DateTime? dateTimeOriginal, int? rating, int? width, int? height, double? latitude, double? longitude, String? city, String? state, String? country, String? make, String? model, String? lens, double? f, double? mm, int? iso, double? exposureSeconds
});




}
/// @nodoc
class __$ExifInfoCopyWithImpl<$Res>
    implements _$ExifInfoCopyWith<$Res> {
  __$ExifInfoCopyWithImpl(this._self, this._then);

  final _ExifInfo _self;
  final $Res Function(_ExifInfo) _then;

/// Create a copy of ExifInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? assetId = freezed,Object? fileSize = freezed,Object? description = freezed,Object? isFlipped = null,Object? orientation = freezed,Object? timeZone = freezed,Object? dateTimeOriginal = freezed,Object? rating = freezed,Object? width = freezed,Object? height = freezed,Object? latitude = freezed,Object? longitude = freezed,Object? city = freezed,Object? state = freezed,Object? country = freezed,Object? make = freezed,Object? model = freezed,Object? lens = freezed,Object? f = freezed,Object? mm = freezed,Object? iso = freezed,Object? exposureSeconds = freezed,}) {
  return _then(_ExifInfo(
assetId: freezed == assetId ? _self.assetId : assetId // ignore: cast_nullable_to_non_nullable
as int?,fileSize: freezed == fileSize ? _self.fileSize : fileSize // ignore: cast_nullable_to_non_nullable
as int?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,isFlipped: null == isFlipped ? _self.isFlipped : isFlipped // ignore: cast_nullable_to_non_nullable
as bool,orientation: freezed == orientation ? _self.orientation : orientation // ignore: cast_nullable_to_non_nullable
as String?,timeZone: freezed == timeZone ? _self.timeZone : timeZone // ignore: cast_nullable_to_non_nullable
as String?,dateTimeOriginal: freezed == dateTimeOriginal ? _self.dateTimeOriginal : dateTimeOriginal // ignore: cast_nullable_to_non_nullable
as DateTime?,rating: freezed == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int?,width: freezed == width ? _self.width : width // ignore: cast_nullable_to_non_nullable
as int?,height: freezed == height ? _self.height : height // ignore: cast_nullable_to_non_nullable
as int?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,state: freezed == state ? _self.state : state // ignore: cast_nullable_to_non_nullable
as String?,country: freezed == country ? _self.country : country // ignore: cast_nullable_to_non_nullable
as String?,make: freezed == make ? _self.make : make // ignore: cast_nullable_to_non_nullable
as String?,model: freezed == model ? _self.model : model // ignore: cast_nullable_to_non_nullable
as String?,lens: freezed == lens ? _self.lens : lens // ignore: cast_nullable_to_non_nullable
as String?,f: freezed == f ? _self.f : f // ignore: cast_nullable_to_non_nullable
as double?,mm: freezed == mm ? _self.mm : mm // ignore: cast_nullable_to_non_nullable
as double?,iso: freezed == iso ? _self.iso : iso // ignore: cast_nullable_to_non_nullable
as int?,exposureSeconds: freezed == exposureSeconds ? _self.exposureSeconds : exposureSeconds // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}

// dart format on
