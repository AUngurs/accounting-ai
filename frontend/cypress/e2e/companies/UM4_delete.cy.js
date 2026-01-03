describe("Delete company", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Delete Company 1");
    cy.createCompany("Delete Company 2");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.contains("li", "Delete Company 1").find("button").click();

    cy.intercept("DELETE", "http://localhost:5001/api/companies/*", {
      forceNetworkError: true,
    }).as("deleteCompanyRequest");

    cy.contains("button", "Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteCompanyRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Uzņēmums veiksmīgi dzēsts", () => {
    cy.contains("li", "Delete Company 2").find("button").click();

    cy.intercept("DELETE", "http://localhost:5001/api/companies/*").as("deleteCompanyRequest");

    cy.contains("button", "Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteCompanyRequest").its("response.statusCode").should("eq", 200);
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Uzņēmums veiksmīgi dzēsts!");
    cy.url().should("include", "/companies");
  });
});
