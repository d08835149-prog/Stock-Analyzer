"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Props = {
  targetId: string;
  fileName?: string;
};

export default function PdfDownloadButton({
  targetId,
  fileName = "stock-analysis",
}: Props) {
  const [loading, setLoading] = useState(false);

  const downloadPdf = async () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert("Analysis result not found.");
      return;
    }

    setLoading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0e1117",
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;

      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imageWidth = usableWidth;

      const imageHeight =
        (canvas.height * imageWidth) /
        canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        imageWidth,
        imageHeight
      );

      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position =
          margin -
          (imageHeight - heightLeft);

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          imageWidth,
          imageHeight
        );

        heightLeft -= usableHeight;
      }

      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[:T]/g, "-");

      pdf.save(
        `${fileName}-${timestamp}.pdf`
      );
    } catch (error) {
      console.error(
        "PDF generation failed:",
        error
      );

      alert(
        "Failed to generate PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="pdf-button"
      onClick={downloadPdf}
      disabled={loading}
    >
      {loading
        ? "Generating PDF..."
        : "📄 Download PDF Report"}
    </button>
  );
}