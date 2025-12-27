import { Form } from "react-bootstrap";

// AmountInput komponente, kas ļauj ievadīt skaitliskās vērtības ar divām decimāldaļām, negatīvo simbolu un max 17 ciparus pirms decimāldaļas
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
      if (!value.includes(".")) {
        onChange("-" + value.replace("-", ""));
      }
    }
  };

  // Apstrādā teksta izmaiņas ievadā
  const handleChange = (e) => {
    let val = e.target.value;

    if (val === "-") {
      onChange(val);
      return;
    } // Ļauj tikai "-" ievadi

    if (val.startsWith(".")) val = "0" + val; // Pievieno nulli pirms punkta

    // Ļauj tikai ciparus, "-" un "."
    const validPattern = /^-?\d*\.?\d*$/;
    if (!validPattern.test(val)) return;

    // Pārbauda decimāldaļas
    if (val.includes(".")) {
      const [intPart, decPart] = val.split(".");
      if (intPart.replace("-", "").length > 17) return; // Max 17 cipari pirms decimāldaļas
      if (decPart.length > 2) return; // Max 2 decimāldaļas
    } else {
      if (val.replace("-", "").length > 17) return; // Max 17 cipari, ja nav decimāldaļas
    }

    onChange(val);
  };

  // Apstrādā, kad lauks zaudē fokusu
  const handleBlur = () => {
    if (!value || value === "-") {
      onChange("");
      return;
    }

    // Saglabā kā string ar divām decimāldaļām
    const [intPart, decPart = ""] = value.split(".");
    let formattedDec = decPart.padEnd(2, "0").slice(0, 2);
    onChange(`${intPart}.${formattedDec}`);
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
