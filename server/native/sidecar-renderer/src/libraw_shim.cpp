// An application adapter to LibRaw's documented public API; no decoder code.
#include <libraw/libraw.h>
#include <cmath>
#include <cstdio>
#include <exception>

extern "C" {
struct ImmichRawImage {
  libraw_processed_image_t *owner;
  const unsigned char *data;
  unsigned int data_len;
  unsigned int width;
  unsigned int height;
  unsigned int channels;
  unsigned int orientation;
  double camera_wb[3];
  double daylight_wb[3];
  double camera_to_srgb[9];
};

const char *immich_libraw_version() { return LibRaw::version(); }

void immich_raw_free(libraw_processed_image_t *image) {
  LibRaw::dcraw_clear_mem(image);
}

static void read_header(const LibRaw &raw, ImmichRawImage *output) {
  const unsigned int orientation[] = {1, 2, 4, 3, 5, 8, 6, 7};
  const int flip = raw.imgdata.sizes.flip;
  output->orientation = flip >= 0 && flip < 8 ? orientation[flip] : 1;
  for (unsigned int c = 0; c < 3; ++c) {
    output->camera_wb[c] = raw.imgdata.color.cam_mul[c];
    output->daylight_wb[c] = raw.imgdata.color.pre_mul[c];
    for (unsigned int j = 0; j < 3; ++j)
      output->camera_to_srgb[c * 3 + j] = raw.imgdata.color.rgb_cam[c][j];
  }
}

// Metadata only: opening the header never unpacks or demosaics the sensor image.
int immich_raw_metadata(const char *path, ImmichRawImage *output,
                        char *error, unsigned int error_len) {
  try {
    LibRaw raw(LIBRAW_OPTIONS_NO_DATAERR_CALLBACK);
    const int code = raw.open_file(path);
    if (code != LIBRAW_SUCCESS) {
      std::snprintf(error, error_len, "RAW metadata: %s", LibRaw::strerror(code));
      return -1;
    }
    read_header(raw, output);
    return 0;
  } catch (const std::exception &e) {
    std::snprintf(error, error_len, "RAW metadata: %s", e.what());
    return -1;
  } catch (...) {
    std::snprintf(error, error_len, "LibRaw raised an unknown metadata exception");
    return -1;
  }
}

// 0 = RAW developed, 1 = not a LibRaw input, -1 = error.
int immich_raw_decode(const char *path, ImmichRawImage *output,
                      char *error, unsigned int error_len) {
  try {
    LibRaw raw(LIBRAW_OPTIONS_NO_DATAERR_CALLBACK);
    auto fail = [&](const char *stage, int code) {
      std::snprintf(error, error_len, "%s: %s", stage, LibRaw::strerror(code));
      return -1;
    };
    int code = raw.open_file(path);
    if (code == LIBRAW_FILE_UNSUPPORTED) return 1;
    if (code != LIBRAW_SUCCESS) return fail("RAW open", code);
    const auto pixels = static_cast<unsigned long long>(raw.imgdata.sizes.width)
                        * raw.imgdata.sizes.height;
    if (pixels == 0 || pixels > 100000000) {
      std::snprintf(error, error_len, "RAW source exceeds 100 million pixels");
      return -1;
    }
    read_header(raw, output);
    auto &params = raw.imgdata.params;
    params.output_color = 8; // Rec.2020, D65
    params.output_bps = 16;
    params.gamm[0] = params.gamm[1] = 1.0; // linear transfer
    params.use_camera_wb = 1;
    params.use_auto_wb = 0;
    raw.imgdata.rawparams.options |= LIBRAW_RAWOPTIONS_CAMERAWB_FALLBACK_TO_DAYLIGHT;
    params.no_auto_bright = 1;
    params.adjust_maximum_thr = 0.0f;
    params.user_flip = 0; // Rust applies source orientation once.
    params.user_qual = 3; // AHD where the format permits it.
    params.highlight = 3; // Reconstruct clipped sensor highlights before color conversion.
    // Reserve two stops before demosaic. Rust undoes the 1/4 gain in float.
    // This retains some >white headroom and 14-bit sample precision, while
    // the 16-bit LibRaw processing remains an approximation.
    params.exp_correc = 1;
    params.exp_shift = 0.25f;
    params.exp_preser = 0.0f;
    params.bright = 1.0f;
    code = raw.unpack();
    if (code != LIBRAW_SUCCESS) return fail("RAW unpack", code);
    raw.adjust_to_raw_inset_crop(3);
    code = raw.dcraw_process();
    if (code != LIBRAW_SUCCESS) return fail("RAW processing", code);
    auto *image = raw.dcraw_make_mem_image(&code);
    if (!image) return fail("RAW memory output", code);
    if (image->type != LIBRAW_IMAGE_BITMAP || image->bits != 16 ||
        (image->colors != 3 && image->colors != 1) ||
        static_cast<unsigned long long>(image->width) * image->height * image->colors * 2
            != image->data_size) {
      LibRaw::dcraw_clear_mem(image);
      std::snprintf(error, error_len, "Unsupported RAW memory layout");
      return -1;
    }
    output->owner = image;
    output->data = image->data;
    output->data_len = image->data_size;
    output->width = image->width;
    output->height = image->height;
    output->channels = image->colors;
    return 0;
  } catch (const std::exception &e) {
    std::snprintf(error, error_len, "LibRaw: %s", e.what());
    return -1;
  } catch (...) {
    std::snprintf(error, error_len, "LibRaw raised an unknown exception");
    return -1;
  }
}
}
