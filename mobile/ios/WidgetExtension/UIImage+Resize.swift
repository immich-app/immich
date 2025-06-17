//
//  Utils.swift
//  Runner
//
//  Created by Alex Tran and Brandon Wees on 6/16/25.
//
import UIKit

extension UIImage {
    /// Crops the image to ensure width and height do not exceed maxSize.
    /// Keeps original aspect ratio and crops excess equally from edges (center crop).
    func resized(toWidth width: CGFloat, isOpaque: Bool = true) -> UIImage? {
      let canvas = CGSize(width: width, height: CGFloat(ceil(width/size.width * size.height)))
      let format = imageRendererFormat
      format.opaque = isOpaque
      return UIGraphicsImageRenderer(size: canvas, format: format).image {
        _ in draw(in: CGRect(origin: .zero, size: canvas))
      }
    }
}
