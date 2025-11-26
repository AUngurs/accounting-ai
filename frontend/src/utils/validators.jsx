export const isRequired = (value) => value !== undefined && value !== null && value !== "";

export const isDigitsOnly = (value) => /^\d+$/.test(value);

export const maxLength = (value, length) => value.length <= length;

export const minLength = (value, length) => value.length >= length;

export const uniqueInArray = (array, key, value, currentId = null) => !array.some((item) => item[key] === value && item.id !== currentId);

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// KONTU PLĀNS
export const accountRules = (accounts, account) => {
  const errors = {};
  if (!isRequired(account.code)) errors.code = "Kods ir obligāts";
  else if (!isDigitsOnly(account.code)) errors.code = "Kods drīkst saturēt tikai ciparus";
  else if (!uniqueInArray(accounts, "code", account.code, account.id)) errors.code = "Kods jau eksistē";

  if (!isRequired(account.name)) errors.name = "Nosaukums ir obligāts";
  if (!isRequired(account.type)) errors.type = "Tips ir obligāts";
  if (!isRequired(account.category)) errors.category = "Kategorija ir obligāta";

  return errors;
};

// PARTNERI
export const partnerRules = (partners, partner) => {
  const errors = {};

  if (!isRequired(partner.kind_name)) errors.kind_name = "Tips ir obligāts";

  if (!isRequired(partner.name)) errors.name = "Nosaukums ir obligāts";
  if (!maxLength(partner.name, 100)) errors.name = "Nosaukums nedrīkst būt garāks par 100 simboliem";

  if (partner.reg_nr && !uniqueInArray(partners, "partner_reg_nr", partner.reg_nr, partner.id))
    errors.reg_nr = "Reģistrācijas numurs jau eksistē";

  return errors;
};

// FINANŠU DOKUMENTI
export const documentRules = (documents, doc) => {
  const errors = {};
  return errors;
};

export const userRules = (documents, doc) => {
  const errors = {};
  return errors;
};
