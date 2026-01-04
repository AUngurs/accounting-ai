describe("Import documents", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Document Company");

    cy.get("span").click();

    cy.visit("/partners");

    cy.createPartner({ title: "SIA", name: "Test Company", regNr: "30004000", enableVatEdit: true, vatNr: "30004000" });

    cy.visit("/documents");

    cy.createDocument({ id: "001", date: "2025-12-15", amount: "605", comments: "Existing document" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");

    cy.get("button").contains("Importēt").click();
    cy.get("a").contains("XML").click();
  });

  it("[FDM4_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/document_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/importxml", { forceNetworkError: true }).as(
      "importDocumentsRequest"
    );

    cy.get("button").contains("Importēt").click();

    cy.wait("@importDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM4_T2] ERR6 - Neparedzēta servera kļūda [Nepareiza formatējuma XML fails]", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/incorrect_document_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/importxml").as("importDocumentsRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM4_T3] Veiksmīga finanšu dokumentu importēšana", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/document_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/importxml").as("importDocumentsRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importDocumentsRequest").its("response.statusCode").should("eq", 201);
  });
});
