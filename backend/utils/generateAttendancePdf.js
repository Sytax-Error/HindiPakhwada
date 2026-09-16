const path = require("path");
const PDFDocument = require("pdfkit");

const HINDI_FONT = path.join(__dirname, "..", "assets", "fonts", "NotoSansDevanagari.ttf");

function streamAttendancePdf({ res, competition, participants, allParticipants = false }) {
  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 32 });
  doc.registerFont("HindiFont", HINDI_FONT);
  res.setHeader("Content-Type", "application/pdf");
  const filePrefix = allParticipants ? "participants" : "attendees";
  res.setHeader("Content-Disposition", `attachment; filename="${filePrefix}-${competition._id}.pdf"`);
  doc.on("error", (err) => {
    console.error("Attendance PDF generation failed:", err);
    if (!res.headersSent) res.status(500).json({ message: "उपस्थिति PDF नहीं बन सकी।" });
  });
  doc.pipe(res);

  const pageWidth = doc.page.width - 64;
  const columns = [
    { label: "क्रमांक", width: 55 },
    { label: "नाम", width: 190 },
    { label: "इम्प्लोयी कोड", width: 125 },
    { label: "ई-मेल", width: 200 },
    { label: "स्थिति", width: 95 },
    { label: "उपस्थिति समय", width: pageWidth - 665 },
  ];

  doc.font("HindiFont").fillColor("#1e1b4b").fontSize(20).text(
    allParticipants ? "सभी पंजीकृत प्रतिभागियों की सूची" : "उपस्थित प्रतिभागियों की सूची",
    { align: "center" }
  );
  doc.fontSize(12).fillColor("#374151").text(`प्रतियोगिता: ${competition.name}`, { align: "center" });
  doc.moveDown(1.5);

  function drawTableHeader() {
    let x = 32;
    const y = doc.y;
    columns.forEach((column) => {
      doc.rect(x, y, column.width, 28).fillAndStroke("#4338ca", "#4338ca");
      doc.fillColor("#ffffff").font("HindiFont").fontSize(10).text(column.label, x + 7, y + 8, { width: column.width - 14 });
      x += column.width;
    });
    doc.y = y + 28;
  }

  drawTableHeader();
  participants.forEach((participant, index) => {
    const values = [
      String(index + 1),
      participant.user?.name || "-",
      participant.user?.employeeCode || "-",
      participant.user?.email || "-",
      participant.attendedAt ? "उपस्थित" : "अनुपस्थित",
      participant.attendedAt ? new Date(participant.attendedAt).toLocaleString("en-IN") : "-",
    ];
    const rowHeight = 30;
    if (doc.y + rowHeight > doc.page.height - 32) {
      doc.addPage();
      drawTableHeader();
    }
    let x = 32;
    const y = doc.y;
    columns.forEach((column, columnIndex) => {
      doc.rect(x, y, column.width, rowHeight).fillAndStroke(columnIndex % 2 ? "#f8fafc" : "#ffffff", "#dbe3ef");
      doc.fillColor("#111827").font("HindiFont").fontSize(10).text(values[columnIndex], x + 7, y + 9, {
        width: column.width - 14,
        lineBreak: false,
      });
      x += column.width;
    });
    doc.y = y + rowHeight;
  });

  if (participants.length === 0) {
    doc.fillColor("#6b7280").font("HindiFont").fontSize(12).text("अभी तक किसी प्रतिभागी की उपस्थिति दर्ज नहीं है।", { align: "center" });
  }
  doc.end();
}

module.exports = { streamAttendancePdf };