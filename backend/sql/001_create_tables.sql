CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,

    CONSTRAINT fk_companies_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    category VARCHAR(50),
    UNIQUE (company_id, code),

    CONSTRAINT fk_accounts_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);

CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,

    -- ATBILST JUMIS SPECIFIKACIJAI
    partner_kind_name VARCHAR(100),     -- <PartnerKindName> Juridiska persona
    partner_title VARCHAR(50),          -- <PartnerTitle> SIA
    partner_name VARCHAR(255) NOT NULL, -- <PartnerName> MADARA 93
    partner_reg_nr VARCHAR(50),         -- <PartnerRegistrationNo> 46603001941
    partner_vat_type VARCHAR(50),       -- <PartnerTaxpayerType> Apliekama persona, LV
    vat_country_code VARCHAR(3),        -- <VatNoCountryCode> LV
    vat_nr VARCHAR(50),                 -- <VatNo> LV46603001941
    vat_nr_default_notice VARCHAR(1),   -- <VatNoDefaultNoticeID> 1

    formatted_name VARCHAR(307),

    CONSTRAINT fk_partners_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    partner_id INT,

    -- ATBILST JUMIS SPECIFIKACIJAI
    doc_id VARCHAR(50),                -- <DocNo> 00290
    doc_date DATE,                -- <DocDate> 2015-12-07T00:00:00
    doc_type_abbrev VARCHAR(25),       -- <DocTypeAbbreviation> Rēķ
    doc_group_abbrev VARCHAR(25),      -- <DocGroupAbbreviation> K
    doc_currency VARCHAR(3),           -- <DocCurrency> EUR
    doc_amount NUMERIC(12,2),                  -- <DocAmount> 685
    doc_comments VARCHAR(255),         -- <DocComments> Durvis
    
    is_accounted BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_documents_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_documents_partner
        FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE SET NULL
);

CREATE TABLE document_lines (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,

    -- ATBILST JUMIS SPECIFIKACIJAI
    line_supplementary_notice VARCHAR(1),   -- <LineSupplementaryNoticeID> 1
    line_currency VARCHAR(3),               -- <LineCurrency> EUR
    line_amount NUMERIC(12,2),              -- <LineAmount> 685
    line_debet_account VARCHAR(21),         -- <LineDebetAccountCode> 7160
    line_credit_account VARCHAR(21),        -- <LineCreditAccountCode> 7160
    line_vat_rate INTEGER,                  -- <LineVatRate> 21
    line_comments VARCHAR(255),             -- <LineComments> Durvis

    CONSTRAINT fk_doc_lines_document
        FOREIGN KEY (document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE
);