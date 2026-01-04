describe("Import documents", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("SIA Pirmais uzņēmums");

    cy.get("span").click();

    cy.visit("/partners");

    cy.createPartner({ title: "AS", name: "Otrais uzņēmums", regNr: "40003000001" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");

    cy.get("button").contains("Importēt").click();
    cy.get("a").contains("PDF").click();
  });

  it("[FDM8_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/document_import.pdf", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/ai/import-pdf", { forceNetworkError: true }).as("importPDFRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPDFRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM8_T2] ERR6 - Neparedzēta servera kļūda [Nepareiza formatējuma PDF fails]", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/incorrect_document_import.pdf", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/ai/import-pdf").as("importPDFRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPDFRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM8_T3] Veiksmīga PDF faila importēšana", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/document_import.pdf", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/ai/import-pdf").as("importPDFRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPDFRequest").its("response.statusCode").should("eq", 200);
  });
});
