import React, { useRef, useState } from "react";
import { Button, InputGroup, Form, Dropdown } from "react-bootstrap";
import { FaPlus, FaUpload, FaDownload, FaTrash } from "react-icons/fa";

export default function PartnersControls({ handleCreateClick, handleImport, handleExport, handleDeleteSelected, selectedPartners }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  // Kad fails izvēlēts
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  // Faila importēšana
  const handleImportClick = async () => {
    if (!file) return;
    await handleImport(file); // izsauc usePartners hook funkciju
    setFile(null); // notīra input
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleTypeSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".xml"; // Pieļauj tikai XML importu
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
      {/* Jauna partnera pievienošana */}
      <Button className="btn-app" onClick={handleCreateClick}>
        <FaPlus className="me-1" /> Jauns
      </Button>

      {/* Slēptais faila input */}
      <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

      {/* Importa grupa */}
      <InputGroup className="w-auto">
        {!file && (
          <Dropdown>
            <Dropdown.Toggle className="btn-app">
              <FaDownload className="me-1" /> Importēt
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={handleTypeSelect}>XML</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {file && (
          <React.Fragment>
            <Button className="btn-app-danger" onClick={handleCancel}>
              Atcelt
            </Button>
            <Form.Control name="imported-file" value={file.name} readOnly className="bg-light" />
            <Button className="btn-app" onClick={handleImportClick}>
              Importēt
            </Button>
          </React.Fragment>
        )}
      </InputGroup>

      {/* Eksports un dzēšana tikai, ja ir atlasīti partneri */}
      {selectedPartners.size > 0 && (
        <div className="ms-auto">
          <Button className="btn-app me-2" onClick={handleExport}>
            <FaUpload className="me-1" /> Eksportēt
          </Button>
          <Button className="btn-app-danger" onClick={handleDeleteSelected}>
            <FaTrash className="me-1" /> Dzēst
          </Button>
        </div>
      )}
    </div>
  );
}
