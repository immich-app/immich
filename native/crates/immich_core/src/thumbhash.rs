// Copyright (c) 2023 Evan Wallace
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

use std::f32::consts::PI;

pub fn decode(hash: &[u8]) -> Option<(u32, u32, [u8; 32 * 32 * 4])> {
    // Read the constants
    let &[h0, h1, h2, h3, h4] = hash.first_chunk()?;
    let header24 = u32::from(h0) | u32::from(h1) << 8 | u32::from(h2) << 16;
    let header16 = u16::from_le_bytes([h3, h4]);
    let l_dc = (header24 & 63) as f32 / 63.0;
    let p_dc = ((header24 >> 6) & 63) as f32 / 31.5 - 1.0;
    let q_dc = ((header24 >> 12) & 63) as f32 / 31.5 - 1.0;
    let has_alpha = header24 >> 23 != 0;
    let is_landscape = header16 >> 15 != 0;
    let long = if has_alpha { 5 } else { 7 };
    let short = usize::from(header16 & 7);
    if short == 0 {
        return None;
    }
    let lx = (if is_landscape { long } else { short }).max(3);
    let ly = (if is_landscape { short } else { long }).max(3);
    let alpha = if has_alpha { *hash.get(5)? } else { 15 };
    let a_dc = (alpha & 15) as f32 / 15.0;
    // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
    let ac_start = if has_alpha { 6 } else { 5 };
    let mut ac_index = 0;
    let mut channel = |nx, ny, scale| -> Option<[f32; 49]> {
        let mut ac = [0.0; 49];
        let mut j = 0;
        for cy in 0..ny {
            for _ in (usize::from(cy == 0)..nx).take_while(|cx| cx * ny < nx * (ny - cy)) {
                let value = (hash.get(ac_start + (ac_index >> 1))? >> ((ac_index & 1) * 4)) & 15;
                ac[j] = (value as f32 / 7.5 - 1.0) * scale;
                ac_index += 1;
                j += 1;
            }
        }
        Some(ac)
    };
    let l_ac = channel(lx, ly, ((header24 >> 18) & 31) as f32 / 31.0)?;
    let p_ac = channel(3, 3, ((header16 >> 3) & 63) as f32 / 63.0 * 1.25)?;
    let q_ac = channel(3, 3, ((header16 >> 9) & 63) as f32 / 63.0 * 1.25)?;
    let a_ac = if has_alpha {
        channel(5, 5, (alpha >> 4) as f32 / 15.0)?
    } else {
        [0.0; 49]
    };
    // Decode using the DCT into RGB
    let ratio = if is_landscape {
        long as f32 / short as f32
    } else {
        short as f32 / long as f32
    };
    let w = (if ratio > 1.0 { 32.0 } else { 32.0 * ratio }).round() as u32;
    let h = (if ratio > 1.0 { 32.0 / ratio } else { 32.0 }).round() as u32;
    let mut rgba = [0; 32 * 32 * 4];
    let channels = [(&l_ac, lx, ly), (&p_ac, 3, 3), (&q_ac, 3, 3), (&a_ac, 5, 5)];
    let count = if has_alpha { 4 } else { 3 };
    for y in 0..h {
        for x in 0..w {
            // Precompute the coefficients
            let fx: [f32; 7] =
                std::array::from_fn(|cx| (PI / w as f32 * (x as f32 + 0.5) * cx as f32).cos());
            let fy: [f32; 7] =
                std::array::from_fn(|cy| (PI / h as f32 * (y as f32 + 0.5) * cy as f32).cos());
            let mut lpqa = [l_dc, p_dc, q_dc, a_dc];
            for (sum, &(ac, nx, ny)) in lpqa.iter_mut().zip(&channels[..count]) {
                let mut j = 0;
                for (cy, fy) in fy.iter().enumerate().take(ny) {
                    let fy2 = fy * 2.0;
                    for cx in (usize::from(cy == 0)..nx).take_while(|cx| cx * ny < nx * (ny - cy)) {
                        *sum += ac[j] * fx[cx] * fy2;
                        j += 1;
                    }
                }
            }
            // Convert to RGB
            let [l, p, q, a] = lpqa;
            let b = l - 2.0 / 3.0 * p;
            let r = (3.0 * l - b + q) / 2.0;
            let g = r - q;
            let i = ((y * w + x) * 4) as usize;
            for (dst, value) in rgba[i..i + 4].iter_mut().zip([r, g, b, a]) {
                *dst = (255.0 * value.min(1.0)).round().max(0.0) as u8;
            }
        }
    }
    Some((w, h, rgba))
}
