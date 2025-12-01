import React, { useRef, useState } from "react";
import { Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";
import { FaPlus, FaUpload, FaDownload, FaTrash } from "react-icons/fa";

export default function DocumentsControls({ handleCreateClick, handleImport, handleExport, handleDeleteSelected, selectedDocs }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleImportClick = async () => {
    if (!file) return;
    await handleImport(file);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
      <Button className="custom-dark-hover" onClick={handleCreateClick}>
        <FaPlus className="me-1" /> Jauns
      </Button>

      <InputGroup className="w-auto">
        <Form.Control type="file" accept=".xml" ref={fileInputRef} onChange={handleFileChange} />
        <Button className="custom-dark-hover" onClick={handleImportClick} disabled={!file}>
          <FaUpload className="me-1" /> Importēt
        </Button>
      </InputGroup>

      {selectedDocs.size > 0 && (
        <ButtonGroup>
          <Button className="custom-light-hover" onClick={handleExport}>
            <FaDownload className="me-1" /> Eksportēt
          </Button>
          <Button className="custom-light-red-hover" onClick={handleDeleteSelected}>
            <FaTrash className="me-1" /> Dzēst ({selectedDocs.size})
          </Button>
        </ButtonGroup>
      )}
    </div>
  );
}
