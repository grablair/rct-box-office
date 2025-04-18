// QR Code generation utility with rounded corners and dots
import QRCodeStyling from "qr-code-styling"

export interface QRCodeOptions {
  data: string
  width: number
  height: number
  dotsOptions?: {
    color: string
    type?: string
  }
  cornersSquareOptions?: {
    color: string
    type?: string
  }
  backgroundOptions?: {
    color: string
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function generateQRCode(options: QRCodeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a QR code with styling
      const qrCode = new QRCodeStyling({
        width: options.width,
        height: options.height,
        type: "canvas",
        data: options.data,
        image: undefined,
        dotsOptions: {
          color: options.dotsOptions?.color || "#000000",
          type: options.dotsOptions?.type || "rounded",
        },
        cornersSquareOptions: {
          color: options.cornersSquareOptions?.color || "#000000",
          type: options.cornersSquareOptions?.type || "extra-rounded",
        },
        backgroundOptions: {
          color: options.backgroundOptions?.color || "#FFFFFF",
        },
      })

      const rawData = qrCode.getRawData().then((value) => {
        return blobToBase64(value)
      }).then((dataUrl) => {
        return resolve(dataUrl)
      })
    } catch (error) {
      reject(error)
    }
  })
}
