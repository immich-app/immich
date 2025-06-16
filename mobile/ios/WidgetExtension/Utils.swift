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
    func croppedToMaxSizeCentered(_ maxSize: CGFloat = 990) -> UIImage? {
        let originalSize = self.size
        
        // Determine target size within limits
        let targetWidth = min(originalSize.width, maxSize)
        let targetHeight = min(originalSize.height, maxSize)
        
        // Center the crop rect
        let originX = (originalSize.width - targetWidth) / 2.0
        let originY = (originalSize.height - targetHeight) / 2.0
        
        let cropRect = CGRect(
            x: originX,
            y: originY,
            width: targetWidth,
            height: targetHeight
        )
        
        // Crop the image
        guard let cgImage = self.cgImage?.cropping(to: cropRect) else {
            return nil
        }
        
        return UIImage(cgImage: cgImage, scale: self.scale, orientation: self.imageOrientation)
    }
}
