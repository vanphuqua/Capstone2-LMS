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