describe("Delete account", () => {
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

  it("[KP3_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/accounts/*", {
      forceNetworkError: true,
    }).as("deleteAccountRequest");

    cy.get(".modal").within(() => {
      cy.get("button").contains("Dzēst").click();
    });

    cy.on("window:confirm", () => true);

    cy.wait("@deleteAccountRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[KP3_T2] Veiksmīga konta dzēšana", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/accounts/*").as("deleteAccountRequest");

    cy.get(".modal").within(() => {
      cy.get("button").contains("Dzēst").click();
    });

    cy.on("window:confirm", () => true);

    cy.wait("@deleteAccountRequest").its("response.statusCode").should("eq", 200);
    cy.get(".modal-backdrop").should("not.exist");
    cy.url().should("include", "/accounts");
  });
});
