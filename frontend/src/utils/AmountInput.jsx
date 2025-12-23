import React from "react";
import { Form } from "react-bootstrap";

// AmountInput komponente, kas ļauj ievadīt skaitliskās vērtības ar divām decimāldaļām un negatīvo simbolu
export default function AmountInput({ value, onChange, isInvalid, size, ...rest }) {
  // Apstrādā taustiņu nospiešanu, īpaši negatīvo simbolu
  const handleKeyDown = (e) => {
    if (e.key === "-") {
      e.preventDefault();
      if (!value) {
        onChange("-");
        return;
      } // Ja ievads tukšs, pievieno "-"
      if (value === "-") return; // Ja jau ir "-", neko nedara
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onChange((-num).toString()); // Apgriež skaitļa zīmi
      }
    }
  };

  // Apstrādā teksta izmaiņas ievadā, ļauj tikai derīgus skaitļus ar divām decimāldaļām
  const handleChange = (e) => {
    let val = e.target.value;
    if (val === "-") {
      onChange(val);
      return;
    } // Ļauj "-" ievadi
    if (val.startsWith(".")) val = "0" + val; // Pievieno nulli pirms punkta
    const validPattern = /^-?\d*\.?\d*$/;
    if (!validPattern.test(val)) return; // Ignorē nederīgu simbolu
    if (val.includes(".")) {
      const [, decimals] = val.split(".");
      if (decimals.length > 2) return; // Ļauj ne vairāk kā 2 decimāldaļas
    }
    onChange(val);
  };

  // Apstrādā, kad lauks zaudē fokusu, noformē vērtību ar divām decimāldaļām vai iztīra
  const handleBlur = () => {
    if (!value || value === "-") {
      onChange("");
      return;
    } // Tukšs vai "-" kļūst par ""
    const num = parseFloat(value);
    if (isNaN(num)) {
      onChange("");
      return;
    } // Ja nav skaitlis, iztīra
    onChange(num.toFixed(2)); // Noformē ar divām decimāldaļām
  };

  return (
    <Form.Control
      {...rest}
      type="text"
      inputMode="decimal"
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onBlur={handleBlur}
      isInvalid={isInvalid}
      size={size}
    />
  );
}
