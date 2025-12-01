import pool from "../db.js";
import fs from "fs";
import { parseStringPromise, Builder } from "xml2js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

export const getPartners = async (req, res) => {
  try {
    const companyID = req.params.companyId;

    const partnersResult = await pool.query("SELECT * FROM partners WHERE company_id = $1 ORDER BY formatted_name", [companyID]);

    res.json(partnersResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createPartner = async (req, res) => {
  try {
    const company_id = req.params.companyId;
    const { kind_name, title, name, reg_nr, vat_type, vat_country_code, vat_nr } = req.body;

    if (!kind_name || !name || !company_id) {
      return res.status(400).json({ error: "Some fields are required" });
    }

    // Build formatted_name
    let formatted_name = "";
    if (kind_name === "Juridiska persona") {
      formatted_name = title ? `${name}, ${title}` : name;
    } else {
      formatted_name = `${title || ""} ${name}`.trim();
    }

    const result = await pool.query(
      `INSERT INTO partners
        (partner_kind_name, partner_title, partner_name, partner_reg_nr,
         partner_vat_type, vat_country_code, vat_nr, company_id, formatted_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [kind_name, title || "", name, reg_nr || "", vat_type || "", vat_country_code || "", vat_nr || "", company_id, formatted_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Kļūda pievienojot partneri:", err);
    res.status(500).json({ error: "Neizdevās pievienot partneri" });
  }
};

export const importPartners = [
  upload.single("xmlFile"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const companyID = req.params.companyId;
      const xmlData = fs.readFileSync(req.file.path, "utf-8");
      const result = await parseStringPromise(xmlData, { explicitArray: false });

      const partnersRaw = result.dataroot.tjResponse.Partner;
      const partners = Array.isArray(partnersRaw) ? partnersRaw : [partnersRaw];

      const newPartners = [];
      const skipped = [];

      for (const partner of partners) {
        const isCompany = partner.PartnerKindName === "Juridiska persona";

        const partnerTitle = isCompany ? (partner.PartnerTitle || "").trim() : (partner.PartnerSurname || "").trim();
        const partnerName = isCompany ? (partner.PartnerName || "").trim() : (partner.PartnerFirstName || "").trim();
        const partnerRegNr = isCompany ? (partner.PartnerRegistrationNo || "").trim() : (partner.PartnerPersonalIdentityNo || "").trim();

        // Build formatted_name for sorting/display
        let formattedName = "";
        if (isCompany) {
          formattedName = partnerTitle ? `${partnerName}, ${partnerTitle}` : partnerName;
        } else {
          formattedName = `${partnerTitle} ${partnerName}`.trim();
        }

        let existing;
        if (partnerRegNr !== "") {
          const regQuery = `
            SELECT * FROM partners
            WHERE company_id=$1 AND partner_reg_nr=$2
          `;
          existing = (await pool.query(regQuery, [companyID, partnerRegNr])).rows;
        } else {
          const nameQuery = `
            SELECT * FROM partners
            WHERE company_id=$1 
              AND LOWER(partner_name)=LOWER($2)
              AND LOWER(partner_title)=LOWER($3)
          `;
          existing = (await pool.query(nameQuery, [companyID, partnerName, partnerTitle])).rows;
        }

        if (existing.length > 0) {
          skipped.push({
            partnerRegNr: partnerRegNr || "(empty)",
            partnerName,
            reason: "Partner already exists",
          });
          continue;
        }

        const vatInfoRaw = partner.PartnerVatNo;
        const vatInfo = Array.isArray(vatInfoRaw) ? vatInfoRaw[0] : vatInfoRaw || {};

        const insertQuery = `
          INSERT INTO partners
          (company_id, partner_kind_name, partner_title, partner_name, partner_reg_nr,
           partner_vat_type, vat_country_code, vat_nr, vat_nr_default_notice, formatted_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          formattedName,
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

export const exportPartners = async (req, res) => {
  try {
    const companyID = req.params.companyId;
    const { ids } = req.body;

    if (!ids?.length) {
      return res.status(400).json({ error: "Nav atlasītu partneru" });
    }

    const { rows: partners } = await pool.query(`SELECT * FROM partners WHERE company_id = $1 AND id = ANY($2::int[])`, [companyID, ids]);

    const partnerXmlArray = partners.map((p) => {
      const isCompany = p.partner_kind_name === "Juridiska persona";
      const isPerson = p.partner_kind_name === "Fiziska persona";

      const partnerBlock = {
        PartnerKindName: p.partner_kind_name,

        ...(isCompany && {
          ...(p.partner_title && { PartnerTitle: p.partner_title }),
          ...(p.partner_name && { PartnerName: p.partner_name }),
          ...(p.partner_reg_nr && { PartnerRegistrationNo: p.partner_reg_nr }),
        }),

        ...(isPerson && {
          ...(p.partner_name && { PartnerFirstName: p.partner_name }),
          ...(p.partner_title && { PartnerSurname: p.partner_title }),
          ...(p.partner_reg_nr && { PartnerPersonalIdentityNo: p.partner_reg_nr }),
          ...(p.birth_date && { PhysicalPersonBirthDate: p.birth_date.toISOString() }),
        }),

        ...(p.partner_vat_type && { PartnerTaxpayerType: p.partner_vat_type }),

        PartnerLockedNoticeID: "0",
        PartnerProductWarehouseNoticeID: "0",
        PartnerTimberForwarderNoticeID: "0",
        PartnerCreditStatussBlocked: "",

        ...(p.vat_nr && {
          PartnerVatNo: {
            VatNo: p.vat_nr,
            ...(p.vat_country_code && { VatNoCountryCode: p.vat_country_code }),
            ...(p.vat_nr_default_notice && { VatNoDefaultNoticeID: p.vat_nr_default_notice }),
          },
        }),
      };

      return partnerBlock;
    });

    const xmlObj = {
      dataroot: {
        tjDocument: {
          $: { Version: "TJ5.5.101" },
        },
        tjResponse: {
          $: {
            Name: "Partner",
            Operation: "Insert",
            Version: "TJ7.0.112",
            Structure: "Tree",
          },
          Partner: partnerXmlArray,
        },
      },
    };

    const builder = new Builder({ xmldec: { version: "1.0", encoding: "utf-8" } });
    const xml = builder.buildObject(xmlObj);

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename=partners_selected_${companyID}.xml`);

    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export selected partners" });
  }
};

export const editPartner = async (req, res) => {
  try {
    const { partner_id } = req.params;
    const { kind_name, title, name, reg_nr, vat_type, vat_country_code, vat_nr } = req.body;

    if (!kind_name || !name) {
      return res.status(400).json({ error: "Some fields are required" });
    }

    let formatted_name = "";
    if (kind_name === "Juridiska persona") {
      formatted_name = title ? `${name}, ${title}` : name;
    } else {
      formatted_name = `${title || ""} ${name}`.trim();
    }

    const result = await pool.query(
      `UPDATE partners
       SET partner_kind_name = $1,
           partner_title = $2,
           partner_name = $3,
           partner_reg_nr = $4,
           partner_vat_type = $5,
           vat_country_code = $6,
           vat_nr = $7,
           formatted_name = $8
       WHERE id = $9
       RETURNING *`,
      [kind_name, title || "", name, reg_nr || "", vat_type || "", vat_country_code || "", vat_nr || "", formatted_name, partner_id]
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
