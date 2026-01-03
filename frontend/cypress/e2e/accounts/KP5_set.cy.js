describe("Import accounts", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Account Company");

    cy.get("span").click();

    cy.visit("/accounts");

    cy.setAccounts();

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/accounts");
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/set", { forceNetworkError: true }).as("setAccountsRequest");

    cy.get("button").contains("Iestatīt noklusējuma kontus").click();

    cy.on("window:confirm", () => true);

    cy.wait("@setAccountsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Veiksmīga noklusējuma kontu iestatīšana", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/set").as("setAccountsRequest");

    cy.get("button").contains("Iestatīt noklusējuma kontus").click();

    cy.on("window:confirm", () => true);

    cy.wait("@setAccountsRequest").its("response.statusCode").should("eq", 200);
  });
});
