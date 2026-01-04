describe("Delete document", () => {
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

    cy.createDocument({ id: "001", date: "2025-12-15", amount: "100", comments: "First document" });
    cy.createDocument({ id: "002", date: "2025-12-15", amount: "200", comments: "Second document" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");

    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();
  });

  it("[FDM7_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/export", { forceNetworkError: true }).as(
      "exportDocumentsRequest"
    );

    cy.get("button").contains("Eksportēt").click();

    cy.wait("@exportDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM7_T2] Veiksmīga finanšu dokumentu eksportēšana", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/export").as("exportDocumentsRequest");

    cy.get("button").contains("Eksportēt").click();

    cy.wait("@exportDocumentsRequest").its("response.statusCode").should("eq", 200);
  });
});
