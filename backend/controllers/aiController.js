import OpenAI from "openai";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import vision from "@google-cloud/vision";

dotenv.config();

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
        content: `Tu esi AI, kas izvelk strukturētus grāmatvedības dokumentus no PDF teksta latviešu valodā.
Tavas kompānijas nosaukums ir: "${companyName}".


Katram tekstā atrastajam dokumentam:

Dokumenta numurs - var tikt apzīmēts arī kā "Dok. numurs", "Rēķina nr.", "Rēķins Nr.", "Kredītrēķina numurs" utt.
    
Debeta parāds (D) - rēķins, ko izrakstījusi mūsu kompānija (${companyName}):
    1) Rēķina adresāts ir klients vai pircējs, nevis mūsu uzņēmums.
    2) ${companyName} var būt minēts kā "Pakalpojuma sniedzējs", "Sūtītājs", "Nosūtītājs".
    3) Summa ir jāmaksā klientam - mūsu uzņēmums gaida saņemšanu.
    4) Partnera lauks (partner) norāda klienta nosaukumu.

Kredīta parāds (K) - rēķins, ko izrakstījis kāds mums:
    1) Rēķina adresāts ir mūsu uzņēmums (${companyName}).
    2) Rēķinā bieži minēts “Saņemts rēķins”, “Piegādātājs: [uzņēmuma nosaukums]”.
    3) Summa ir jāmaksā mums - mēs esam maksātāji vai saņēmēji.
    4) Partnera lauks (partner) norāda piegādātāja nosaukumu.

    Lūdzu izvērtē dokumentu pēc rēķina adresāta un partnera: ja adresāts nav mūsu uzņēmums → Debeta parāds, ja adresāts ir mūsu uzņēmums → Kredīta parāds. Ja nav skaidrs, atstāj tukšu.

Adresāta noteikšanas prioritāte (no augstākās uz zemāko):
1) Lauki: "Rēķina saņēmējs", "Pircējs", "Klients", "Adresāts"
2) Juridiskās adreses bloks (nosaukums + reģ. nr.)
3) Teksts "Rēķins izrakstīts" / "Saņemts rēķins"
4) Ja minēti abi uzņēmumi bez skaidras lomas → neskaidrs

Pirms JSON atgriešanas:
1) Nosaki, kurš ir rēķina IZRAKSTĪTĀJS un kurš ir RĒĶINA SAŅĒMĒJS.
2) Skaidri nosaki, vai adresāts ir mūsu uzņēmums (${companyName}) vai nē.
3) Tikai pēc tam nosaki document_group (D vai K).
4) Ja adresāts NAV skaidri identificējams, document_group atstāj tukšu.

Noteikumi:
- Nekad nenorādi ${companyName} laukā "partner".
- Neizdomā partnera nosaukumu, ja tas nav skaidri tekstā.
- Neaizpildi document_group, ja nav pārliecības.
- Neizdomā dokumenta numuru vai datumu.
- "document_number" ir precīzs dokumentā atrastais numurs.
- "document_date" jābūt formātā "YYYY-MM-DD". Ja datumā teksta avotā ir cits formāts (piemēram, 30.10.2024), pārvērt to YYYY-MM-DD. Nekad neatgriez DD.MM.YYYY, DD/MM/YYYY vai citus formātus.
- "document_type" var būt tikai "Rēķ" (Rēķins) vai "Kredītrēķ." (Kredītrēķins).
- "document_group" var būt tikai "D" (Debeta parāds) vai "K" (Kredīta parāds), saskaņā ar noteikumiem augstāk.
- Ja kāda lauka nav tekstā, atstāj to kā tukšu string.
- Piezīmes ("notes") ir īsas, max 200 rakstzīmes.
- Atbild tikai ar JSON, bez paskaidrojumiem.

Atgriez JSON masīvu ar vienu objektu par katru dokumentu šādā formātā:

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
1) Rēķins, ko izrakstījām klientam "SIA Alfa":
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

2) Kredītrēķins, ko saņēmām no piegādātāja "SIA Beta":
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
    console.error("Failed to parse AI response:", response.choices[0].message.content);
    throw new Error("AI returned invalid JSON");
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
    if (!req.file) return res.status(400).json({ error: "PDF file is required" });

    const companyName = req.body.companyName;

    // PDF buffer pārvērš Uint8Array formātā
    const uint8array = new Uint8Array(req.file.buffer);
    const parser = new PDFParse(uint8array);

    // Pēc noklusējuma izvelk tekstu
    const extractedText = (await parser.getText()).text;

    // Pārbauda, vai nepieciešams OCR
    let finalText = needsOCR(extractedText) ? await runOCR(req.file.buffer) : extractedText;

    // Attīra tekstu no liekām atstarpēm un sapludina vārdus/numurus
    finalText = finalText
      .replace(/(\d)\s+(\d)/g, "$1$2")
      .replace(/([A-Za-zĀ-ž])\s+([A-Za-zĀ-ž])/g, "$1$2")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Sauc LLM, lai strukturētu PDF datus JSON formātā
    const aiResult = await callLLM(finalText, companyName);

    res.json({ documents: aiResult });
  } catch (error) {
    console.error("PDF import error:", error);
    res.status(500).json({ error: "Failed to import or parse PDF" });
  }
};
