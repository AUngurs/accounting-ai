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
    cy.createDocument({ id: "003", date: "2025-12-15", amount: "300", comments: "Third document" });
    cy.createDocument({ id: "004", date: "2025-12-15", amount: "400", comments: "Fourth document" });
    cy.createDocument({ id: "005", date: "2025-12-15", amount: "500", comments: "Fifth document" });
    cy.createDocument({ id: "006", date: "2025-12-15", amount: "600", comments: "Sixth document" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");
  });

  it("[FDM6_T1] ERR6 - Neparedzēta servera kļūda [SK-DOC-EDIT]", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/documents/*", {
      forceNetworkError: true,
    }).as("deleteDocumentRequest");

    cy.get(".modal").within(() => {
      cy.get("button").contains("Dzēst").click();
    });

    cy.on("window:confirm", () => true);

    cy.wait("@deleteDocumentRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM6_T2] ERR6 - Neparedzēta servera kļūda [SK-DOC]", () => {
    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();

    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/bulk-delete", {
      forceNetworkError: true,
    }).as("deleteDocumentsRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM6_T3] Veiksmīga finanšu dokumenta dzēšana [SK-DOC-EDIT]", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/documents/*").as("deleteDocumentRequest");

    cy.get(".modal").within(() => {
      cy.get("button").contains("Dzēst").click();
    });

    cy.on("window:confirm", () => true);

    cy.wait("@deleteDocumentRequest");
    cy.get(".modal-backdrop").should("not.exist");
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Finanšu dokuments veiksmīgi dzēsts!");
    cy.url().should("include", "/documents");
  });

  it("[FDM6_T4] Veiksmīga finanšu dokumentu dzēšana [SK-DOC]", () => {
    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();

    cy.intercept("POST", "http://localhost:5001/api/companies/*/documents/bulk-delete").as("deleteDocumentsRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Veiksmīgi dzēsti 2 finanšu dokumenti!");
    cy.url().should("include", "/documents");
  });
});
