describe("Get partner list", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Partner Company");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
    cy.get("span").click();
  });

  it("[PM1_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/partners", {
      forceNetworkError: true,
    }).as("getPartnersRequest");

    cy.visit("/partners");

    cy.wait("@getPartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[PM1_T2] Veiksmīga partneru datu iegūšana", () => {
    cy.intercept("GET", "http://localhost:5001/api/companies/*/partners").as("getPartnersRequest");

    cy.visit("/partners");

    cy.wait("@getPartnersRequest")
      .its("response.statusCode")
      .should((status) => {
        expect([200, 304]).to.include(status);
      });
  });
});
