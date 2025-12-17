import React from "react";
import { Form } from "react-bootstrap";

export default function AmountInput({ value, onChange, isInvalid, size, ...rest }) {
  const handleKeyDown = (e) => {
    if (e.key === "-") {
      e.preventDefault();
      if (!value) {
        onChange("-");
        return;
      }
      if (value === "-") return;
      const num = parseFloat(value);
      if (!isNaN(num)) {
        onChange((-num).toString());
      }
    }
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (val === "-") {
      onChange(val);
      return;
    }
    if (val.startsWith(".")) val = "0" + val;
    const validPattern = /^-?\d*\.?\d*$/;
    if (!validPattern.test(val)) return;
    if (val.includes(".")) {
      const [, decimals] = val.split(".");
      if (decimals.length > 2) return;
    }
    onChange(val);
  };

  const handleBlur = () => {
    if (!value || value === "-") {
      onChange("");
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      onChange("");
      return;
    }
    onChange(num.toFixed(2));
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
