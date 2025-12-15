
import 'package:pigeon/pigeon.dart';  
  
@ConfigurePigeon(  
  PigeonOptions(  
    dartOut: 'lib/platform/use_as_wallpaper_api.g.dart',  
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/use_as_wallpaper/Messages.g.kt',
    kotlinOptions: KotlinOptions(
      package: 'app.alextran.immich.use_as_wallpaper',
    ),
    dartPackageName: 'immich_mobile',  
  ),  
)  

@HostApi()
abstract class UseAsWallpaperApi {
  @async
  bool useAsWallpaper({required String filePath}); 
}