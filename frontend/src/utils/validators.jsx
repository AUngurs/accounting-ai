// Pamatfunkcijas validācijai
export const isRequired = (value) => value !== undefined && value !== null && value !== "";
export const isDigitsOnly = (value) => /^\d+$/.test(value);
export const maxLength = (value, length) => value.length <= length;
export const minLength = (value, length) => value.length >= length;
export const uniqueInArray = (array, key, value, currentId = null) => !array.some((item) => item[key] === value && item.id !== currentId);
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const max17DigitsBeforeDecimal = (value) => {
  const val = value.toString().trim();
  const [integerPart] = val.split(".");
  return integerPart.length <= 17;
};

// LOGIN validācijas noteikumi
export const loginRules = (data) => {
  const errors = {};

  if (!isRequired(data.email)) errors.email = "Nederīgs e-pasta formāts";
  else if (!isEmail(data.email)) errors.email = "Nederīgs e-pasta formāts";

  if (!isRequired(data.password)) errors.password = "Parolei jābūt 8-64 simbolu garai";
  else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt 8-64 simbolu garai";
  else if (!maxLength(data.password, 64)) errors.password = "Parolei jābūt 8-64 simbolu garai";

  return errors;
};

// REGISTER validācijas noteikumi
export const registerRules = (data) => {
  const errors = {};

  if (!isRequired(data.email)) errors.email = "Nederīgs e-pasta formāts";
  else if (!isEmail(data.email)) errors.email = "Nederīgs e-pasta formāts";

  if (!isRequired(data.username)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";
  else if (!minLength(data.username, 3)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";
  else if (!maxLength(data.username, 20)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";

  if (!isRequired(data.password)) errors.password = "Parolei jābūt 8-64 simbolu garai";
  else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt 8-64 simbolu garai";
  else if (!maxLength(data.password, 64)) errors.password = "Parolei jābūt 8-64 simbolu garai";

  if (!isRequired(data.repeatPassword)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
  else if (!minLength(data.repeatPassword, 8)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
  else if (!maxLength(data.repeatPassword, 64)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
  else if (data.repeatPassword !== data.password) errors.repeatPassword = "Paroles nesakrīt";

  return errors;
};

// USER validācijas noteikumi
export const userRules = (data, allowPasswordEdit = false) => {
  const errors = {};

  if (!isRequired(data.username)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";
  else if (!minLength(data.username, 3)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";
  else if (!maxLength(data.username, 20)) errors.username = "Lietotājvārdam jābūt 3-20 simbolu garam";

  if (allowPasswordEdit && data.password !== undefined) {
    if (!isRequired(data.password)) errors.password = "Parolei jābūt 8-64 simbolu garai";
    else if (!minLength(data.password, 8)) errors.password = "Parolei jābūt 8-64 simbolu garai";
    else if (!maxLength(data.password, 64)) errors.password = "Parolei jābūt 8-64 simbolu garai";

    if (!isRequired(data.repeatPassword)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
    else if (!minLength(data.repeatPassword, 8)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
    else if (!maxLength(data.repeatPassword, 64)) errors.repeatPassword = "Parolei jābūt 8-64 simbolu garai";
    else if (data.repeatPassword !== data.password) errors.repeatPassword = "Paroles nesakrīt";
  }

  return errors;
};

// COMPANIES validācijas noteikumi
export const companyRules = (companies, company) => {
  const errors = {};

  const name = company.name?.trim() || "";

  if (!isRequired(name)) errors.name = "Uzņēmuma nosaukumam jābūt 3-30 simbolu garam";
  else if (!minLength(name, 3)) errors.name = "Uzņēmuma nosaukumam jābūt 3-30 simbolu garam";
  else if (!maxLength(name, 30)) errors.name = "Uzņēmuma nosaukumam jābūt 3-30 simbolu garam";
  else if (companies.some((c) => c.name.trim().toLowerCase() === name.toLowerCase() && c.id !== company.id))
    errors.name = "Uzņēmums ar šādu nosaukumu jau eksistē";

  return errors;
};

// ACCOUNTS validācijas noteikumi
export const accountRules = (accounts, account) => {
  const errors = {};
  if (!isRequired(account.code)) errors.code = "Kodam jābūt 1-21 ciparu garam";
  else if (!isDigitsOnly(account.code)) errors.code = "Kodam jābūt 1-21 ciparu garam";
  else if (account.code.length > 21) errors.code = "Kodam jābūt 1-21 ciparu garam";
  else if (!uniqueInArray(accounts, "code", account.code, account.id)) errors.code = "Kods jau eksistē";

  if (!isRequired(account.name)) errors.name = "Koda nosaukumam jābūt 1-255 simbolu garam";
  else if (account.name.length > 255) errors.name = "Koda nosaukumam jābūt 1-255 simbolu garam";

  if (!isRequired(account.type)) errors.type = "Tips ir obligāts";
  if (!isRequired(account.category)) errors.category = "Kategorija ir obligāta";

  return errors;
};

// PARTNERS validācijas noteikumi
export const partnerRules = (partners, partner) => {
  const errors = {};

  const isCompany = partner.kind_name === "Juridiska persona";

  if (!partner.name.trim()) {
    errors.name = "Nosaukumam vai vārdam jābūt 1-255 simbolu garam";
  } else if (partner.name.trim().length > 255) {
    errors.name = "Nosaukumam vai vārdam jābūt 1-255 simbolu garam";
  }

  if (!isCompany) {
    if (!partner.title.trim()) {
      errors.title = "Uzvārdam jābūt 1-50 simbolu garam";
    } else if (partner.title.trim().length > 50) {
      errors.title = "Uzvārdam jābūt 1-50 simbolu garam";
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
    errors.reg_nr = "Reģistrācijas nr./Personas kods nedrīkst pārsniegt 50 simbolus";
  } else if (partner.reg_nr && partners.some((p) => p.id !== partner.id && p.partner_reg_nr === partner.reg_nr)) {
    errors.reg_nr = "Partneris ar šādu reģistrācijas nr./Personas kodu jau eksistē";
  }

  if (partner.isVatEditable) {
    if (partner.vat_nr.length < 4) {
      errors.vat_nr = "PVN numuram jābūt 1-47 simbolu garam";
    } else if (partner.vat_nr.length > 47) {
      errors.vat_nr = "PVN numuram jābūt 1-47 simbolu garam";
    } else if (partners.some((p) => p.id !== partner.id && p.vat_nr === partner.vat_nr)) {
      errors.vat_nr = "Partneris ar šādu PVN numuru jau eksistē";
    }
  }

  return errors;
};

// DOCUMENTS validācijas noteikumi
export const documentRules = (documents, doc) => {
  const errors = {};

  if (!maxLength(doc.doc_id, 50)) {
    errors.doc_id = "Finanšu dokumenta numurs nedrīkst pārsniegt 50 simbolus";
  }

  if (!isRequired(doc.doc_date)) {
    errors.doc_date = "Finanšu dokumenta datums ir obligāts";
  }

  if (!isRequired(doc.doc_amount)) {
    errors.doc_amount = "Nederīgs summas formāts";
  } else if (isNaN(Number(doc.doc_amount))) {
    errors.doc_amount = "Nederīgs summas formāts";
  } else if (Number(doc.doc_amount) === 0) {
    errors.doc_amount = "Nederīgs summas formāts";
  } else if (!max17DigitsBeforeDecimal(doc.doc_amount)) {
    errors.doc_amount = "Nederīgs summas formāts";
  }

  if (doc.doc_comments && !maxLength(doc.doc_comments, 255)) {
    errors.doc_comments = "Piezīmes nedrīkst pārsniegt 255 simbolus";
  }

  const duplicate = documents.some((d) => {
    if (d.id === doc.id) return false; // skip self when editing
    const checks = {
      doc_id: d.doc_id?.trim().toLowerCase() === doc.doc_id?.trim().toLowerCase(),
      doc_date: d.doc_date === doc.doc_date,
      doc_type_abbrev: d.doc_type_abbrev === doc.doc_type_abbrev,
      doc_group_abbrev: d.doc_group_abbrev === doc.doc_group_abbrev,
      doc_amount: Number(d.doc_amount) === Number(doc.doc_amount),
      partner_id: Number(d.partner_id) === Number(doc.partner_id),
    };

    return Object.values(checks).every(Boolean);
  });

  if (duplicate) {
    errors.doc_id = "Šāds finanšu dokuments jau eksistē";
  }

  return errors;
};

// DOCUMENT LINES validācijas noteikumi
export const documentLineRules = (line) => {
  const errors = {};

  if (!isRequired(line.line_amount)) {
    errors.line_amount = "Nederīgs summas formāts";
  } else if (isNaN(Number(line.line_amount))) {
    errors.line_amount = "Nederīgs summas formāts";
  } else if (Number(line.line_amount) === 0) {
    errors.line_amount = "Nederīgs summas formāts";
  } else if (!max17DigitsBeforeDecimal(line.line_amount)) {
    errors.line_amount = "Nederīgs summas formāts";
  }

  if (line.line_vat_rate !== "" && line.line_vat_rate !== null && line.line_vat_rate !== undefined) {
    const rate = Number(line.line_vat_rate);
    if (!Number.isInteger(rate) || rate < 1 || rate > 100) {
      errors.line_vat_rate = "PVN likmei jābūt pozitīvam, veselam skaitlim no 1 līdz 100";
    }
  }

  if (line.line_comments && !maxLength(line.line_comments, 255)) {
    errors.line_comments = "Piezīmes nedrīkst pārsniegt 255 simbolus";
  }

  return errors;
};
