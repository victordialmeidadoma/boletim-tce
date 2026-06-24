import QRCode from "qrcode";

/**
 * Gera um QR code como data URI (PNG base64) para embutir direto no HTML
 * dos relatórios — não depende de imagem externa, funciona offline no PDF.
 */
export async function gerarQRCodeDataUri(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 240,
    color: { dark: "#111827", light: "#FFFFFF" },
  });
}

/**
 * Monta a URL pública do boletim de um município, baseada no domínio
 * configurado em NEXT_PUBLIC_SITE_URL (ou fallback para localhost em dev).
 */
export function urlPublicaBoletim(municipio: string, data: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://main.dlzpm1tj9wo2v.amplifyapp.com/";
  return `${base}/publico/${encodeURIComponent(municipio)}/${data}`;
}