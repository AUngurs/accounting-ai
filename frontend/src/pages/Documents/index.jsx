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
  const { companyId } = useCompany(); // Iegūst pašreizējo kompānijas ID
  const [scrollTop, setScrollTop] = useState(0); // Scroll pozīcija virtuālajā tabulā
  const [visibleRowsCount, setVisibleRowsCount] = useState(20); // Redzamo rindu skaits
  const [openDocId, setOpenDocId] = useState(null); // Kurš dokuments ir "atvērts" (Collapse rindiņa)

  const ROW_HEIGHT = 24; // Katras rindas augstums pikseļos

  // Izsauc custom hook, kas satur visu dokumentu loģiku
  const {
    accounts, // Kontu plāns
    pdfFile, // PDF fails, ko rāda modal
    setPdfFile, // Funkcija PDF faila iestatīšanai
    selectedDocument, // Pašreiz izvēlētais dokuments modal logam
    setSelectedDocument,
    showModal, // Vai modal logs ir atvērts
    setShowModal,
    handlePdfImport, // Funkcija PDF importam
    docCurrencyOptions, // Valūtu opcijas
    docsData, // Visi dokumenti
    docTypeOptions, // Dokumentu tipu opcijas
    partnersData, // Partneru dati
    selectedDocs, // Set ar izvēlētajiem dokumentiem
    setSelectedDocs,
    filteredDocs, // Dokumenti pēc filtru piemērošanas
    filters, // Filtri
    setFilters,
    sortConfig, // Kārtošanas konfigurācija
    sortedDocs, // Sakārtoti dokumenti
    handleSort, // Funkcija kārtošanai
    partnerMap, // Partneru ID -> nosaukums
    handleCreate, // Funkcija jaunam dokumentam
    handleSave, // Funkcija dokumenta saglabāšanai
    handleDelete, // Funkcija dokumenta dzēšanai
    handleExport, // Funkcija eksportam
    handleXmlImport, // Funkcija XML importam
    handleDeleteSelected, // Funkcija atlasīto dokumentu dzēšanai
    handleUpdateAccounted, // Funkcija statusa "is_accounted" atjaunošanai
  } = useDocuments(companyId);

  // Atver modal jauna dokumenta pievienošanai
  const handleCreateClick = () => {
    setSelectedDocument(null);
    setShowModal(true);
  };

  // Atver modal dokumenta rediģēšanai
  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  // Aizver modal logu un notīra izvēlēto dokumentu un PDF failu
  const closeModal = () => {
    setSelectedDocument(null);
    setPdfFile(null);
    setShowModal(false);
  };

  return (
    <div>
      <h2 className="mb-3">Finanšu dokumenti</h2>

      {/* Kontroles panelis: jauns, importēt, eksportēt, dzēst */}
      <DocumentsControls
        handleCreateClick={handleCreateClick}
        handleXmlImport={handleXmlImport}
        handlePdfImport={handlePdfImport}
        handleExport={handleExport}
        handleDeleteSelected={handleDeleteSelected}
        selectedDocs={selectedDocs}
      />

      {/* Tabulas galvene ar kārtošanu un filtriem */}
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

      {/* Virtuālā tabula, lai optimizētu lielu rindu skaitu */}
      <VirtualizedTableContainer
        rowHeight={ROW_HEIGHT}
        offsetPx={290} // augšējais offset (scroll pozīcijas korekcija)
        onScrollChange={setScrollTop} // callback scroll pozīcijai
        onVisibleRowsChange={setVisibleRowsCount} // callback redzamo rindu skaitam
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
            accounts={accounts}
          />
        </Table>
      </VirtualizedTableContainer>

      <div className="virtualized-table-divider" />

      {/* Informācija par atlasīto dokumentu skaitu */}
      <div className="mt-2 text-muted small">
        Atlasīti {selectedDocs.size} no {sortedDocs.length} finanšu dokumentiem
      </div>

      {/* Modal logs dokumenta pievienošanai vai rediģēšanai */}
      <DocumentModal
        show={showModal}
        handleClose={closeModal}
        pdfFile={pdfFile}
        documentData={selectedDocument}
        onSave={!selectedDocument || selectedDocument?.isNewImport ? handleCreate : handleSave} // Ja importēts jauns dokuments -> create, savādāk save
        onDelete={handleDelete}
        partners={partnersData}
        documents={docsData}
      />
    </div>
  );
}
