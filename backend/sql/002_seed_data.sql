INSERT INTO users (email, username, password)
VALUES
('arturs@example.com', 'Artūrs', 'password123');

INSERT INTO companies (user_id, name)
VALUES
(1, 'SIA Pirmais uzņēmums'),
(1, 'AS Otrais uzņēmums');

INSERT INTO accounts (company_id, code, name)
VALUES
(1, '7110', 'Materiāli'),
(1, '7170', 'Pakalpojumu'),
(1, '9010', 'Starpkonts'),
(1, '5720', 'Nodokļi'),
(2, '6110', 'Materiāli'),
(2, '6170', 'Pakalpojumu'),
(2, '1010', 'Starpkonts'),
(2, '2720', 'Nodokļi');

INSERT INTO partners (
    company_id,
    partner_kind_name,
    partner_title,
    partner_name,
    partner_reg_nr,
    partner_vat_type,
    vat_country_code,
    vat_nr,
    vat_nr_default_notice
)
VALUES
(1, 'Juridiska persona', 'SIA', 'Pirmais partneris', '12345678', 'Apliekama persona, LV', 'LV', 'LV12345678901', '1'),
(1, 'Juridiska persona', 'AS', 'Otrais partneris', '6666666', 'Apliekama persona, LV', 'LV', 'LV50505050', '1'),
(2, 'Juridiska persona', 'OU', 'Trešais partneris', '333333333', 'Apliekama persona, EU', 'EE', 'EE987987', '1');

INSERT INTO documents (
    company_id,
    partner_id,
    doc_id,
    doc_date,
    doc_type_abbrev,
    doc_group_abbrev,
    doc_currency,
    doc_amount,
    doc_comments
)
VALUES
(1, 1, 'INV-001', '2025-10-10', 'Rēķ', 'K', 'EUR', 375.50, 'Pirmais rēķins'),
(1, 2, 'INV-002', '2025-11-16', 'Rēķ', 'K', 'EUR', 3200.00, 'Otrais rēķins');

INSERT INTO document_lines (
    document_id,
    line_supplementary_notice,
    line_currency,
    line_amount,
    line_debet_account,
    line_credit_account,
    line_vat_rate,
    line_comments
)
VALUES
-- INV-001
(1, '1', 'EUR', 375.50, '7110', '5310', '0', 'Pirmais un pēdējais kontējums'),

-- INV-002
(2, '1', 'EUR', 2644.63, '7110', '5310', '21', 'Pirmais kontējums'),
(2, '1', 'EUR', 555.37, '57212', '5310', '21', 'Otrais kontējums');