import { useState } from "react";
import { useCompany } from "../../components/CompanyContext";
import DocumentsControls from "./DocumentsControls";
import DocumentsTableHeader from "./DocumentsTableHeader";
import DocumentsTableBody from "./DocumentsTableBody";
import VirtualizedTableContainer from "../../components/VirtualizedTableContainer";
import { useDocuments } from "./useDocuments";
import DocumentModal from "./DocumentModal";
import { Table } from "react-bootstrap";

export default function Documents() {
  const { companyId } = useCompany();
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRowsCount, setVisibleRowsCount] = useState(20);

  const ROW_HEIGHT = 24;

  const {
    accounts,
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
      <h1 className="page-title">Finanšu dokumenti</h1>

      <DocumentsControls
        handleCreateClick={handleCreateClick}
        handleXmlImport={handleXmlImport}
        handlePdfImport={handlePdfImport}
        handleExport={handleExport}
        handleDeleteSelected={handleDeleteSelected}
        selectedDocs={selectedDocs}
      />

      <div className="table-card">
        <VirtualizedTableContainer
          rowHeight={ROW_HEIGHT}
          offsetPx={175}
          onScrollChange={setScrollTop}
          onVisibleRowsChange={setVisibleRowsCount}
        >
          <Table hover size="sm" className="app-table" style={{ tableLayout: "fixed", marginBottom: 0 }}>
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
            <DocumentsTableBody
              partnerMap={partnerMap}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              scrollTop={scrollTop}
              handleEditClick={handleEditClick}
              sortedDocs={sortedDocs}
              visibleRowsCount={visibleRowsCount}
            />
          </Table>
        </VirtualizedTableContainer>
      </div>

      <div className="selection-count">
        Atlasīti {selectedDocs.size} no {sortedDocs.length} finanšu dokumentiem
      </div>

      <DocumentModal
        show={showModal}
        handleClose={closeModal}
        pdfFile={pdfFile}
        documentData={selectedDocument}
        onSave={!selectedDocument || selectedDocument?.isNewImport ? handleCreate : handleSave}
        onDelete={handleDelete}
        partners={partnersData}
        documents={docsData}
        companyId={companyId}
        accounts={accounts}
        onUpdateAccounted={handleUpdateAccounted}
      />
    </div>
  );
}
