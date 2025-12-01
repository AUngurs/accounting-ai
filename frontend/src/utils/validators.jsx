export const isRequired = (value) => value !== undefined && value !== null && value !== "";
export const isDigitsOnly = (value) => /^\d+$/.test(value);
export const maxLength = (value, length) => value.length <= length;
export const minLength = (value, length) => value.length >= length;
export const uniqueInArray = (array, key, value, currentId = null) => !array.some((item) => item[key] === value && item.id !== currentId);
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// LOGIN
export const loginRules = (data) => {
  const errors = {};

  if (!isRequired(data.email)) errors.email = "E-pasts ir obligāts";
  else if (!isEmail(data.email)) errors.email = "Nederīgs e-pasta formāts";

  if (!isRequired(data.password)) errors.password = "Parole ir obligāta";
  else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt vismaz 8 simboliem";
  else if (!maxLength(data.password, 64)) errors.password = "Parole nedrīkst pārsniegt 64 simbolus";

  return errors;
};

// REGISTER
export const registerRules = (data) => {
  const errors = {};

  if (!isRequired(data.email)) errors.email = "E-pasts ir obligāts";
  else if (!isEmail(data.email)) errors.email = "Nederīgs e-pasta formāts";

  if (!isRequired(data.username)) errors.username = "Lietotājvārds ir obligāts";
  else if (!minLength(data.username, 3)) errors.username = "Lietotājvārdam jābūt vismaz 3 simboliem";
  else if (!maxLength(data.username, 20)) errors.username = "Lietotājvārds nedrīkst pārsniegt 20 simbolus";

  if (!isRequired(data.password)) errors.password = "Parole ir obligāta";
  else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt vismaz 8 simboliem";
  else if (!maxLength(data.password, 64)) errors.password = "Parole nedrīkst pārsniegt 64 simbolus";

  if (!isRequired(data.repeatPassword)) errors.repeatPassword = "Atkārtota parole ir obligāta";
  else if (data.repeatPassword !== data.password) errors.repeatPassword = "Paroles nesakrīt";

  return errors;
};

// USER
export const userRules = (data, allowPasswordEdit = false) => {
  const errors = {};

  if (!isRequired(data.username)) errors.username = "Lietotājvārds ir obligāts";
  else if (!minLength(data.username, 3)) errors.username = "Lietotājvārdam jābūt vismaz 3 simboliem";
  else if (!maxLength(data.username, 20)) errors.username = "Lietotājvārds nedrīkst pārsniegt 20 simbolus";

  if (allowPasswordEdit && data.password !== undefined) {
    if (!isRequired(data.password)) errors.password = "Parole ir obligāta";
    else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt vismaz 8 simboliem";
    else if (!maxLength(data.password, 64)) errors.password = "Parole nedrīkst pārsniegt 64 simbolus";

    if (!isRequired(data.repeatPassword)) errors.repeatPassword = "Atkārtotā parole ir obligāta";
    else if (data.repeatPassword !== data.password) errors.repeatPassword = "Paroles nesakrīt";
  }

  return errors;
};

// COMPANIES
export const companyRules = (companies, company) => {
  const errors = {};

  const name = company.name?.trim() || "";

  if (!isRequired(name)) errors.name = "Nosaukums nedrīkst būt tukšs";
  else if (!minLength(name, 3)) errors.name = "Nosaukumam jāsatur vismaz 3 simboli";
  else if (!maxLength(name, 30)) errors.name = "Nosaukums nedrīkst pārsniegt 30 simbolus";
  else if (companies.some((c) => c.name.trim().toLowerCase() === name.toLowerCase() && c.id !== company.id))
    errors.name = "Uzņēmums ar šādu nosaukumu jau eksistē";

  return errors;
};

// ACCOUNTS
export const accountRules = (accounts, account) => {
  const errors = {};
  if (!isRequired(account.code)) errors.code = "Kods ir obligāts";
  else if (!isDigitsOnly(account.code)) errors.code = "Kods drīkst saturēt tikai ciparus";
  else if (!uniqueInArray(accounts, "code", account.code, account.id)) errors.code = "Kods jau eksistē";

  if (!isRequired(account.name)) errors.name = "Nosaukums ir obligāts";
  else if (account.name.length > 255) errors.name = "Nosaukums nedrīkst pārsniegt 255 simbolus";

  if (!isRequired(account.type)) errors.type = "Tips ir obligāts";
  if (!isRequired(account.category)) errors.category = "Kategorija ir obligāta";

  return errors;
};

// PARTNERS
export const partnerRules = (partners, partner) => {
  const errors = {};

  const isCompany = partner.kind_name === "Juridiska persona";

  if (!partner.name.trim()) {
    errors.name = "Nosaukums ir obligāts";
  } else if (partner.name.trim().length > 255) {
    errors.name = "Nosaukums nedrīkst pārsniegt 255 simbolus";
  }

  if (!isCompany) {
    if (!partner.title.trim()) {
      errors.title = "Uzvārds ir obligāts";
    } else if (partner.title.trim().length > 50) {
      errors.title = "Uzvārds nedrīkst pārsniegt 50 simbolus";
    }
  } else {
    if (partner.title.trim() && partner.title.trim().length > 50) {
      errors.title = "Tiesiskā forma nedrīkst pārsniegt 50 simbolus";
    }
  }

  const duplicate = partners.find(
    (p) =>
      p.id !== partner.id &&
      p.partner_name.trim() === partner.name.trim() &&
      (p.partner_title?.trim() || "") === (partner.title?.trim() || "")
  );
  if (duplicate) {
    errors.name = "Šāds partneris jau eksistē";
  }

  if (partner.reg_nr && partner.reg_nr.length > 50) {
    errors.reg_nr = "Reģistrācijas nr. nedrīkst pārsniegt 50 simbolus";
  } else if (partner.reg_nr && partners.some((p) => p.id !== partner.id && p.partner_reg_nr === partner.reg_nr)) {
    errors.reg_nr = "Partneris ar šādu reģistrācijas numuru jau eksistē";
  }

  if (partner.isVatEditable) {
    if (partner.vat_nr.length < 3) {
      errors.vat_nr = "PVN numurs ir obligāts";
    } else if (partner.vat_nr.length > 48) {
      errors.vat_nr = "PVN numurs nedrīkst pārsniegt 48 simbolus";
    } else if (partners.some((p) => p.id !== partner.id && p.vat_nr === partner.vat_nr)) {
      errors.vat_nr = "Partneris ar šādu PVN numuru jau eksistē";
    }
  }

  return errors;
};

// DOCUMENTS
export const documentRules = (documents, doc) => {
  const errors = {};

  if (!isRequired(doc.doc_id)) {
    errors.doc_id = "Dokumenta numurs ir obligāts";
  } else if (!minLength(doc.doc_id, 1)) {
    errors.doc_id = "Dokumenta numuram jābūt vismaz 1 simbolam";
  } else if (!maxLength(doc.doc_id, 50)) {
    errors.doc_id = "Dokumenta numurs nedrīkst pārsniegt 50 simbolus";
  }

  if (!isRequired(doc.doc_date)) {
    errors.doc_date = "Datums ir obligāts";
  }

  if (!isRequired(doc.doc_amount)) {
    errors.doc_amount = "Summa ir obligāta";
  } else if (isNaN(Number(doc.doc_amount))) {
    errors.doc_amount = "Summai jābūt skaitlim";
  } else if (Number(doc.doc_amount) === 0) {
    errors.doc_amount = "Summa nedrīkst būt 0";
  }

  if (doc.doc_comments && !maxLength(doc.doc_comments, 255)) {
    errors.doc_comments = "Komentārs nedrīkst pārsniegt 255 simbolus";
  }

  const duplicate = documents.some((d) => {
    if (doc.id && d.id === doc.id) return false;
    return (
      d.doc_id?.trim().toLowerCase() === doc.doc_id?.trim().toLowerCase() &&
      d.doc_date === doc.doc_date &&
      d.doc_type_abbrev === doc.doc_type_abbrev &&
      d.doc_group_abbrev === doc.doc_group_abbrev &&
      Number(d.doc_amount) === Number(doc.doc_amount) &&
      d.partner_id === doc.partner_id
    );
  });

  if (duplicate) {
    errors.doc_id = "Šāds dokuments jau eksistē";
  }

  return errors;
};

// DOCUMENT LINES
export const documentLineRules = (line) => {
  const errors = {};

  if (!line.line_amount && line.line_amount !== 0) {
    errors.line_amount = "Summa ir obligāta";
  } else if (isNaN(Number(line.line_amount))) {
    errors.line_amount = "Summai jābūt skaitlim";
  }

  if (line.line_vat_rate !== "" && line.line_vat_rate !== null && line.line_vat_rate !== undefined) {
    const rate = Number(line.line_vat_rate);
    if (!Number.isInteger(rate) || rate < 1 || rate > 100) {
      errors.line_vat_rate = "PVN likmei jābūt no 1 līdz 100";
    }
  }

  if (line.line_comments && !maxLength(line.line_comments, 255)) {
    errors.line_comments = "Komentārs nedrīkst pārsniegt 255 simbolus";
  }

  return errors;
};
