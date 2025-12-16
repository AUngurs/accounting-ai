import React, { useState } from "react";
import { useCompany } from "../../components/CompanyContext";
import DocumentsControls from "./DocumentsControls";
import DocumentsTableHeader from "./DocumentsTableHeader";
import DocumentsTableBody from "./DocumentsTableBody";
import VirtualizedTableContainer from "../../components/VirtualizedTableContainer";
import { useDocuments } from "./useDocuments";
import DocumentModal from "../../components/DocumentModal";
import { Table } from "react-bootstrap";

export default function Documents() {
  const { companyId } = useCompany();
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRowsCount, setVisibleRowsCount] = useState(20);
  const [openDocId, setOpenDocId] = useState(null);

  const ROW_HEIGHT = 24;

  const {
    pdfFile,
    setPdfFile,
    selectedDocument,
    setSelectedDocument,
    showModal,
    setShowModal,
    handlePdfImport,
    docCurrencyOptions,
    docsData,
    docTypeOptions,
    partnersData,
    selectedDocs,
    setSelectedDocs,
    filteredDocs,
    filters,
    setFilters,
    sortConfig,
    sortedDocs,
    handleSort,
    partnerMap,
    handleCreate,
    handleSave,
    handleDelete,
    handleExport,
    handleXmlImport,
    handleDeleteSelected,
    handleUpdateAccounted,
  } = useDocuments(companyId);

  const handleCreateClick = () => {
    setSelectedDocument(null);
    setShowModal(true);
  };

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedDocument(null);
    setPdfFile(null);
    setShowModal(false);
  };

  return (
    <div>
      <h2 className="mb-3">Finanšu dokumenti</h2>

      <DocumentsControls
        handleCreateClick={handleCreateClick}
        handleXmlImport={handleXmlImport}
        handlePdfImport={handlePdfImport}
        handleExport={handleExport}
        handleDeleteSelected={handleDeleteSelected}
        selectedDocs={selectedDocs}
      />

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
        <DocumentsTableHeader
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          handleSort={handleSort}
          partnersData={partnersData}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          filteredDocs={filteredDocs}
          docTypeOptions={docTypeOptions}
          docCurrencyOptions={docCurrencyOptions}
        />
      </Table>

      <VirtualizedTableContainer
        rowHeight={ROW_HEIGHT}
        offsetPx={280}
        onScrollChange={setScrollTop}
        onVisibleRowsChange={setVisibleRowsCount}
      >
        <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
          <DocumentsTableBody
            docsData={docsData}
            partnerMap={partnerMap}
            openDocId={openDocId}
            setOpenDocId={setOpenDocId}
            selectedDocs={selectedDocs}
            setSelectedDocs={setSelectedDocs}
            scrollTop={scrollTop}
            companyId={companyId}
            handleEditClick={handleEditClick}
            sortedDocs={sortedDocs}
            handleUpdateAccounted={handleUpdateAccounted}
            visibleRowsCount={visibleRowsCount}
          />
        </Table>
      </VirtualizedTableContainer>

      <DocumentModal
        show={showModal}
        handleClose={closeModal}
        pdfFile={pdfFile}
        documentData={selectedDocument}
        onSave={selectedDocument?.isNewImport ? handleCreate : handleSave}
        onDelete={handleDelete}
        partners={partnersData}
        documents={docsData}
      />
    </div>
  );
}
