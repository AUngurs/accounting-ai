import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function DocumentLines({ companyId, documentId }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    axiosInstance
      .get(`/companies/${companyId}/documents/${documentId}/lines`)
      .then((res) => setLines(res.data))
      .catch((err) => {
        console.error(err);
        setError("Neizdevās ielādēt kontējumu rindiņas.");
      })
      .finally(() => setLoading(false));
  }, [companyId, documentId]);

  if (loading) return <div>Notiek ielāde...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (lines.length === 0) return <div>Nav kontējumu rindiņu.</div>;

  return (
    <table className="table table-sm table-bordered mt-2">
      <thead className="table-light">
        <tr>
          <th>#</th>
          <th></th>
          <th>Valūta</th>
          <th>Summa</th>
          <th>Debets</th>
          <th>Kredīts</th>
          <th>PVN</th>
          <th>Kontējuma piezīmes</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => (
          <tr key={line.id}>
            <td>{idx + 1}</td>
            <td>{line.line_supplementary_notice}</td>
            <td>{line.line_currency}</td>
            <td>{line.line_amount}</td>
            <td>{line.line_debet_account}</td>
            <td>{line.line_credit_account}</td>
            <td>{line.line_vat_rate}</td>
            <td>{line.line_comments}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
