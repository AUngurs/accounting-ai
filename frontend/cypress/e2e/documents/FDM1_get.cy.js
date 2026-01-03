describe("Get document list", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Document Company");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
    cy.get("span").click();
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/documents", {
      forceNetworkError: true,
    }).as("getDocumentsRequest");

    cy.visit("/documents");

    cy.wait("@getDocumentsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Veiksmīga finanšu dokumentu datu iegūšana", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/partners").as("getDocumentsRequest");

    cy.visit("/documents");

    cy.wait("@getDocumentsRequest")
      .its("response.statusCode")
      .should((status) => {
        expect([200, 304]).to.include(status);
      });
  });
});
