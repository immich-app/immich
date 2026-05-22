// Copyright (c) 2023 Evan Wallace
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

// changed signature and allocation method to avoid automatic GC
func thumbHashToRGBA(hash: Data) -> (Int, Int, UnsafeMutableRawBufferPointer) {
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
  let pointer = UnsafeMutableRawBufferPointer.allocate(
    byteCount: w * h * 4,
    alignment: MemoryLayout<UInt8>.alignment
  )
  var rgba = pointer.baseAddress!.assumingMemoryBound(to: UInt8.self)
  let cx_stop = max(lx, hasAlpha ? 5 : 3)
  let cy_stop = max(ly, hasAlpha ? 5 : 3)
  var fx = [Float32](repeating: 0, count: cx_stop)
  var fy = [Float32](repeating: 0, count: cy_stop)
  fx.withUnsafeMutableBytes { fx in
    let fx = fx.baseAddress!.bindMemory(to: Float32.self, capacity: fx.count)
    fy.withUnsafeMutableBytes { fy in
      let fy = fy.baseAddress!.bindMemory(to: Float32.self, capacity: fy.count)
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
  return (w, h, pointer)
}

func thumbHashToApproximateAspectRatio(hash: Data) -> Float32 {
  let header = hash[3]
  let hasAlpha = (hash[2] & 0x80) != 0
  let isLandscape = (hash[4] & 0x80) != 0
  let lx = isLandscape ? hasAlpha ? 5 : 7 : header & 7
  let ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7
  return Float32(lx) / Float32(ly)
}
