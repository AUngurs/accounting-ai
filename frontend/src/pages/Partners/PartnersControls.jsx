import React, { useRef, useState } from "react";
import { Button, InputGroup, Form, Dropdown } from "react-bootstrap";
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
      <Button className="custom-dark-hover" onClick={handleCreateClick}>
        <FaPlus className="me-1" /> Jauns
      </Button>

      <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

      <InputGroup className="w-auto">
        {!file && (
          <Dropdown>
            <Dropdown.Toggle className="custom-dark-hover">
              <FaDownload className="me-1" /> Importēt
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={handleTypeSelect}>XML</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}

        {file && (
          <React.Fragment>
            <Button className="custom-red-hover" onClick={handleCancel}>
              Atcelt
            </Button>
            <Form.Control value={file.name} readOnly className="bg-light" />
            <Button className="custom-dark-hover" onClick={handleImportClick}>
              Importēt
            </Button>
          </React.Fragment>
        )}
      </InputGroup>

      {selectedPartners.size > 0 && (
        <div className="ms-auto">
          <Button className="custom-dark-hover me-2" onClick={handleExport}>
            <FaUpload className="me-1" /> Eksportēt
          </Button>
          <Button className="custom-red-hover" onClick={handleDeleteSelected}>
            <FaTrash className="me-1" /> Dzēst
          </Button>
        </div>
      )}
    </div>
  );
}
