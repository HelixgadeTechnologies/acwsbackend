import QRCode from 'qrcode';

export interface QRCodeGenerateOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generates a high-resolution base64 PNG Data URL for a given destination URL/string.
 */
export const generateQRCodeDataUrl = async (
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> => {
  const {
    width = 360,
    margin = 2,
    darkColor = '#1A1A1A',
    lightColor = '#FFFFFF',
    errorCorrectionLevel = 'M',
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
};

/**
 * Generates a scalable vector SVG string for print media and badges.
 */
export const generateQRCodeSvg = async (
  text: string,
  options: QRCodeGenerateOptions = {}
): Promise<string> => {
  const {
    margin = 2,
    darkColor = '#1A1A1A',
    lightColor = '#FFFFFF',
    errorCorrectionLevel = 'M',
  } = options;

  return QRCode.toString(text, {
    type: 'svg',
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
};
