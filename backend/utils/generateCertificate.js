const fs = require("fs");
const path = require("path");
require("regenerator-runtime/runtime");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

const TEMPLATE_PATH = path.join(__dirname, "..", "..", "Hindi Pakhwada Certificate (2).pdf");
const HINDI_FONT = path.join(__dirname, "..", "assets", "fonts", "NotoSansDevanagari.ttf");

const CERT_POSITION_LABEL = {
  first: "प्रथम",
  second: "द्वितीय",
  third: "तृतीय",
  consolation: "प्रोत्साहन",
};

function eventDateRangeLabel(label) {
  return label || process.env.PAKHWADA_DATE_RANGE_LABEL || "14 से 28 सितंबर, 2025";
}

function drawCenteredText(page, font, text, y, size, color = rgb(0.07, 0.1, 0.16)) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (page.getWidth() - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawFieldText(page, font, text, x, y, width, size, color = rgb(0.07, 0.1, 0.16)) {
  let fieldSize = size;
  while (fieldSize > 9 && font.widthOfTextAtSize(text, fieldSize) > width) {
    fieldSize -= 1;
  }
  const textWidth = font.widthOfTextAtSize(text, fieldSize);
  page.drawText(text, { x: x + (width - textWidth) / 2, y, size: fieldSize, font, color });
}

/** Streams the supplied certificate template with participant details overlaid. */
async function streamCertificate({ res, user, competition, position, dateRangeLabel }) {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(TEMPLATE_PATH));
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(fs.readFileSync(HINDI_FONT), { subset: true });
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const positionLabel = CERT_POSITION_LABEL[position] || "प्रोत्साहन";

  // Cover only the sample date; the template's blank lines remain visible beneath the overlays.
  page.drawRectangle({
    x: pageWidth * 0.3,
    y: pageHeight * 0.43,
    width: pageWidth * 0.4,
    height: pageHeight * 0.055,
    color: rgb(1, 1, 1),
  });

  drawCenteredText(page, font, `(${eventDateRangeLabel(dateRangeLabel)})`, pageHeight * 0.445, 17);
  drawCenteredText(page, font, user.name || "", pageHeight * 0.325, 17);
  drawFieldText(page, font, competition.name || "", pageWidth * 0.34, pageHeight * 0.295, pageWidth * 0.22, 15);
  drawFieldText(page, font, positionLabel, pageWidth * 0.34, pageHeight * 0.26, pageWidth * 0.22, 15);

  const pdfBytes = await pdfDoc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="certificate-${user.employeeCode || "participant"}-${competition._id}.pdf"`
  );
  res.end(Buffer.from(pdfBytes));
}

module.exports = { streamCertificate, CERT_POSITION_LABEL };