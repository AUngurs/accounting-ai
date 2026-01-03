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

    cy.get("button").contains("Importēt").click();
    cy.get("a").contains("Excel").click();
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/accounts_import.xlsx", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/import", { forceNetworkError: true }).as("importAccountsRequest");

    cy.get("button").contains("Importēt").click();

    cy.on("window:confirm", () => true);

    cy.wait("@importAccountsRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR6 - Neparedzēta servera kļūda [Nepareiza formatējuma XLSX fails]", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/incorrect_accounts_import.xlsx", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/import").as("importAccountsRequest");

    cy.get("button").contains("Importēt").click();

    cy.on("window:confirm", () => true);

    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Veiksmīga kontu importēšana", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/accounts_import.xlsx", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/import").as("importAccountsRequest");

    cy.get("button").contains("Importēt").click();

    cy.on("window:confirm", () => true);

    cy.wait("@importAccountsRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/accounts");
  });
});
