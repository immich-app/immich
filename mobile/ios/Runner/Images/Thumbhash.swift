import Foundation

// NOTE: Swift has an exponential-time type checker and compiling very simple
// expressions can easily take many seconds, especially when expressions involve
// numeric type constructors.
//
// This file deliberately breaks compound expressions up into separate variables
// to improve compile time even though this comes at the expense of readability.
// This is a known workaround for this deficiency in the Swift compiler.
//
// The following command is helpful when debugging Swift compile time issues:
//
//     swiftc ThumbHash.swift -Xfrontend -debug-time-function-bodies
//
// These optimizations brought the compile time for this file from around 2.5
// seconds to around 250ms (10x faster).

// NOTE: Swift's debug-build performance of for-in loops over numeric ranges is
// really awful. Debug builds compile a very generic indexing iterator thing
// that makes many nested calls for every iteration, which makes debug-build
// performance crawl.
//
// This file deliberately avoids for-in loops that loop for more than a few
// times to improve debug-build run time even though this comes at the expense
// of readability. Similarly unsafe pointers are used instead of array getters
// to avoid unnecessary bounds checks, which have extra overhead in debug builds.
//
// These optimizations brought the run time to encode and decode 10 ThumbHashes
// in debug mode from 700ms to 70ms (10x faster).

func rgbaToThumbHash(w: Int, h: Int, rgba: Data) -> Data {
  // Encoding an image larger than 100x100 is slow with no benefit
  assert(w <= 100 && h <= 100)
  assert(rgba.count == w * h * 4)

  // Determine the average color
  var avg_r: Float32 = 0
  var avg_g: Float32 = 0
  var avg_b: Float32 = 0
  var avg_a: Float32 = 0
  rgba.withUnsafeBytes { rgba in
    var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
    let n = w * h
    var i = 0
    while i < n {
      let alpha = Float32(rgba[3]) / 255
      avg_r += alpha / 255 * Float32(rgba[0])
      avg_g += alpha / 255 * Float32(rgba[1])
      avg_b += alpha / 255 * Float32(rgba[2])
      avg_a += alpha
      rgba = rgba.advanced(by: 4)
      i += 1
    }
  }
  if avg_a > 0 {
    avg_r /= avg_a
    avg_g /= avg_a
    avg_b /= avg_a
  }

  let hasAlpha = avg_a < Float32(w * h)
  let l_limit = hasAlpha ? 5 : 7 // Use fewer luminance bits if there's alpha
  let imax_wh = max(w, h)
  let iwl_limit = l_limit * w
  let ihl_limit = l_limit * h
  let fmax_wh = Float32(imax_wh)
  let fwl_limit = Float32(iwl_limit)
  let fhl_limit = Float32(ihl_limit)
  let flx = round(fwl_limit / fmax_wh)
  let fly = round(fhl_limit / fmax_wh)
  var lx = Int(flx)
  var ly = Int(fly)
  lx = max(1, lx)
  ly = max(1, ly)
  var lpqa = [Float32](repeating: 0, count: w * h * 4)

  // Convert the image from RGBA to LPQA (composite atop the average color)
  rgba.withUnsafeBytes { rgba in
    lpqa.withUnsafeMutableBytes { lpqa in
      var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
      var lpqa = lpqa.baseAddress!.bindMemory(to: Float32.self, capacity: lpqa.count)
      let n = w * h
      var i = 0
      while i < n {
        let alpha = Float32(rgba[3]) / 255
        let r = avg_r * (1 - alpha) + alpha / 255 * Float32(rgba[0])
        let g = avg_g * (1 - alpha) + alpha / 255 * Float32(rgba[1])
        let b = avg_b * (1 - alpha) + alpha / 255 * Float32(rgba[2])
        lpqa[0] = (r + g + b) / 3
        lpqa[1] = (r + g) / 2 - b
        lpqa[2] = r - g
        lpqa[3] = alpha
        rgba = rgba.advanced(by: 4)
        lpqa = lpqa.advanced(by: 4)
        i += 1
      }
    }
  }

  // Encode using the DCT into DC (constant) and normalized AC (varying) terms
  let encodeChannel = { (channel: UnsafePointer<Float32>, nx: Int, ny: Int) -> (Float32, [Float32], Float32) in
    var dc: Float32 = 0
    var ac: [Float32] = []
    var scale: Float32 = 0
    var fx = [Float32](repeating: 0, count: w)
    fx.withUnsafeMutableBytes { fx in
      let fx = fx.baseAddress!.bindMemory(to: Float32.self, capacity: fx.count)
      var cy = 0
      while cy < ny {
        var cx = 0
        while cx * ny < nx * (ny - cy) {
          var ptr = channel
          var f: Float32 = 0
          var x = 0
          while x < w {
            let fw = Float32(w)
            let fxx = Float32(x)
            let fcx = Float32(cx)
            fx[x] = cos(Float32.pi / fw * fcx * (fxx + 0.5))
            x += 1
          }
          var y = 0
          while y < h {
            let fh = Float32(h)
            let fyy = Float32(y)
            let fcy = Float32(cy)
            let fy = cos(Float32.pi / fh * fcy * (fyy + 0.5))
            var x = 0
            while x < w {
              f += ptr.pointee * fx[x] * fy
              x += 1
              ptr = ptr.advanced(by: 4)
            }
            y += 1
          }
          f /= Float32(w * h)
          if cx > 0 || cy > 0 {
            ac.append(f)
            scale = max(scale, abs(f))
          } else {
            dc = f
          }
          cx += 1
        }
        cy += 1
      }
    }
    if scale > 0 {
      let n = ac.count
      var i = 0
      while i < n {
        ac[i] = 0.5 + 0.5 / scale * ac[i]
        i += 1
      }
    }
    return (dc, ac, scale)
  }
  let (
    (l_dc, l_ac, l_scale),
    (p_dc, p_ac, p_scale),
    (q_dc, q_ac, q_scale),
    (a_dc, a_ac, a_scale)
  ) = lpqa.withUnsafeBytes { lpqa in
    let lpqa = lpqa.baseAddress!.bindMemory(to: Float32.self, capacity: lpqa.count)
    return (
      encodeChannel(lpqa, max(3, lx), max(3, ly)),
      encodeChannel(lpqa.advanced(by: 1), 3, 3),
      encodeChannel(lpqa.advanced(by: 2), 3, 3),
      hasAlpha ? encodeChannel(lpqa.advanced(by: 3), 5, 5) : (1, [], 1)
    )
  }

  // Write the constants
  let isLandscape = w > h
  let fl_dc = round(63.0 * l_dc)
  let fp_dc = round(31.5 + 31.5 * p_dc)
  let fq_dc = round(31.5 + 31.5 * q_dc)
  let fl_scale = round(31.0 * l_scale)
  let il_dc = UInt32(fl_dc)
  let ip_dc = UInt32(fp_dc)
  let iq_dc = UInt32(fq_dc)
  let il_scale = UInt32(fl_scale)
  let ihasAlpha = UInt32(hasAlpha ? 1 : 0)
  let header24 = il_dc | (ip_dc << 6) | (iq_dc << 12) | (il_scale << 18) | (ihasAlpha << 23)
  let fp_scale = round(63.0 * p_scale)
  let fq_scale = round(63.0 * q_scale)
  let ilxy = UInt16(isLandscape ? ly : lx)
  let ip_scale = UInt16(fp_scale)
  let iq_scale = UInt16(fq_scale)
  let iisLandscape = UInt16(isLandscape ? 1 : 0)
  let header16 = ilxy | (ip_scale << 3) | (iq_scale << 9) | (iisLandscape << 15)
  var hash = Data(capacity: 25)
  hash.append(UInt8(header24 & 255))
  hash.append(UInt8((header24 >> 8) & 255))
  hash.append(UInt8(header24 >> 16))
  hash.append(UInt8(header16 & 255))
  hash.append(UInt8(header16 >> 8))
  var isOdd = false
  if hasAlpha {
    let fa_dc = round(15.0 * a_dc)
    let fa_scale = round(15.0 * a_scale)
    let ia_dc = UInt8(fa_dc)
    let ia_scale = UInt8(fa_scale)
    hash.append(ia_dc | (ia_scale << 4))
  }

  // Write the varying factors
  for ac in [l_ac, p_ac, q_ac] {
    for f in ac {
      let f15 = round(15.0 * f)
      let i15 = UInt8(f15)
      if isOdd {
        hash[hash.count - 1] |= i15 << 4
      } else {
        hash.append(i15)
      }
      isOdd = !isOdd
    }
  }
  if hasAlpha {
    for f in a_ac {
      let f15 = round(15.0 * f)
      let i15 = UInt8(f15)
      if isOdd {
        hash[hash.count - 1] |= i15 << 4
      } else {
        hash.append(i15)
      }
      isOdd = !isOdd
    }
  }
  return hash
}

func thumbHashToRGBA(hash: Data) -> (Int, Int, Data) {
  // Read the constants
  let h0 = UInt32(hash[0])
  let h1 = UInt32(hash[1])
  let h2 = UInt32(hash[2])
  let h3 = UInt16(hash[3])
  let h4 = UInt16(hash[4])
  let header24 = h0 | (h1 << 8) | (h2 << 16)
  let header16 = h3 | (h4 << 8)
  let il_dc = header24 & 63
  let ip_dc = (header24 >> 6) & 63
  let iq_dc = (header24 >> 12) & 63
  var l_dc = Float32(il_dc)
  var p_dc = Float32(ip_dc)
  var q_dc = Float32(iq_dc)
  l_dc = l_dc / 63
  p_dc = p_dc / 31.5 - 1
  q_dc = q_dc / 31.5 - 1
  let il_scale = (header24 >> 18) & 31
  var l_scale = Float32(il_scale)
  l_scale = l_scale / 31
  let hasAlpha = (header24 >> 23) != 0
  let ip_scale = (header16 >> 3) & 63
  let iq_scale = (header16 >> 9) & 63
  var p_scale = Float32(ip_scale)
  var q_scale = Float32(iq_scale)
  p_scale = p_scale / 63
  q_scale = q_scale / 63
  let isLandscape = (header16 >> 15) != 0
  let lx16 = max(3, isLandscape ? hasAlpha ? 5 : 7 : header16 & 7)
  let ly16 = max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7)
  let lx = Int(lx16)
  let ly = Int(ly16)
  var a_dc = Float32(1)
  var a_scale = Float32(1)
  if hasAlpha {
    let ia_dc = hash[5] & 15
    let ia_scale = hash[5] >> 4
    a_dc = Float32(ia_dc)
    a_scale = Float32(ia_scale)
    a_dc /= 15
    a_scale /= 15
  }

  // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
  let ac_start = hasAlpha ? 6 : 5
  var ac_index = 0
  let decodeChannel = { (nx: Int, ny: Int, scale: Float32) -> [Float32] in
    var ac: [Float32] = []
    for cy in 0 ..< ny {
      var cx = cy > 0 ? 0 : 1
      while cx * ny < nx * (ny - cy) {
        let iac = (hash[ac_start + (ac_index >> 1)] >> ((ac_index & 1) << 2)) & 15;
        var fac = Float32(iac)
        fac = (fac / 7.5 - 1) * scale
        ac.append(fac)
        ac_index += 1
        cx += 1
      }
    }
    return ac
  }
  let l_ac = decodeChannel(lx, ly, l_scale)
  let p_ac = decodeChannel(3, 3, p_scale * 1.25)
  let q_ac = decodeChannel(3, 3, q_scale * 1.25)
  let a_ac = hasAlpha ? decodeChannel(5, 5, a_scale) : []

  // Decode using the DCT into RGB
  let ratio = thumbHashToApproximateAspectRatio(hash: hash)
  let fw = round(ratio > 1 ? 32 : 32 * ratio)
  let fh = round(ratio > 1 ? 32 / ratio : 32)
  let w = Int(fw)
  let h = Int(fh)
  var rgba = Data(count: w * h * 4)
  let cx_stop = max(lx, hasAlpha ? 5 : 3)
  let cy_stop = max(ly, hasAlpha ? 5 : 3)
  var fx = [Float32](repeating: 0, count: cx_stop)
  var fy = [Float32](repeating: 0, count: cy_stop)
  fx.withUnsafeMutableBytes { fx in
    let fx = fx.baseAddress!.bindMemory(to: Float32.self, capacity: fx.count)
    fy.withUnsafeMutableBytes { fy in
      let fy = fy.baseAddress!.bindMemory(to: Float32.self, capacity: fy.count)
      rgba.withUnsafeMutableBytes { rgba in
        var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
        var y = 0
        while y < h {
          var x = 0
          while x < w {
            var l = l_dc
            var p = p_dc
            var q = q_dc
            var a = a_dc

            // Precompute the coefficients
            var cx = 0
            while cx < cx_stop {
              let fw = Float32(w)
              let fxx = Float32(x)
              let fcx = Float32(cx)
              fx[cx] = cos(Float32.pi / fw * (fxx + 0.5) * fcx)
              cx += 1
            }
            var cy = 0
            while cy < cy_stop {
              let fh = Float32(h)
              let fyy = Float32(y)
              let fcy = Float32(cy)
              fy[cy] = cos(Float32.pi / fh * (fyy + 0.5) * fcy)
              cy += 1
            }

            // Decode L
            var j = 0
            cy = 0
            while cy < ly {
              var cx = cy > 0 ? 0 : 1
              let fy2 = fy[cy] * 2
              while cx * ly < lx * (ly - cy) {
                l += l_ac[j] * fx[cx] * fy2
                j += 1
                cx += 1
              }
              cy += 1
            }

            // Decode P and Q
            j = 0
            cy = 0
            while cy < 3 {
              var cx = cy > 0 ? 0 : 1
              let fy2 = fy[cy] * 2
              while cx < 3 - cy {
                let f = fx[cx] * fy2
                p += p_ac[j] * f
                q += q_ac[j] * f
                j += 1
                cx += 1
              }
              cy += 1
            }

            // Decode A
            if hasAlpha {
              j = 0
              cy = 0
              while cy < 5 {
                var cx = cy > 0 ? 0 : 1
                let fy2 = fy[cy] * 2
                while cx < 5 - cy {
                  a += a_ac[j] * fx[cx] * fy2
                  j += 1
                  cx += 1
                }
                cy += 1
              }
            }

            // Convert to RGB
            var b = l - 2 / 3 * p
            var r = (3 * l - b + q) / 2
            var g = r - q
            r = max(0, 255 * min(1, r))
            g = max(0, 255 * min(1, g))
            b = max(0, 255 * min(1, b))
            a = max(0, 255 * min(1, a))
            rgba[0] = UInt8(r)
            rgba[1] = UInt8(g)
            rgba[2] = UInt8(b)
            rgba[3] = UInt8(a)
            rgba = rgba.advanced(by: 4)
            x += 1
          }
          y += 1
        }
      }
    }
  }
  return (w, h, rgba)
}

func thumbHashToAverageRGBA(hash: Data) -> (Float32, Float32, Float32, Float32) {
  let h0 = UInt32(hash[0])
  let h1 = UInt32(hash[1])
  let h2 = UInt32(hash[2])
  let header = h0 | (h1 << 8) | (h2 << 16)
  let il = header & 63
  let ip = (header >> 6) & 63
  let iq = (header >> 12) & 63
  var l = Float32(il)
  var p = Float32(ip)
  var q = Float32(iq)
  l = l / 63
  p = p / 31.5 - 1
  q = q / 31.5 - 1
  let hasAlpha = (header >> 23) != 0
  var a = Float32(1)
  if hasAlpha {
    let ia = hash[5] & 15
    a = Float32(ia)
    a = a / 15
  }
  let b = l - 2 / 3 * p
  let r = (3 * l - b + q) / 2
  let g = r - q
  return (
    max(0, min(1, r)),
    max(0, min(1, g)),
    max(0, min(1, b)),
    a
  )
}

func thumbHashToApproximateAspectRatio(hash: Data) -> Float32 {
  let header = hash[3]
  let hasAlpha = (hash[2] & 0x80) != 0
  let isLandscape = (hash[4] & 0x80) != 0
  let lx = isLandscape ? hasAlpha ? 5 : 7 : header & 7
  let ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7
  return Float32(lx) / Float32(ly)
}

#if os(macOS)
import Cocoa

func imageToThumbHash(image: NSImage) -> Data {
  let size = image.size
  let fw = round(100 * size.width / max(size.width, size.height))
  let fh = round(100 * size.height / max(size.width, size.height))
  let w = Int(fw)
  let h = Int(fh)
  var rgba = Data(count: w * h * 4)
  rgba.withUnsafeMutableBytes { rgba in
    var rect = NSRect(x: 0, y: 0, width: w, height: h)
    if
      let cgImage = image.cgImage(forProposedRect: &rect, context: nil, hints: nil),
      let space = (image.representations[0] as? NSBitmapImageRep)?.colorSpace.cgColorSpace,
      let context = CGContext(
        data: rgba.baseAddress,
        width: w,
        height: h,
        bitsPerComponent: 8,
        bytesPerRow: w * 4,
        space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    {
      context.draw(cgImage, in: rect)

      // Convert from premultiplied alpha to unpremultiplied alpha
      var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
      let n = w * h
      var i = 0
      while i < n {
        let a = UInt16(rgba[3])
        if a > 0 && a < 255 {
          var r = UInt16(rgba[0])
          var g = UInt16(rgba[1])
          var b = UInt16(rgba[2])
          r = min(255, r * 255 / a)
          g = min(255, g * 255 / a)
          b = min(255, b * 255 / a)
          rgba[0] = UInt8(r)
          rgba[1] = UInt8(g)
          rgba[2] = UInt8(b)
        }
        rgba = rgba.advanced(by: 4)
        i += 1
      }
    }
  }
  return rgbaToThumbHash(w: w, h: h, rgba: rgba)
}

func thumbHashToImage(hash: Data) -> NSImage {
  let (w, h, rgba) = thumbHashToRGBA(hash: hash)
  let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: w,
    pixelsHigh: h,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: w * 4,
    bitsPerPixel: 32
  )!
  rgba.withUnsafeBytes { rgba in
    // Convert from unpremultiplied alpha to premultiplied alpha
    var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
    var to = bitmap.bitmapData!
    let n = w * h
    var i = 0
    while i < n {
      let a = rgba[3]
      if a == 255 {
        to[0] = rgba[0]
        to[1] = rgba[1]
        to[2] = rgba[2]
      } else {
        var r = UInt16(rgba[0])
        var g = UInt16(rgba[1])
        var b = UInt16(rgba[2])
        let a = UInt16(a)
        r = min(255, r * a / 255)
        g = min(255, g * a / 255)
        b = min(255, b * a / 255)
        to[0] = UInt8(r)
        to[1] = UInt8(g)
        to[2] = UInt8(b)
      }
      to[3] = a
      rgba = rgba.advanced(by: 4)
      to = to.advanced(by: 4)
      i += 1
    }
  }
  let image = NSImage(size: NSSize(width: w, height: h))
  image.addRepresentation(bitmap)
  return image
}
#endif

#if os(iOS)
import UIKit

func imageToThumbHash(image: UIImage) -> Data {
  let size = image.size
  let w = Int(round(100 * size.width / max(size.width, size.height)))
  let h = Int(round(100 * size.height / max(size.width, size.height)))
  var rgba = Data(count: w * h * 4)
  rgba.withUnsafeMutableBytes { rgba in
    if
      let space = image.cgImage?.colorSpace,
      let context = CGContext(
        data: rgba.baseAddress,
        width: w,
        height: h,
        bitsPerComponent: 8,
        bytesPerRow: w * 4,
        space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    {
      // EXIF orientation only works if you draw the UIImage, not the CGImage
      context.concatenate(CGAffineTransform(1, 0, 0, -1, 0, CGFloat(h)))
      UIGraphicsPushContext(context)
      image.draw(in: CGRect(x: 0, y: 0, width: w, height: h))
      UIGraphicsPopContext()

      // Convert from premultiplied alpha to unpremultiplied alpha
      var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
      let n = w * h
      var i = 0
      while i < n {
        let a = UInt16(rgba[3])
        if a > 0 && a < 255 {
          var r = UInt16(rgba[0])
          var g = UInt16(rgba[1])
          var b = UInt16(rgba[2])
          r = min(255, r * 255 / a)
          g = min(255, g * 255 / a)
          b = min(255, b * 255 / a)
          rgba[0] = UInt8(r)
          rgba[1] = UInt8(g)
          rgba[2] = UInt8(b)
        }
        rgba = rgba.advanced(by: 4)
        i += 1
      }
    }
  }
  return rgbaToThumbHash(w: w, h: h, rgba: rgba)
}

func thumbHashToImage(hash: Data) -> UIImage {
  var (w, h, rgba) = thumbHashToRGBA(hash: hash)
  rgba.withUnsafeMutableBytes { rgba in
    // Convert from unpremultiplied alpha to premultiplied alpha
    var rgba = rgba.baseAddress!.bindMemory(to: UInt8.self, capacity: rgba.count)
    let n = w * h
    var i = 0
    while i < n {
      let a = UInt16(rgba[3])
      if a < 255 {
        var r = UInt16(rgba[0])
        var g = UInt16(rgba[1])
        var b = UInt16(rgba[2])
        r = min(255, r * a / 255)
        g = min(255, g * a / 255)
        b = min(255, b * a / 255)
        rgba[0] = UInt8(r)
        rgba[1] = UInt8(g)
        rgba[2] = UInt8(b)
      }
      rgba = rgba.advanced(by: 4)
      i += 1
    }
  }
  let image = CGImage(
    width: w,
    height: h,
    bitsPerComponent: 8,
    bitsPerPixel: 32,
    bytesPerRow: w * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGBitmapInfo(rawValue: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue),
    provider: CGDataProvider(data: rgba as CFData)!,
    decode: nil,
    shouldInterpolate: true,
    intent: .perceptual
  )
  return UIImage(cgImage: image!)
}
#endif
