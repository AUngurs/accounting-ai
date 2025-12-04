import OpenAI from "openai";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function needsOCR(text) {
  return text.trim().length < 50;
}

async function runOCR(buffer) {
  // TODO: integrate Tesseract, Google Vision, or OpenAI Vision
  return "";
}

async function callLLM(text, companyName) {
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

Noteikumi:
- "document_number" ir precīzs dokumentā atrastais numurs.
- "document_date" jābūt formātā "YYYY-MM-DD". Ja datumā teksta avotā ir cits formāts (piemēram, 30.10.2024), pārvērt to YYYY-MM-DD. Nekad neatgriez DD.MM.YYYY, DD/MM/YYYY vai citus formātus.
- "document_type" var būt tikai "Rēķ" (Rēķins) vai "Kredītrēķ." (Kredītrēķins).
- "document_group" var būt tikai "D" (Debeta parāds) vai "K" (Kredīta parāds), saskaņā ar noteikumiem augstāk.
- Ja kāda lauka nav tekstā, atstāj to kā tukšu string.
- "partner" nav mūsu uzņēmums (${companyName}).
- Piezīmes ("notes") ir īsas, max 200 rakstzīmes.
- Atbild tikai ar JSON, bez paskaidrojumiem.

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
    let raw = response.choices[0].message.content.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/, "").replace(/```$/, "");
    }

    const parsed = JSON.parse(raw);

    const standardized = parsed.map((doc) => ({
      ...doc,
      amount: doc.amount ? parseFloat(doc.amount.toString().replace(",", ".")).toFixed(2) : "",
    }));

    console.log(standardized);

    return standardized;
  } catch (err) {
    console.error("Failed to parse AI response:", response.choices[0].message.content);
    throw new Error("AI returned invalid JSON");
  }
}

export const importPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file is required" });

    const companyName = req.body.companyName;

    const uint8array = new Uint8Array(req.file.buffer);
    const parser = new PDFParse(uint8array);
    const extractedText = (await parser.getText()).text;

    /*
    if (needsOCR(extractedText)) {
      console.log("Running OCR...");
      const ocrText = await runOCR(req.file.buffer);
      extractedText += "\n" + ocrText;
    }
    */
    console.log(extractedText);
    const aiResult = await callLLM(extractedText, companyName);
    res.json({
      documents: aiResult,
    });
  } catch (error) {
    console.error("PDF import error:", error);
    res.status(500).json({ error: "Failed to import or parse PDF" });
  }
};
