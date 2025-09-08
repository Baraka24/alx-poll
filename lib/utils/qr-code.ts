import QRCode from 'qrcode'

export const generateQRCode = async (url: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export const generatePollUrl = (pollId: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string => {
  return `${baseUrl}/polls/${pollId}`
}

export const generateQRCodeForPoll = async (pollId: string): Promise<string> => {
  const pollUrl = generatePollUrl(pollId)
  return generateQRCode(pollUrl)
}

export const generateMagicLinkUrl = (token: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string => {
  return `${baseUrl}/auth/magic-link?token=${token}`
}

export const generateQRCodeForMagicLink = async (token: string): Promise<string> => {
  const magicLinkUrl = generateMagicLinkUrl(token)
  return generateQRCode(magicLinkUrl)
}
