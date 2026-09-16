const path = require("path");
const PDFDocument = require("pdfkit");

const HINDI_FONT = path.join(__dirname, "..", "assets", "fonts", "NotoSansDevanagari.ttf");

function streamCompetitionSheet({ res, competition }) {
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  doc.registerFont("HindiFont", HINDI_FONT);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="competition-${competition._id}-blank-sheet.pdf"`
  );
  doc.pipe(res);

  const pageHeight = doc.page.height;
  doc.rect(0, 0, doc.page.width, pageHeight).fill("#ffffff");

  doc.save();
  doc.fillOpacity(0.07).fillColor("#1d4ed8").font("HindiFont").fontSize(34);
  doc.rotate(-35, { origin: [doc.page.width / 2, pageHeight / 2] });
  doc.text("नेशनल इन्फोर्मेटिक्स सेंटर सर्विसिज इन्कोर्पोरेटेड", 0, pageHeight / 2 - 20, {
    width: doc.page.width,
    align: "center",
  });
  doc.restore();

  doc.fillOpacity(1).fillColor("#1e3a8a").font("HindiFont").fontSize(22).text(`${competition.name}`, 54, 42, {
    width: doc.page.width - 108,
    align: "center",
  });
  doc.end();
}

module.exports = { streamCompetitionSheet };