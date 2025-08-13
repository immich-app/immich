package app.alextran.immich

import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.module.AppGlideModule

@GlideModule
class AppGlideModule : AppGlideModule() {
    override fun applyOptions(context: Context, builder: GlideBuilder) {
        super.applyOptions(context, builder)
        // disable caching as this is already done on the Flutter side
        builder.setMemoryCache(MemoryCacheAdapter())
        builder.setDiskCache(DiskCacheAdapter.Factory())
        builder.setBitmapPool(BitmapPoolAdapter())
    }
}
