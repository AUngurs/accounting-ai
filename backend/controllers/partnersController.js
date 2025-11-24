import pool from "../db.js";
import fs from "fs";
import { parseStringPromise } from "xml2js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

export const getPartners = async (req, res) => {
  try {
    const companyID = req.params.companyId;

    const partnersResult = await pool.query("SELECT * FROM partners WHERE company_id = $1 ORDER BY partner_name", [
      companyID,
    ]);

    res.json(partnersResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const importPartners = [
  upload.single("xmlFile"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const companyID = req.params.companyId;
      const xmlData = fs.readFileSync(req.file.path, "utf-8");
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
      });

      const partnersRaw = result.dataroot.tjResponse.Partner;
      const partners = Array.isArray(partnersRaw) ? partnersRaw : [partnersRaw];

      const newPartners = [];
      const skipped = [];

      for (const partner of partners) {
        const isCompany = partner.PartnerKindName === "Juridiska persona";

        const partnerTitle = isCompany ? partner.PartnerTitle || "" : partner.PartnerSurname || "";
        const partnerName = isCompany ? partner.PartnerName || "" : partner.PartnerFirstName || "";
        const partnerRegNr = isCompany
          ? partner.PartnerRegistrationNo || ""
          : partner.PartnerPersonalIdentityNo || `TEMP-${partnerName}-${partnerTitle}`;

        const checkQuery = `
          SELECT * FROM partners
          WHERE company_id = $1 AND partner_reg_nr = $2
        `;

        const { rows: existing } = await pool.query(checkQuery, [companyID, partnerRegNr]);

        if (existing.length > 0) {
          skipped.push({
            partnerRegNr,
            reason: "Partneris jau reģistrēts",
          });
          continue;
        }

        const vatInfoRaw = partner.PartnerVatNo;
        const vatInfo = Array.isArray(vatInfoRaw) ? vatInfoRaw[0] : vatInfoRaw || {};

        const insertQuery = `
            INSERT INTO partners
            (company_id, partner_kind_name, partner_title, partner_name, partner_reg_nr, partner_vat_type, vat_country_code, vat_nr, vat_nr_default_notice)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const { rows: partnerRows } = await pool.query(insertQuery, [
          companyID,
          partner.PartnerKindName || "",
          partnerTitle,
          partnerName,
          partnerRegNr,
          partner.PartnerTaxpayerType || "",
          vatInfo.VatNoCountryCode || "",
          vatInfo.VatNo || "",
          vatInfo.VatNoDefaultNoticeID || "",
        ]);

        newPartners.push(partnerRows[0]);
      }

      fs.unlinkSync(req.file.path);
      res.json({
        message: "Import completed",
        imported: newPartners.length,
        skipped: skipped.length,
        newPartners,
        skippedPartners: skipped,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to import XML" });
    }
  },
];

export const editPartner = async (req, res) => {
  try {
    const { partner_id } = req.params;
    const { kind_name, title, name, reg_nr, vat_type, vat_country_code, vat_nr } = req.body;

    if (!kind_name || !name || !vat_type) {
      return res.status(400).json({ error: "Some fields are required" });
    }

    const result = await pool.query(
      `UPDATE partners
       SET partner_kind_name = $1,
           partner_title = $2,
           partner_name = $3,
           partner_reg_nr = $4,
           partner_vat_type = $5,
           vat_country_code = $6,
           vat_nr = $7
       WHERE id = $8
       RETURNING *`,
      [kind_name, title, name, reg_nr, vat_type, vat_country_code, vat_nr, partner_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Partneris nav atrasts" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Kļūda rediģējot partneri:", err);
    res.status(500).json({ error: "Neizdevās rediģēt partneri" });
  }
};

export const deletePartner = async (req, res) => {
  const { partner_id } = req.params;
  try {
    const result = await pool.query("DELETE FROM partners WHERE id = $1 RETURNING *", [partner_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Partneris nav atrasts" });
    }

    res.status(200).json({ message: "Partneris veiksmīgi dzēsts" });
  } catch (err) {
    console.error("Dzēšanas kļūda:", err);
    res.status(500).json({ message: "Neizdevās dzēst partneri" });
  }
};

export const bulkDeletePartners = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Nav norādīti partneru ID" });
  }

  try {
    const result = await pool.query("DELETE FROM partners WHERE id = ANY($1) RETURNING *", [ids]);

    res.status(200).json({
      message: `Veiksmīgi dzēsti ${result.rowCount} partneri`,
      deletedCount: result.rowCount,
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ message: "Neizdevās dzēst partnerus" });
  }
};
