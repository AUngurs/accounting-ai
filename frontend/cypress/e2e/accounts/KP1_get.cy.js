describe("Get account list", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Account Company");

    cy.get("span").click();

    cy.visit("/partners");

    cy.createPartner({ title: "SIA", name: "Test Company", regNr: "20001000", enableVatEdit: true, vatNr: "20001000" });
    cy.createPartner({ title: "AS", name: "Second Company", regNr: "90009999", enableVatEdit: true, vatNr: "90009999" });
    cy.createPartner({ title: "ZS", name: "Error Company", regNr: "12345678", enableVatEdit: true, vatNr: "12345678" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
    cy.get("span").click();
  });

  it("[KP1_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/accounts", {
      forceNetworkError: true,
    }).as("getAccountsRequest");

    cy.visit("/accounts");

    cy.wait("@getAccountsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[KP1_T2] Veiksmīga kontu plāna datu iegūšana", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/accounts").as("getAccountsRequest");

    cy.visit("/accounts");

    cy.wait("@getAccountsRequest")
      .its("response.statusCode")
      .should((status) => {
        expect([200, 304]).to.include(status);
      });
  });
});
