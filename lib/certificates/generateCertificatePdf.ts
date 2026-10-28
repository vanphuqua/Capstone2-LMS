import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import { promises as fs } from "fs";

export interface CertificatePdfOptions {
  certificateTitle: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  minPercentage: number;
  scorePercent: number;
  issueDate: Date;
  verificationCode?: string;
  signatureTitle?: string;
  /** Optional small text under the signature line (e.g., organization name for preview). */
  organizationNameUnderSignature?: string;
}

/**
 * Generate a Marwadi-university style certificate PDF using pdf-lib.
 * Returns the raw PDF bytes as Uint8Array.
 */
export async function generateCertificatePdf(
  options: CertificatePdfOptions,
): Promise<Uint8Array> {
  const {
    certificateTitle,
    studentName,
    courseTitle,
    teacherName,
    minPercentage,
    scorePercent,
    issueDate,
    verificationCode,
    signatureTitle = "Course Instructor",
    organizationNameUnderSignature,
  } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // Landscape A4
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // Background + borders
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.99, 0.99, 1),
  });
  page.drawRectangle({
    x: 18,
    y: 18,
    width: width - 36,
    height: height - 36,
    borderColor: rgb(0.7, 0.7, 0.8),
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.5, 0.1, 0.1),
    borderWidth: 3,
  });
  // Logo + organization name (Marwadi University style)
  try {
    const logoRelativePath =
      process.env.CERTIFICATE_LOGO_PATH || "public/marwadi-university-logo.png";
    const logoPath = path.join(process.cwd(), logoRelativePath);
    const logoBytes = await fs.readFile(logoPath);
    const logoBytesArray = new Uint8Array(
      logoBytes.buffer,
      logoBytes.byteOffset,
      logoBytes.byteLength,
    );

    const isPng = logoRelativePath.toLowerCase().endsWith(".png");
    const logoImage = isPng
      ? await pdfDoc.embedPng(logoBytesArray)
      : await pdfDoc.embedJpg(logoBytesArray);

    const desiredWidth = 120;
    const scale = desiredWidth / logoImage.width;
    const logoHeight = logoImage.height * scale;

    const logoX = width / 2 - desiredWidth / 2;
    const logoY = height - 110;

    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: desiredWidth,
      height: logoHeight,
    });

    const orgName = process.env.CERTIFICATE_ORG_NAME || "Marwadi University";
    const orgFontSize = 16;
    const orgWidth = boldFont.widthOfTextAtSize(orgName, orgFontSize);
    page.drawText(orgName, {
      x: (width - orgWidth) / 2,
      y: logoY - 18,
      size: orgFontSize,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.25),
    });
  } catch {
    // If logo file or env is missing, continue without breaking certificate
  }