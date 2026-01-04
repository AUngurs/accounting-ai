import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import vision from "@google-cloud/vision";

// Inicializē Google Cloud Vision klientu OCR vajadzībām
const visionClient = new vision.ImageAnnotatorClient();

// Inicializē OpenAI klientu ar API atslēgu no .env
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function needsOCR(text) {
  if (!text) return true;
  // Aprēķina drukājamo simbolu īpatsvaru
  const printableRatio = text.replace(/\s/g, "").length / text.length;
  // Ja drukājamo simbolu mazāk par 70%, nepieciešams OCR
  return printableRatio < 0.7;
}

async function pdfToImages(buffer) {
  let tmpDir;
  try {
    // Pagaidu mape
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));

    // PDF pagaidu mapē
    const pdfPath = path.join(tmpDir, "input.pdf");
    fs.writeFileSync(pdfPath, buffer);

    // PDF uz PNG (300 DPI)
    await new Promise((resolve, reject) => {
      exec(`pdftoppm -r 300 -png "${pdfPath}" "${tmpDir}/page"`, (err) => (err ? reject(err) : resolve()));
    });

    // Savāc attēlu ceļus
    const imageBuffers = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith("page") && f.endsWith(".png"))
      .map((f) => fs.readFileSync(path.join(tmpDir, f)));

    return imageBuffers;
  } finally {
    // Notīra pagaidu mapes
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

async function runOCROnImageBuffer(imageBuffer) {
  // Izsauc Google Cloud Vision API teksta atpazīšanai no attēla
  const [result] = await visionClient.textDetection({
    image: { content: imageBuffer },
  });
  const extractedText = result.fullTextAnnotation?.text || "";
  return extractedText;
}

async function runOCR(buffer) {
  const imageBuffers = await pdfToImages(buffer);
  let fullText = "";

  // Veic OCR uz katra attēla un sapludina tekstus
  for (const imageBuffer of imageBuffers) {
    const text = await runOCROnImageBuffer(imageBuffer);
    fullText += "\n" + text;
  }

  return fullText.trim();
}

async function callLLM(text, companyName) {
  // Sazinās ar OpenAI LLM, lai strukturētu PDF tekstu JSON formātā.
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Tu esi grāmatveža palīgs, kas izvelk strukturētus grāmatvedības dokumentus no PDF dokumenta teksta latviešu valodā.
Tavas kompānijas nosaukums ir: "${companyName}".

Darbs ar katru dokumentu:
1. Nosaki rēķina izrakstītāju un rēķina saņēmēju.
2. Nosaki, vai rēķina adresāts ir tavs uzņēmums (${companyName}) vai nē.
3. Tikai pēc tam piešķir "document_group":
   - Adresāts nav ${companyName} -> "D" (Debeta parāds)
   - Adresāts ir ${companyName} -> "K" (Kredīta parāds)
   - Ja nav skaidrs -> tukšs

Adresāta noteikšanas prioritāte:
1) Lauki: "Rēķina saņēmējs", "Pircējs", "Klients", "Adresāts"
2) Juridiskās adreses bloks (nosaukums + reģ. nr.)
3) Teksts: "Rēķins izrakstīts" / "Saņemts rēķins"
4) Ja abi uzņēmumi minēti bez skaidras lomas -> neskaidrs

Dokumentu lauki:
- document_number: precīzs dokumentā atrastais numurs
- document_date: formāts "YYYY-MM-DD"
- document_type: "Rēķ" (Rēķins) vai "Kredītrēķ." (Kredītrēķins)
- document_group: "D", "K" vai tukšs
- currency: valūta
- amount: summa (negatīva tikai kredītrēķinos, ja nepieciešams)
- partner: dokumentā skaidri norādītais otrais uzņēmums, nekad ${companyName}
- notes: īsas piezīmes, maksimums 255 rakstzīmes

Noteikumi:
- Nekad neizdomā partnera nosaukumu, dokumenta numuru vai datumu
- Neaizpildi document_group, ja adresāts nav skaidrs
- Atgriez tikai JSON, bez paskaidrojumiem
- JSON masīvs ar vienu objektu uz dokumentu:

[
  {
    "document_number": "",
    "document_date": "",
    "document_type": "",
    "document_group": "",
    "currency": "",
    "amount": "",
    "partner": "",
    "notes": ""
  }
]

Piemēri:
1) Debeta parāds:
{
  "document_number": "INV-2025-001",
  "document_date": "2025-12-01",
  "document_type": "Rēķ",
  "document_group": "D",
  "currency": "EUR",
  "amount": "1500.50",
  "partner": "SIA Alfa",
  "notes": "Par konsultāciju pakalpojumiem"
}

2) Kredīta parāds:
{
  "document_number": "CR-2025-010",
  "document_date": "2025-12-02",
  "document_type": "Kredītrēķ.",
  "document_group": "K",
  "currency": "EUR",
  "amount": "-300.00",
  "partner": "SIA Beta",
  "notes": "Atlaide par iepriekšējo pasūtījumu"
}`,
      },
      { role: "user", content: text },
    ],
  });

  try {
    // Saņem OpenAI atbildi un notīra ```json blokus, ja tādi ir
    let raw = response.choices[0].message.content.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/, "").replace(/```$/, "");
    }

    // Parsē JSON un formatē summu uz divām zīmēm aiz komata
    const parsed = JSON.parse(raw);
    const standardized = parsed.map((doc) => ({
      ...doc,
      amount: doc.amount ? parseFloat(doc.amount.toString().replace(",", ".")).toFixed(2) : "",
    }));

    return standardized;
  } catch (err) {
    console.error("Failed to parse AI response: ", response.choices[0].message.content);
    throw new Error("Neparedzēta servera kļūda");
  }
}

/**
 * Galvenā funkcija PDF importa endpointam.
 * - Izņem tekstu no PDF
 * - Pārbauda, vai nepieciešams OCR
 * - Notīra tekstu (novērš liekas atstarpes)
 * - Sauc LLM, lai strukturētu datus
 */
export const importPdf = async (req, res) => {
  try {
    const companyName = req.body.companyName;

    // PDF buffer pārvērš Uint8Array formātā
    const uint8array = new Uint8Array(req.file.buffer);
    const parser = new PDFParse(uint8array);

    // Pēc noklusējuma izvelk tekstu
    const extractedText = (await parser.getText()).text;

    // Pārbauda, vai nepieciešams OCR
    let finalText = needsOCR(extractedText) ? await runOCR(req.file.buffer) : extractedText;

    if (finalText.length === 0) {
      throw new Error("No results");
    }

    // Attīra tekstu no liekām atstarpēm un sapludina vārdus/numurus
    finalText = finalText
      .replace(/(\d)\s+(\d)/g, "$1$2")
      .replace(/([A-Za-zĀ-ž])\s+([A-Za-zĀ-ž])/g, "$1$2")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Sauc LLM, lai strukturētu PDF datus JSON formātā
    const aiResult = await callLLM(finalText, companyName);

    if (!Array.isArray(aiResult) || aiResult.length === 0) {
      throw new Error("No results");
    }

    res.status(200).json({ documents: aiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};
