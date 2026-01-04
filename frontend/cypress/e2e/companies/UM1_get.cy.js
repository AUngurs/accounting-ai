describe("Get company list", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
  });

  it("[UM1_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies", {
      forceNetworkError: true,
    }).as("getCompaniesRequest");

    cy.visit("/companies");

    cy.wait("@getCompaniesRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[UM1_T2] Veiksmīga uzņēmumu datu iegūšana", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies").as("getCompaniesRequest");

    cy.visit("/companies");

    cy.wait("@getCompaniesRequest")
      .its("response.statusCode")
      .should((status) => {
        expect([200, 304]).to.include(status);
      });
  });
});
