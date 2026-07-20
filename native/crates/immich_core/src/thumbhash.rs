//! ThumbHash placeholder decoding.
//
// Ported from Evan Wallace's reference implementation:
// Copyright (c) 2023 Evan Wallace
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

struct Header {
    l_dc: f32,
    p_dc: f32,
    q_dc: f32,
    l_scale: f32,
    p_scale: f32,
    q_scale: f32,
    a_dc: f32,
    a_scale: f32,
    has_alpha: bool,
    lx: usize,
    ly: usize,
    ac_start: usize,
    w: usize,
    h: usize,
}

fn ac_len(nx: usize, ny: usize) -> usize {
    let mut n = 0;
    for cy in 0..ny {
        let mut cx = if cy > 0 { 0 } else { 1 };
        while cx * ny < nx * (ny - cy) {
            n += 1;
            cx += 1;
        }
    }
    n
}

fn parse(hash: &[u8]) -> Option<Header> {
    if hash.len() < 5 {
        return None;
    }
    let header24 = (hash[0] as u32) | ((hash[1] as u32) << 8) | ((hash[2] as u32) << 16);
    let header16 = (hash[3] as u32) | ((hash[4] as u32) << 8);
    let has_alpha = (header24 >> 23) != 0;
    if has_alpha && hash.len() < 6 {
        return None;
    }
    let is_landscape = (header16 >> 15) != 0;
    let lx_raw = if is_landscape {
        if has_alpha {
            5
        } else {
            7
        }
    } else {
        (header16 & 7) as usize
    };
    let ly_raw = if is_landscape {
        (header16 & 7) as usize
    } else if has_alpha {
        5
    } else {
        7
    };
    // The format computes size before clamping the component counts.
    if lx_raw == 0 || ly_raw == 0 {
        return None;
    }
    let ratio = lx_raw as f32 / ly_raw as f32;
    let w = (if ratio > 1.0 { 32.0 } else { 32.0 * ratio }).round() as usize;
    let h = (if ratio > 1.0 { 32.0 / ratio } else { 32.0 }).round() as usize;

    let lx = lx_raw.max(3);
    let ly = ly_raw.max(3);
    let ac_start = if has_alpha { 6 } else { 5 };
    let mut nibbles = ac_len(lx, ly) + 2 * ac_len(3, 3);
    if has_alpha {
        nibbles += ac_len(5, 5);
    }
    if hash.len() < ac_start + nibbles.div_ceil(2) {
        return None;
    }

    let (a_dc, a_scale) = if has_alpha {
        ((hash[5] & 15) as f32 / 15.0, (hash[5] >> 4) as f32 / 15.0)
    } else {
        (1.0, 1.0)
    };
    Some(Header {
        l_dc: (header24 & 63) as f32 / 63.0,
        p_dc: ((header24 >> 6) & 63) as f32 / 31.5 - 1.0,
        q_dc: ((header24 >> 12) & 63) as f32 / 31.5 - 1.0,
        l_scale: ((header24 >> 18) & 31) as f32 / 31.0,
        p_scale: ((header16 >> 3) & 63) as f32 / 63.0,
        q_scale: ((header16 >> 9) & 63) as f32 / 63.0,
        a_dc,
        a_scale,
        has_alpha,
        lx,
        ly,
        ac_start,
        w,
        h,
    })
}

fn decode_channel(
    hash: &[u8],
    ac_start: usize,
    ac_index: &mut usize,
    nx: usize,
    ny: usize,
    scale: f32,
) -> Vec<f32> {
    let mut ac = Vec::with_capacity(ac_len(nx, ny));
    for cy in 0..ny {
        let mut cx = if cy > 0 { 0 } else { 1 };
        while cx * ny < nx * (ny - cy) {
            let byte = hash[ac_start + (*ac_index >> 1)];
            let nibble = (byte >> ((*ac_index & 1) << 2)) & 15;
            ac.push((nibble as f32 / 7.5 - 1.0) * scale);
            *ac_index += 1;
            cx += 1;
        }
    }
    ac
}

/// Returns the decoded size, or None for a malformed hash.
pub fn dims(hash: &[u8]) -> Option<(u32, u32)> {
    parse(hash).map(|hdr| (hdr.w as u32, hdr.h as u32))
}

/// Decodes a hash into a caller-owned RGBA8888 buffer.
pub fn to_rgba(hash: &[u8], dst: &mut [u8]) -> bool {
    let Some(hdr) = parse(hash) else {
        return false;
    };
    if dst.len() < hdr.w * hdr.h * 4 {
        return false;
    }

    let mut ac_index = 0;
    let l_ac = decode_channel(
        hash,
        hdr.ac_start,
        &mut ac_index,
        hdr.lx,
        hdr.ly,
        hdr.l_scale,
    );
    let p_ac = decode_channel(hash, hdr.ac_start, &mut ac_index, 3, 3, hdr.p_scale * 1.25);
    let q_ac = decode_channel(hash, hdr.ac_start, &mut ac_index, 3, 3, hdr.q_scale * 1.25);
    let a_ac = if hdr.has_alpha {
        decode_channel(hash, hdr.ac_start, &mut ac_index, 5, 5, hdr.a_scale)
    } else {
        Vec::new()
    };

    let cx_stop = hdr.lx.max(if hdr.has_alpha { 5 } else { 3 });
    let cy_stop = hdr.ly.max(if hdr.has_alpha { 5 } else { 3 });
    let mut fx = vec![0.0f32; cx_stop];
    let mut fy = vec![0.0f32; cy_stop];

    let mut i = 0;
    for y in 0..hdr.h {
        for x in 0..hdr.w {
            let mut l = hdr.l_dc;
            let mut p = hdr.p_dc;
            let mut q = hdr.q_dc;
            let mut a = hdr.a_dc;

            for (cx, f) in fx.iter_mut().enumerate() {
                *f = (std::f64::consts::PI / hdr.w as f64 * (x as f64 + 0.5) * cx as f64).cos()
                    as f32;
            }
            for (cy, f) in fy.iter_mut().enumerate() {
                *f = (std::f64::consts::PI / hdr.h as f64 * (y as f64 + 0.5) * cy as f64).cos()
                    as f32;
            }

            let mut j = 0;
            for (cy, fyv) in fy.iter().enumerate().take(hdr.ly) {
                let fy2 = fyv * 2.0;
                let mut cx = if cy > 0 { 0 } else { 1 };
                while cx * hdr.ly < hdr.lx * (hdr.ly - cy) {
                    l += l_ac[j] * fx[cx] * fy2;
                    j += 1;
                    cx += 1;
                }
            }

            j = 0;
            for (cy, fyv) in fy.iter().enumerate().take(3) {
                let fy2 = fyv * 2.0;
                let start = if cy > 0 { 0 } else { 1 };
                for fxv in &fx[start..3 - cy] {
                    let f = fxv * fy2;
                    p += p_ac[j] * f;
                    q += q_ac[j] * f;
                    j += 1;
                }
            }

            if hdr.has_alpha {
                j = 0;
                for (cy, fyv) in fy.iter().enumerate().take(5) {
                    let fy2 = fyv * 2.0;
                    let start = if cy > 0 { 0 } else { 1 };
                    for fxv in &fx[start..5 - cy] {
                        a += a_ac[j] * fxv * fy2;
                        j += 1;
                    }
                }
            }

            let b = l - 2.0 / 3.0 * p;
            let r = (3.0 * l - b + q) / 2.0;
            let g = r - q;
            dst[i] = to_u8(r);
            dst[i + 1] = to_u8(g);
            dst[i + 2] = to_u8(b);
            dst[i + 3] = to_u8(a);
            i += 4;
        }
    }
    true
}

fn to_u8(v: f32) -> u8 {
    (255.0 * v.clamp(0.0, 1.0)).round() as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    // Captured from the old Swift decoder; channel values may differ by one.
    const OPAQUE_B64: &str = "1QcSHQRnh493V4dIh4eXh1h4kJUI";
    const ALPHA_B64: &str = "1QeSHQR6Z4ePd1eHSIeHl4dYeJCVCIQ8WuEpd7M=";
    const OPAQUE_RGBA_HEX: &str = "404d71ff424f72ff475375ff4d5878ff545d7cff5b6480ff626984ff686e87ff6d7389ff71758bff72778bff72778bff\
         70768aff6d7589ff6a7388ff667287ff627087ff5e6f87ff5b6e88ff586d89ff566d8aff556d8aff546d8bff414d70ff\
         434f71ff475374ff4d5877ff545d7bff5b637fff626983ff696e86ff6d7288ff717589ff727689ff717689ff707588ff\
         6d7487ff697286ff657085ff616e85ff5d6d85ff5a6c86ff576b86ff566b87ff546b88ff546b89ff434e6fff455070ff\
         495373ff4f5876ff565e7aff5d637eff646981ff6a6e84ff6e7286ff717487ff727587ff727586ff707485ff6c7283ff\
         687082ff646e81ff606c81ff5c6b81ff596a82ff576983ff556984ff546985ff536985ff47506fff495270ff4d5573ff\
         535a76ff5a5f7aff61657dff686b81ff6d6f83ff727385ff747586ff757685ff747584ff717382ff6e7180ff696f7fff\
         656c7eff616a7dff5d697dff5a687eff57687fff566880ff556881ff546882ff4e5571ff505772ff555a74ff5a5f78ff\
         61647bff686a7fff6f6f82ff747485ff787786ff7b7986ff7b7986ff7a7884ff777682ff727380ff6e707eff696e7cff\
         646c7cff616a7cff5e697dff5b697eff5a697fff596a80ff596a81ff595c75ff5b5e76ff5f6279ff65667cff6c6c80ff\
         737283ff7a7787ff7f7b89ff837f8bff85808bff86808aff847f88ff807d85ff7c7983ff767680ff71737eff6d717dff\
         696f7dff666e7eff646e80ff626e81ff626f82ff616f83ff67677cff69697dff6d6c7fff737183ff7a7787ff817d8bff\
         88828eff8e8791ff928a92ff948c93ff948c92ff928a8fff8e878cff898389ff848086ff7e7c84ff797983ff757883ff\
         727783ff707785ff6f7887ff6e7888ff6e7989ff767384ff797585ff7d7888ff837e8bff8a848fff928a94ff999098ff\
         a0959bffa4999dffa69a9dffa69a9cffa4989affa09596ff9a9192ff948c8fff8e888cff89858bff84838bff81838bff\
         7f838dff7e838fff7e8490ff7e8591ff857e8bff88808dff8d848fff938a93ff9b9098ffa3979dffab9ea2ffb2a3a5ff\
         b7a7a8ffb9a9a8ffb9a9a7ffb7a7a5ffb2a4a1ffac9f9dffa59a99ff9f9696ff999294ff959093ff918f94ff908f95ff\
         8f9097ff8e9199ff8e919aff928790ff958a92ff998e95ffa09499ffa99b9effb1a2a4ffbaa9a9ffc1afadffc7b4b0ff\
         cab7b1ffcab7b1ffc8b5aeffc3b1aaffbcaba5ffb5a6a1ffaea19dffa89d9bffa39a9aff9f999aff9d999cff9d9a9eff\
         9c9ba0ff9c9ca1ff9a8c91ff9c8e92ffa29396ffa9999affb2a0a0ffbba8a6ffc4b0acffccb7b1ffd2bcb5ffd6bfb6ff\
         d6bfb6ffd4bdb3ffcfb9afffc8b3aaffc0ada5ffb8a8a0ffb1a39effaca09cffa89f9dffa69f9effa5a0a0ffa5a0a2ff\
         a5a1a3ff9b8a8cff9e8d8dffa39191ffab9896ffb4a09cffbea8a3ffc8b1a9ffd0b8afffd7beb3ffdbc1b5ffdbc2b5ff\
         d9bfb2ffd3bbadffccb5a8ffc4aea2ffbba89dffb4a39affae9f98ffaa9e98ffa89d9affa79e9bffa79f9dffa7a09eff\
         958381ff988583ff9e8a86ffa5908bffaf9892ffb9a199ffc3aa9fffccb2a6ffd3b8aaffd8bcacffd8bcacffd6baaaff\
         d0b5a5ffc8af9fffbfa799ffb6a093ffae9b8fffa8978dffa4958dffa2958effa19590ffa19692ffa19793ff8a7571ff\
         8c7873ff927c76ff99827bffa38a81ffad9389ffb79c90ffc1a596ffc8ab9bffcdaf9dffcdaf9dffcbad9bffc5a896ff\
         bca18fffb39989ffaa9283ffa18c7eff9b877cff96857bff94857cff93857eff938780ff938781ff79645eff7c665fff\
         816a63ff887067ff91786dff9b8174ffa68a7bffaf9282ffb79886ffbb9c89ffbc9d89ffb99a86ffb39581ffaa8e7bff\
         a18674ff977e6dff8e7768ff877366ff837165ff817066ff807169ff80726bff80736cff675149ff69534bff6d564eff\
         745c52ff7d6357ff866b5eff907464ff997c6bffa1826fffa58672ffa68772ffa3846fff9d7f6aff947763ff8a6f5cff\
         806756ff786051ff715c4eff6d5a4eff6b5a4fff6a5b52ff6a5c54ff6b5d55ff533e37ff554038ff59433aff5f483dff\
         674e42ff705548ff795d4eff826554ff896b58ff8e6f5bff8f705bff8c6d58ff866853ff7d614dff735846ff69503fff\
         614a3bff5a4638ff574438ff55443aff55463dff554740ff564841ff422e27ff432f27ff473129ff4c352cff523b2fff\
         5a4134ff634839ff6b4f3fff725543ff775946ff785a46ff755844ff70533fff674c39ff5e4432ff543d2cff4c3728ff\
         473326ff433227ff42332aff42342dff433730ff443832ff33211bff34221bff36231cff3a261eff402a20ff473024ff\
         4f3629ff573d2dff5d4232ff624634ff634735ff614633ff5c412fff553b2aff4c3424ff432d1fff3c281bff37251aff\
         34251cff34261fff352923ff362b26ff372d28ff271814ff281814ff291914ff2c1b14ff311e16ff372218ff3e281cff\
         452e21ff4c3325ff503728ff533929ff513828ff4d3525ff462f20ff3e291bff372317ff301f15ff2c1d15ff2b1d17ff\
         2b201bff2d2320ff2f2624ff302826ff1e1211ff1e1210ff1f120fff21130fff24150fff291811ff301d14ff372318ff\
         3d281cff432d20ff452f22ff452f22ff422d1fff3c281cff352318ff2f1e15ff291b13ff261a14ff251b18ff271e1dff\
         292222ff2c2626ff2d2829ff170f11ff170e10ff170e0eff180d0dff1a0e0cff1f110dff241510ff2b1b13ff322018ff\
         38251cff3b291fff3c2a1fff3a281eff35251cff2f2119ff2a1d17ff251b17ff231b19ff231d1dff252122ff282528ff\
         2b292dff2d2b30ff110d13ff110c11ff100b0fff110a0dff120a0bff160c0cff1b100eff221512ff291b16ff2f211bff\
         33251eff352720ff342620ff31241fff2c211dff271e1cff231d1cff221d1fff232024ff25242aff282930ff2c2d35ff\
         2d3038ff0c0d16ff0c0b14ff0b0a11ff0a080eff0b070cff0e090cff130c0eff1a1212ff211817ff281e1cff2d2320ff\
         302623ff302624ff2d2524ff292222ff252022ff221f23ff202026ff21232bff242731ff272c37ff2b313dff2d3340ff\
         080c19ff070b17ff050814ff040610ff04050eff07060dff0c090fff130f13ff1a1618ff221c1eff282223ff2b2527ff\
         2c2728ff2a2628ff262328ff222127ff1f2028ff1d212bff1e2430ff212836ff242d3cff273142ff293445ff030c1cff\
         020a1aff000717ff000513ff000310ff00040fff050710ff0c0d14ff14141aff1d1b21ff232126ff27252aff28272cff\
         26262dff22242cff1e212bff1a202cff18202eff192232ff1b2638ff1e2b3eff212f43ff223146ff000c20ff000a1dff\
         000719ff000415ff000212ff000211ff000512ff070b16ff0f121dff181a23ff1e2129ff23252eff232630ff212530ff\
         1d232fff18202dff141d2dff111d2fff111e32ff122137ff14253cff172941ff182b43ff000b23ff000920ff00061cff\
         000317ff000114ff000113ff000414ff020a19ff0b121fff131926ff1a202cff1f2430ff1f2632ff1d2432ff182130ff\
         121d2eff0d1a2dff09182dff071830ff081a33ff091d38ff0b203cff0c223eff000b25ff000923ff00061eff00021aff\
         000016ff000015ff000316ff00091bff071121ff101928ff171f2eff1b2433ff1b2534ff182333ff131e31ff0c192dff\
         05152bff00122aff00112bff00122eff001532ff001735ff001837ff000c28ff000925ff000621ff00021cff000018ff\
         000016ff000318ff00091cff051123ff0d192aff141f30ff182334ff182435ff142134ff0e1c30ff06162cff001129ff\
         000d27ff000b27ff000b29ff000c2cff000e2fff000f30ff000c29ff000a27ff000622ff00021dff000019ff000018ff\
         000319ff00091eff031124ff0c182bff121f31ff162235ff162336ff112034ff0a1a30ff02132bff000d27ff000824ff\
         000523ff000525ff000627ff000729ff00082bff000c2aff000a28ff000623ff00021eff00001aff000019ff00031aff\
         00091fff021125ff0b182cff111f32ff152236ff142236ff101f34ff081930ff00122aff000b26ff000622ff000321ff\
         000222ff000224ff000326ff000427ff";
    const ALPHA_RGBA_HEX: &str = "4c4950004d4a52004f4c5400524f570056545c005c596100625f683169666f80706d77bc77757ede7e7c86df84828cbe\
         898892798d8c96148f8e99008f8f99008e8f98008c8d9600888a930084868f0080828a007b7f8600787c8300757a8000\
         74797f00747a7e00747b7f00757d8000777f8100798083707a8284d27b8385ff504d5500514e56005451580057545c00\
         5b586000605d660066636c466d6a739574717bd37b7882f6827f8af9888690d98d8b9696918f9a3293929c0093939d00\
         92929c008f909a008c8d96008889920083868e007f828a007c808600797e8400787d8200777d8200787e820079808300\
         7b8285077c84868e7e8588f07e8688ff59555d005a565e005c5860005f5c64006360680068656d106e6b746c74717abe\
         7b7882fd827f89ff898690ff8f8c97ff94929ccd9796a06c9998a2009a99a3009998a2009696a00092939c008e909800\
         8a8c94008688900082868c0080848a007e8388007e8388007f8488008086890081888b41838a8cc6848b8eff858c8eff\
         646067006561680067636b006a666e006e6a7200736e774178747d9f7e7b84f485818bff8c8892ff928f99ff98959fff\
         9d9aa5ffa09ea8bca2a0ab45a2a1ab00a1a0aa009e9ea8009b9ba4009797a00092939c008e9097008b8d9400888b9100\
         878b9000868b8f00878c9000888e91008a9093908b9294ff8d9395ff8d9496ff706b7300716c7400736e760075717900\
         79747d197e79827a837e87da89848eff908b95ff96919cff9c98a2ffa29ea8ffa6a2adffa9a6b1ffaba8b3a9aba9b325\
         aaa8b200a7a6af00a3a2ac009f9fa8009b9ba30096989f0093959c00909399008f9297008f9297008f93970091959956\
         92979aec94999cff959b9dff969b9eff7b757d007c767e007e788000807a8300847e874f88828bb28d8791ff938d97ff\
         99939dff9f99a4ffa59faaffaaa5afffaea9b4ffb1adb7ffb3aeb9ffb2afb996b1aeb80eaeacb500aaa8b200a6a5ae00\
         a1a1a9009d9da5009a9ba10097999f0096989d0096989d0096999d1f979b9eb9999da0ff9b9fa1ff9ca0a3ff9da1a3ff\
         847d8500857e8600867f880089828a248c858e7f908992e4948d97ff9a939dff9f98a3ffa59ea9ffaaa4afffafa9b4ff\
         b3adb8ffb6b0bbffb7b2bdffb7b2bdffb5b1bb84b2aeb802aeabb500aaa7b000a5a3ac00a1a0a7009d9da4009b9ba100\
         9a9aa000999a9f009a9ca0839b9da1ff9d9fa2ff9ea1a4ff9fa3a5ffa0a3a6ff898189008a828a008b838c008d858e48\
         908891a4948b95ff989099ff9d959fffa29aa4ffa79faaffaca4afffb0a9b4ffb4adb8ffb6afbaffb7b1bcffb7b1bbff\
         b5afbaeeb2adb773aea9b301a9a5ae00a5a1aa00a09ea6009d9ba2009a999f0099989e0098989d5299999ed89a9b9fff\
         9c9da0ff9d9fa2ff9fa0a3ff9fa1a3ff8a8089008a818a008b828b118d848d5d908690ba938a93ff978d97ff9b929cff\
         a096a1ffa49ba6ffa9a0abffada4afffb0a8b3ffb2aab5ffb2abb6ffb2abb5ffb0a9b3ffaca6b0d2a8a3ac64a49fa808\
         9f9ba3009b979f0097949b00959298009391972f9391969a939296ff949497ff969699ff97989aff99999cff999a9cff\
         867b8400867c8500877d8618897e87638b808abf8e838dff918790ff958a95ff998f99ff9d939effa197a2ffa49ba6ff\
         a79ea9ffa9a0abffa9a0abffa8a0abffa69ea8ffa29ba5ff9e97a1b199939c57958f9717908b93008d888f008a868c1f\
         88858b6788858aca88868aff8a888bff8b8a8dff8d8c8eff8e8d8fff8e8e90ff7e737b007e737c007f747d1080757e5a\
         827780b5847983ff877c86ff8a7f89ff8e838dff928791ff958a95ff988d99ff9b909bff9c919dff9c929dff9b919cff\
         988f9aff948c96ff908892e68b848d8e8680884c827c83297e7980267b777d467a757b8579757ade7a767aff7b787bff\
         7c7a7dff7e7b7eff7f7d7fff7f7e80ff73677000746770007468710075697246766a749f786c76ff7b6e78ff7d717cff\
         80747fff847882ff877b86ff897e89ff8b808bff8c818cff8c818cff8a808bff887e88ff847a84ff7f7680ff7a727bac\
         756e766a716a71436d666d3c6a646a546863688b686368da686468ff696568ff6a676aff6c696bff6d6a6cff6e6b6dff\
         675b6400685b6400685b6400695c652a6a5d66816b5e68e26d606aff6f626dff726570ff746873ff776a76ff796d78ff\
         7b6e7aff7b6f7bff7b6f7aff796e79ff766b76ff726872ff6e646dff695f68b6645b63735f575e495b545a3c5851574e\
         5650557b565054c1565054ff575255ff585356ff595557ff5a5658ff5b5759ff5c4f58005c4f58005c4f58005d4f580d\
         5d50595f5e515bbd60525cff61545eff645661ff665963ff685b66ff6a5d68ff6b5e6aff6b5f6aff6b5e69ff695d68ff\
         665a65ff625761ff5d525cff584e57b05349516c4e454d404a42482e47404538453e435d443e4299443e42e4454042ff\
         464144ff484345ff494446ff494546ff52454d0052454e0052454e0052454e0053454e4153464f99544751f7564852ff\
         584a54ff594c57ff5b4e59ff5d4f5bff5e515cff5e515cff5d505bff5b4f59ff584c56ff544852ff4f444df14a3f489f\
         453b435c40373e2c3c333a163931361a372f3437362f3369362f33ab363033f5383234ff393335ff3a3536ff3a3536ff\
         4b3e46004b3e46004b3d46004b3d46004b3d47294b3e477b4c3e48d34d404aff4f414bff50434dff52444fff534651ff\
         544752ff544752ff534651ff51454fff4e424cff4a3e48ff453a43db40353e8b3b313847362c331632292f002f262b00\
         2c25290f2b2428392b2528722c2628b32d2729f42e282aff2f2a2bff302a2bff483a4300473a4300473a4300473a4300\
         4739431d473a4367483a44b7483b45ff4a3c46ff4b3e48ff4c3f4aff4e404bff4e414cff4e414cff4d414bff4b3f49ff\
         483c46ff443942ff3f343dc53a303878352b333530272e032c24290029212600271f2300261f2210261f22412620227a\
         272123b3282324e6292424ff2a2425ff473a4300473a4300473a4300463942004639421d4639425f463943a6473a44f0\
         483b45ff4a3d47ff4b3e48ff4c3f4aff4d404bff4d404bff4c404aff4a3e48ff473c45ff433841ff3f343cb43a30376a\
         352b322930272d002c23290029212500271f2300251f2100251f211b2620214d26212280272222ae282323d0292424e2\
         493d4500493d4500493c4500483c4500483c4429483b4562483c45a1493c46e14a3d47ff4b3f49ff4c404aff4e424cff\
         4f434dff4f434dff4e434cff4c414bff4a3f48ff463c44f2423840aa3d333b63382f3624332b31002f282c002c252900\
         2a2327002923250029232405292425312a25255f2b2626882c2727a72c2727b74c4149004c4149004c4049004b404817\
         4b40483f4b3f486f4b4049a44c404adc4d414bff4e434dff50444eff514650ff524751ff534852ff524851ff514750ff\
         4f454dff4b424aea473e46a7433a41653e363c293a323700362f3300332c3000312b2d00302a2c002f2a2b00302b2b27\
         302c2c50312d2d75322e2d91322f2ea04f454c0c4e454c154e444c254e444c3d4d434b5d4d434c834e434cae4e444ddc\
         50454fff514750ff534952ff554b54ff564d56ff574e57ff574e57ff564d56ff544b54ff514951e74e464daa4a42486e\
         453e4437413b3f0a3e373b003b35380039343600373334003733340b3834342e38353454393635763a37358f3a37369d\
         4f464e454f464e4a4e464d564e454d674e454d7e4e454d9a4e454ebc4f464fe0514851ff534a53ff554c55ff574e58ff\
         59515aff5b525bff5b535bff5b535bff595159ff574f57e8534d53b250494f7c4c464b4a4842472144404305423d4000\
         403c3d003f3b3c083f3c3c233f3c3c44403d3c67413e3d86413f3d9e42403eab4b444b7b4b444b7e4b444b854b434b8f\
         4b434b9e4b434bb14c444cc84d454ee34f4750ff514a52ff544c55ff574f58ff59525aff5b545cff5c555dff5c555dff\
         5b555cff59535aea575157bb534e538b504b4f604c484c3c49454823474345184542431b4442422b4442414444434164\
         45444285464543a3464643ba474644c6433e44ac433e44ac433d44ae433d44b2433d44b8433e45c3443f46d1464048e3\
         48424af84b454dff4e4851ff524c54ff554f57ff575159ff59535bff5a545cff59545bff58535aeb565257c3534f549b\
         504d51764d4a4d584a484a444846473c46454541454544524545446c4646448b474744ac484845c9484946df494946ea\
         363239d4363239d2363238cf363239cd363239cc37333ace39343bd33b363edd3d3940ea413c44fa444048ff48444bff\
         4c474fff4f4b52ff514d54ff534f56ff535056ff524f55e8514e53c84e4c50a74c4a4d8949484a714746476345444560\
         434343684343427a43444295434542b5444643d5454744f2464844ff464844ff252228f1252228ed252228e7252229de\
         262329d627242ad028252cce2b282fd02e2b32d7322f36e136333aee3a373ffb3f3c43ff424047ff46434aff48454cff\
         49464cf548474ce147464bc8464548af43434698414143873f3f417e3d3e3f7f3c3e3d8b3c3e3ca03c3e3cbc3d3f3cdd\
         3e403dfe3e423eff3f423eff40433fff100f15ff100f15fe100f15f4110f15e7111016d8131117cc15131ac218161dbd\
         1b1920be201e25c324222acd29282fd82e2c33e3333138eb36353bee39383eec3b3a3fe33b3a3fd53b3a3fc4393a3db2\
         38383ba236373997343636943235349a323433a9313433c1323532e0323633ff333734ff343934ff353a35ff363a35ff\
         000000ff000000ff000000f8000000e7000001d4000003c1000005b1030209a707060da20c0b12a4111017aa16161db4\
         1c1b22bf212027c925252bcf28282ed12b2b30ce2c2c31c62c2d30bc2b2c2fb02a2b2ea7282a2ca227292aa4252928ae\
         252827c2252927dc252a27fd262b27ff272c28ff282d29ff292e29ff292f2aff000000ff000000ff000000f7000000e2\
         000000ca000000b30000009e0000008f00000086000000840000058904040b910a0a119d0f1016a814151bb118191eb7\
         1a1c21b91c1d22b61c1e22b11c1e21ab1b1e20a81a1d1ea8191c1caf181c1bbd171c1ad4171c1af1181d1aff191f1bff\
         1a201bff1b211cff1c221dff1c231dff000000ff000000ff000000f2000000da000000bf000000a40000008c00000079\
         0000006e000000690000006c000000740000017f0001078c05060c97090b10a00c0e13a50e1014a70f1115a70f1214a6\
         0e1213a60d1112ab0c1110b50b100fc70b100ee00b110eff0c120eff0d130fff0e1510ff0f1611ff101712ff101812ff\
         000000ff000000ff000000ed000000d3000000b6000000990000007e000000690000005b00000055000000560000005e\
         0000006a00000077000001840000058f0104089704060a9c05080b9e05080ba004080aa4030809ab030807b9020706cd\
         020806e8020805ff030a06ff040b06ff050c07ff060e08ff070f09ff080f09ff000000ff000000fd000000ea000000cf\
         000000b1000000920000007600000060000000510000004a0000004b000000520000005e0000006c0000007a00000086\
         0000038f00010595000306990003069d000305a2000304ab000302ba000301cf000301ec000401ff000501ff000602ff\
         000803ff010904ff020a04ff030b05ff";

    fn b64(s: &str) -> Vec<u8> {
        const T: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut out = Vec::new();
        let mut buf = 0u32;
        let mut bits = 0;
        for &c in s.as_bytes() {
            if c == b'=' {
                break;
            }
            let v = T.iter().position(|&t| t == c).unwrap() as u32;
            buf = (buf << 6) | v;
            bits += 6;
            if bits >= 8 {
                bits -= 8;
                out.push((buf >> bits) as u8);
            }
        }
        out
    }

    fn unhex(s: &str) -> Vec<u8> {
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).unwrap())
            .collect()
    }

    fn check_against_swift(hash_b64: &str, expected_hex: &str, ew: u32, eh: u32) {
        let hash = b64(hash_b64);
        let (w, h) = dims(&hash).unwrap();
        assert_eq!((w, h), (ew, eh));
        let mut dst = vec![0u8; (w * h * 4) as usize];
        assert!(to_rgba(&hash, &mut dst));
        let expected = unhex(expected_hex);
        assert_eq!(dst.len(), expected.len());
        for (i, (a, b)) in dst.iter().zip(expected.iter()).enumerate() {
            assert!(
                (*a as i16 - *b as i16).abs() <= 1,
                "byte {i}: rust={a} swift={b}"
            );
        }
    }

    #[test]
    fn matches_swift_ground_truth_opaque() {
        check_against_swift(OPAQUE_B64, OPAQUE_RGBA_HEX, 23, 32);
    }

    #[test]
    fn matches_swift_ground_truth_alpha() {
        check_against_swift(ALPHA_B64, ALPHA_RGBA_HEX, 32, 32);
    }

    #[test]
    fn opaque_hash_is_fully_opaque() {
        let hash = b64(OPAQUE_B64);
        let (w, h) = dims(&hash).unwrap();
        let mut dst = vec![0u8; (w * h * 4) as usize];
        assert!(to_rgba(&hash, &mut dst));
        assert!(dst.chunks_exact(4).all(|px| px[3] == 255));
    }

    #[test]
    fn rejects_truncated_hashes_at_every_length() {
        let hash = b64(ALPHA_B64);
        let mut first_ok = None;
        for len in 0..=hash.len() {
            let cut = &hash[..len];
            match dims(cut) {
                Some((w, h)) => {
                    first_ok.get_or_insert(len);
                    let mut dst = vec![0u8; (w * h * 4) as usize];
                    assert!(to_rgba(cut, &mut dst), "len {len}");
                }
                None => {
                    assert!(first_ok.is_none(), "rejection after acceptance at {len}");
                    let mut dst = vec![0u8; 32 * 32 * 4];
                    assert!(!to_rgba(cut, &mut dst), "len {len}");
                }
            }
        }
        let first_ok = first_ok.expect("full hash must parse");
        assert!(first_ok > 6, "accepted a bare header at {first_ok}");
    }

    #[test]
    fn rejects_short_dst() {
        let hash = b64(OPAQUE_B64);
        let mut small = vec![0u8; 16];
        assert!(!to_rgba(&hash, &mut small));
    }
}
