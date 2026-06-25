import React, { useRef, useState } from "react";
import { InputGroup, Form, Dropdown } from "react-bootstrap";
import { FaPlus, FaUpload, FaDownload, FaTrash } from "react-icons/fa";

export default function PartnersControls({ handleCreateClick, handleImport, handleExport, handleDeleteSelected, selectedPartners }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleImportClick = async () => {
    if (!file) return;
    await handleImport(file);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleTypeSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".xml";
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
      <button type="button" className="btn-app" onClick={handleCreateClick}>
        <FaPlus className="me-1" /> Jauns
      </button>

      <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

      <InputGroup className="w-auto">
        {!file && (
          <Dropdown>
            <Dropdown.Toggle as="button" className="btn-app">
              <FaDownload className="me-1" /> Importēt
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleTypeSelect}>XML</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {file && (
          <React.Fragment>
            <button type="button" className="btn-app-danger" onClick={handleCancel}>
              Atcelt
            </button>
            <Form.Control name="imported-file" value={file.name} readOnly className="bg-light" />
            <button type="button" className="btn-app" onClick={handleImportClick}>
              Importēt
            </button>
          </React.Fragment>
        )}
      </InputGroup>

      {selectedPartners.size > 0 && (
        <div className="ms-auto">
          <button type="button" className="btn-app me-2" onClick={handleExport}>
            <FaUpload className="me-1" /> Eksportēt
          </button>
          <button type="button" className="btn-app-danger" onClick={handleDeleteSelected}>
            <FaTrash className="me-1" /> Dzēst
          </button>
        </div>
      )}
    </div>
  );
}
