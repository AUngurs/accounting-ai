import { Form } from "react-bootstrap";

export default function AmountInput({ value, onChange, isInvalid, size, ref, ...rest }) {
  const handleKeyDown = (e) => {
    if (e.key === "-") {
      e.preventDefault();
      if (!value) { onChange("-"); return; }
      if (value === "-") return;
      if (!value.includes(".")) onChange("-" + value.replace("-", ""));
    }
  };

  const handleChange = (e) => {
    let val = e.target.value.replace(/,/g, ".");
    if (val === "-") { onChange(val); return; }
    if (val.startsWith(".")) val = "0" + val;
    const validPattern = /^-?\d*\.?\d*$/;
    if (!validPattern.test(val)) return;
    if (val.includes(".")) {
      const [intPart, decPart] = val.split(".");
      if (intPart.replace("-", "").length > 17) return;
      if (decPart.length > 2) return;
    } else {
      if (val.replace("-", "").length > 17) return;
    }
    onChange(val);
  };

  const handleBlur = () => {
    if (!value || value === "-") { onChange(""); return; }
    const [intPart, decPart = ""] = value.split(".");
    onChange(`${intPart}.${decPart.padEnd(2, "0").slice(0, 2)}`);
  };

  return (
    <Form.Control
      ref={ref}
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
