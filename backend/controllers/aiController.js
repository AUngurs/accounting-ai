import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function pdfToImages(buffer) {
  let tmpDir;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));
    const pdfPath = path.join(tmpDir, "input.pdf");
    fs.writeFileSync(pdfPath, buffer);

    await new Promise((resolve, reject) => {
      exec(`pdftoppm -r 200 -png "${pdfPath}" "${tmpDir}/page"`, (err) => (err ? reject(err) : resolve()));
    });

    const imageBuffers = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith("page") && f.endsWith(".png"))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || "0");
        const numB = parseInt(b.match(/\d+/)?.[0] || "0");
        return numA - numB;
      })
      .map((f) => fs.readFileSync(path.join(tmpDir, f)));

    return imageBuffers;
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function callLLM(imageBuffers, companyName) {
  const imageContent = imageBuffers.map((buf) => ({
    type: "image_url",
    image_url: {
      url: `data:image/png;base64,${buf.toString("base64")}`,
      detail: "high",
    },
  }));

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
Tu esi grāmatveža palīgs, kas izvelk strukturētus grāmatvedības dokumentus no PDF dokumentu attēliem latviešu valodā.
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
- amount: kopējā summa ar PVN (negatīva tikai kredītrēķinos)
- partner: dokumentā skaidri norādītais otrais uzņēmums, nekad ${companyName}
- notes: īsas piezīmes, maksimums 255 rakstzīmes

Noteikumi:
- Nekad neizdomā partnera nosaukumu, dokumenta numuru vai datumu
- Neaizpildi document_group, ja adresāts nav skaidrs
- Atgriez JSON objektu ar atslēgu "documents", kuras vērtība ir masīvs ar vienu objektu uz dokumentu`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Izvelc dokumentu informāciju no šīm PDF lapām un atgriez JSON." },
          ...imageContent,
        ],
      },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const parsed = JSON.parse(raw);

  const documents = parsed.documents ?? (Array.isArray(parsed) ? parsed : []);

  return documents.map((doc) => ({
    ...doc,
    amount: doc.amount ? parseFloat(doc.amount.toString().replace(",", ".")).toFixed(2) : "",
  }));
}

export const importPdf = async (req, res) => {
  try {
    const companyName = req.body.companyName;

    const imageBuffers = await pdfToImages(req.file.buffer);

    if (imageBuffers.length === 0) {
      throw new Error("No results");
    }

    const aiResult = await callLLM(imageBuffers, companyName);

    if (!Array.isArray(aiResult) || aiResult.length === 0) {
      throw new Error("No results");
    }

    res.status(200).json({ documents: aiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Neparedzēta servera kļūda" });
  }
};
