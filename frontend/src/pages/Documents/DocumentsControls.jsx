import React, { useRef, useState } from "react";
import { Button, Dropdown, InputGroup, Form } from "react-bootstrap";
import { FaPlus, FaUpload, FaDownload, FaTrash } from "react-icons/fa";

// Komponente, kas nodrošina kontroles pogas dokumentu sarakstam: jauns, importēt, eksportēt, dzēst
export default function DocumentsControls({
  handleCreateClick,
  handleXmlImport,
  handlePdfImport,
  handleExport,
  handleDeleteSelected,
  selectedDocs,
}) {
  const fileInputRef = useRef(null); // Slēpta file input kontrole, ko izmanto importam
  const [fileType, setFileType] = useState(null); // Izvēlētā faila tips (pdf/xml)
  const [file, setFile] = useState(null); // Izvēlētais fails

  // Apstrādā faila izvēli no file input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile); // Saglabā izvēlēto failu stāvoklī
  };

  // Apstrādā import pogas klikšķi
  const handleImportClick = async () => {
    if (!file) return;

    // Atkarībā no izvēlētā tipa izsauc atbilstošo import funkciju
    if (fileType === "xml") {
      await handleXmlImport(file);
    } else if (fileType === "pdf") {
      await handlePdfImport(file);
    }

    // Atiestata faila stāvokli, lai sagatavotos nākamajam importam
    setFile(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = null; // Reset file input HTML elementu
  };

  // Apstrādā faila tipa izvēli no dropdown
  const handleTypeSelect = (type) => {
    setFileType(type);
    if (fileInputRef.current) {
      // Maina pieņemto faila tipu, pirms atver faila izvēles dialogu
      fileInputRef.current.accept = type === "pdf" ? ".pdf" : ".xml";
      fileInputRef.current.click(); // Automātiski atver faila izvēles logu
    }
  };

  // Atcelt importu un atiestatīt visus stāvokļus
  const handleCancel = () => {
    setFile(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = null; // Reset HTML input
  };

  return (
    <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
      {/* Poga jauna dokumenta pievienošanai */}
      <Button className="custom-dark-hover" onClick={handleCreateClick}>
        <FaPlus className="me-1" /> Jauns
      </Button>

      {/* Slēpts file input, ko kontrolē ar ref */}
      <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

      <InputGroup className="w-auto">
        {/* Ja fails vēl nav izvēlēts, rāda dropdown importam */}
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

        {/* Ja fails ir izvēlēts, rāda faila nosaukumu, Atcelt un Importēt pogas */}
        {file && (
          <React.Fragment>
            <Button className="custom-red-hover" onClick={handleCancel}>
              Atcelt
            </Button>
            <Form.Control name="imported-file" value={file.name} readOnly className="bg-light" /> {/* Rāda izvēlēto failu */}
            <Button className="custom-dark-hover" onClick={handleImportClick}>
              Importēt
            </Button>
          </React.Fragment>
        )}
      </InputGroup>

      {/* Ja ir izvēlēti dokumenti, rāda eksportēt un dzēst pogas */}
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
