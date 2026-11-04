"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface StudentCertificateDownloadButtonProps {
  courseId: string;
  fileName: string;
  className?: string;
  sourceUrl?: string | null;
}

export const StudentCertificateDownloadButton = ({
  courseId,
  fileName,
  className,
  sourceUrl,
}: StudentCertificateDownloadButtonProps) => {
  const t = useTranslations("course.certificate_btn");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);

      // Generate and download certificate PDF
      const res = await axios.get(
        `/api/courses/${courseId}/certificate/pdf?download=1`,
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "certificate.pdf";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t("downloaded"));
    } catch (err: any) {
      console.error("Certificate download error:", err);
      toast.error(err?.response?.data || t("download_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className={className}
      size="lg"
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? t("downloading") : t("download")}
    </Button>
  );
};