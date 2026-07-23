// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ocr.model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$Ocr {

 String get id; String get assetId; double get x1; double get y1; double get x2; double get y2; double get x3; double get y3; double get x4; double get y4; double get boxScore; double get textScore; String get text; bool get isVisible;
/// Create a copy of Ocr
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OcrCopyWith<Ocr> get copyWith => _$OcrCopyWithImpl<Ocr>(this as Ocr, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Ocr&&(identical(other.id, id) || other.id == id)&&(identical(other.assetId, assetId) || other.assetId == assetId)&&(identical(other.x1, x1) || other.x1 == x1)&&(identical(other.y1, y1) || other.y1 == y1)&&(identical(other.x2, x2) || other.x2 == x2)&&(identical(other.y2, y2) || other.y2 == y2)&&(identical(other.x3, x3) || other.x3 == x3)&&(identical(other.y3, y3) || other.y3 == y3)&&(identical(other.x4, x4) || other.x4 == x4)&&(identical(other.y4, y4) || other.y4 == y4)&&(identical(other.boxScore, boxScore) || other.boxScore == boxScore)&&(identical(other.textScore, textScore) || other.textScore == textScore)&&(identical(other.text, text) || other.text == text)&&(identical(other.isVisible, isVisible) || other.isVisible == isVisible));
}


@override
int get hashCode => Object.hash(runtimeType,id,assetId,x1,y1,x2,y2,x3,y3,x4,y4,boxScore,textScore,text,isVisible);

@override
String toString() {
  return 'Ocr(id: $id, assetId: $assetId, x1: $x1, y1: $y1, x2: $x2, y2: $y2, x3: $x3, y3: $y3, x4: $x4, y4: $y4, boxScore: $boxScore, textScore: $textScore, text: $text, isVisible: $isVisible)';
}


}

/// @nodoc
abstract mixin class $OcrCopyWith<$Res>  {
  factory $OcrCopyWith(Ocr value, $Res Function(Ocr) _then) = _$OcrCopyWithImpl;
@useResult
$Res call({
 String id, String assetId, double x1, double y1, double x2, double y2, double x3, double y3, double x4, double y4, double boxScore, double textScore, String text, bool isVisible
});




}
/// @nodoc
class _$OcrCopyWithImpl<$Res>
    implements $OcrCopyWith<$Res> {
  _$OcrCopyWithImpl(this._self, this._then);

  final Ocr _self;
  final $Res Function(Ocr) _then;

/// Create a copy of Ocr
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? assetId = null,Object? x1 = null,Object? y1 = null,Object? x2 = null,Object? y2 = null,Object? x3 = null,Object? y3 = null,Object? x4 = null,Object? y4 = null,Object? boxScore = null,Object? textScore = null,Object? text = null,Object? isVisible = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,assetId: null == assetId ? _self.assetId : assetId // ignore: cast_nullable_to_non_nullable
as String,x1: null == x1 ? _self.x1 : x1 // ignore: cast_nullable_to_non_nullable
as double,y1: null == y1 ? _self.y1 : y1 // ignore: cast_nullable_to_non_nullable
as double,x2: null == x2 ? _self.x2 : x2 // ignore: cast_nullable_to_non_nullable
as double,y2: null == y2 ? _self.y2 : y2 // ignore: cast_nullable_to_non_nullable
as double,x3: null == x3 ? _self.x3 : x3 // ignore: cast_nullable_to_non_nullable
as double,y3: null == y3 ? _self.y3 : y3 // ignore: cast_nullable_to_non_nullable
as double,x4: null == x4 ? _self.x4 : x4 // ignore: cast_nullable_to_non_nullable
as double,y4: null == y4 ? _self.y4 : y4 // ignore: cast_nullable_to_non_nullable
as double,boxScore: null == boxScore ? _self.boxScore : boxScore // ignore: cast_nullable_to_non_nullable
as double,textScore: null == textScore ? _self.textScore : textScore // ignore: cast_nullable_to_non_nullable
as double,text: null == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String,isVisible: null == isVisible ? _self.isVisible : isVisible // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [Ocr].
extension OcrPatterns on Ocr {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Ocr value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Ocr() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Ocr value)  $default,){
final _that = this;
switch (_that) {
case _Ocr():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Ocr value)?  $default,){
final _that = this;
switch (_that) {
case _Ocr() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String assetId,  double x1,  double y1,  double x2,  double y2,  double x3,  double y3,  double x4,  double y4,  double boxScore,  double textScore,  String text,  bool isVisible)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Ocr() when $default != null:
return $default(_that.id,_that.assetId,_that.x1,_that.y1,_that.x2,_that.y2,_that.x3,_that.y3,_that.x4,_that.y4,_that.boxScore,_that.textScore,_that.text,_that.isVisible);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String assetId,  double x1,  double y1,  double x2,  double y2,  double x3,  double y3,  double x4,  double y4,  double boxScore,  double textScore,  String text,  bool isVisible)  $default,) {final _that = this;
switch (_that) {
case _Ocr():
return $default(_that.id,_that.assetId,_that.x1,_that.y1,_that.x2,_that.y2,_that.x3,_that.y3,_that.x4,_that.y4,_that.boxScore,_that.textScore,_that.text,_that.isVisible);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String assetId,  double x1,  double y1,  double x2,  double y2,  double x3,  double y3,  double x4,  double y4,  double boxScore,  double textScore,  String text,  bool isVisible)?  $default,) {final _that = this;
switch (_that) {
case _Ocr() when $default != null:
return $default(_that.id,_that.assetId,_that.x1,_that.y1,_that.x2,_that.y2,_that.x3,_that.y3,_that.x4,_that.y4,_that.boxScore,_that.textScore,_that.text,_that.isVisible);case _:
  return null;

}
}

}

/// @nodoc


class _Ocr implements Ocr {
  const _Ocr({required this.id, required this.assetId, required this.x1, required this.y1, required this.x2, required this.y2, required this.x3, required this.y3, required this.x4, required this.y4, required this.boxScore, required this.textScore, required this.text, required this.isVisible});
  

@override final  String id;
@override final  String assetId;
@override final  double x1;
@override final  double y1;
@override final  double x2;
@override final  double y2;
@override final  double x3;
@override final  double y3;
@override final  double x4;
@override final  double y4;
@override final  double boxScore;
@override final  double textScore;
@override final  String text;
@override final  bool isVisible;

/// Create a copy of Ocr
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OcrCopyWith<_Ocr> get copyWith => __$OcrCopyWithImpl<_Ocr>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Ocr&&(identical(other.id, id) || other.id == id)&&(identical(other.assetId, assetId) || other.assetId == assetId)&&(identical(other.x1, x1) || other.x1 == x1)&&(identical(other.y1, y1) || other.y1 == y1)&&(identical(other.x2, x2) || other.x2 == x2)&&(identical(other.y2, y2) || other.y2 == y2)&&(identical(other.x3, x3) || other.x3 == x3)&&(identical(other.y3, y3) || other.y3 == y3)&&(identical(other.x4, x4) || other.x4 == x4)&&(identical(other.y4, y4) || other.y4 == y4)&&(identical(other.boxScore, boxScore) || other.boxScore == boxScore)&&(identical(other.textScore, textScore) || other.textScore == textScore)&&(identical(other.text, text) || other.text == text)&&(identical(other.isVisible, isVisible) || other.isVisible == isVisible));
}


@override
int get hashCode => Object.hash(runtimeType,id,assetId,x1,y1,x2,y2,x3,y3,x4,y4,boxScore,textScore,text,isVisible);

@override
String toString() {
  return 'Ocr(id: $id, assetId: $assetId, x1: $x1, y1: $y1, x2: $x2, y2: $y2, x3: $x3, y3: $y3, x4: $x4, y4: $y4, boxScore: $boxScore, textScore: $textScore, text: $text, isVisible: $isVisible)';
}


}

/// @nodoc
abstract mixin class _$OcrCopyWith<$Res> implements $OcrCopyWith<$Res> {
  factory _$OcrCopyWith(_Ocr value, $Res Function(_Ocr) _then) = __$OcrCopyWithImpl;
@override @useResult
$Res call({
 String id, String assetId, double x1, double y1, double x2, double y2, double x3, double y3, double x4, double y4, double boxScore, double textScore, String text, bool isVisible
});




}
/// @nodoc
class __$OcrCopyWithImpl<$Res>
    implements _$OcrCopyWith<$Res> {
  __$OcrCopyWithImpl(this._self, this._then);

  final _Ocr _self;
  final $Res Function(_Ocr) _then;

/// Create a copy of Ocr
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? assetId = null,Object? x1 = null,Object? y1 = null,Object? x2 = null,Object? y2 = null,Object? x3 = null,Object? y3 = null,Object? x4 = null,Object? y4 = null,Object? boxScore = null,Object? textScore = null,Object? text = null,Object? isVisible = null,}) {
  return _then(_Ocr(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,assetId: null == assetId ? _self.assetId : assetId // ignore: cast_nullable_to_non_nullable
as String,x1: null == x1 ? _self.x1 : x1 // ignore: cast_nullable_to_non_nullable
as double,y1: null == y1 ? _self.y1 : y1 // ignore: cast_nullable_to_non_nullable
as double,x2: null == x2 ? _self.x2 : x2 // ignore: cast_nullable_to_non_nullable
as double,y2: null == y2 ? _self.y2 : y2 // ignore: cast_nullable_to_non_nullable
as double,x3: null == x3 ? _self.x3 : x3 // ignore: cast_nullable_to_non_nullable
as double,y3: null == y3 ? _self.y3 : y3 // ignore: cast_nullable_to_non_nullable
as double,x4: null == x4 ? _self.x4 : x4 // ignore: cast_nullable_to_non_nullable
as double,y4: null == y4 ? _self.y4 : y4 // ignore: cast_nullable_to_non_nullable
as double,boxScore: null == boxScore ? _self.boxScore : boxScore // ignore: cast_nullable_to_non_nullable
as double,textScore: null == textScore ? _self.textScore : textScore // ignore: cast_nullable_to_non_nullable
as double,text: null == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String,isVisible: null == isVisible ? _self.isVisible : isVisible // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
