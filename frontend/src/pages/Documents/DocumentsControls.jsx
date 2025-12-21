import React, { useRef, useState } from "react";
import { Button, Dropdown, InputGroup, Form } from "react-bootstrap";
import { FaPlus, FaUpload, FaDownload, FaTrash } from "react-icons/fa";

export default function DocumentsControls({
  handleCreateClick,
  handleXmlImport,
  handlePdfImport,
  handleExport,
  handleDeleteSelected,
  selectedDocs,
}) {
  const fileInputRef = useRef(null);
  const [fileType, setFileType] = useState(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleImportClick = async () => {
    if (!file) return;

    if (fileType === "xml") {
      await handleXmlImport(file);
    } else if (fileType === "pdf") {
      await handlePdfImport(file);
    }

    setFile(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleTypeSelect = (type) => {
    setFileType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "pdf" ? ".pdf" : ".xml";
      fileInputRef.current.click();
    }
  };

  const handleCancel = () => {
    setFile(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
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
              <Dropdown.Item onClick={() => handleTypeSelect("pdf")}>PDF</Dropdown.Item>
              <Dropdown.Item onClick={() => handleTypeSelect("xml")}>XML</Dropdown.Item>
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

      {selectedDocs.size > 0 && (
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
