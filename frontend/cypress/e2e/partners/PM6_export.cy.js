describe("Export partners", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Partner Company");

    cy.get("span").click();

    cy.visit("/partners");

    cy.createPartner({ title: "SIA", name: "First Company", regNr: "20001000", enableVatEdit: true, vatNr: "20001000" });
    cy.createPartner({ title: "AS", name: "Second Company", regNr: "90009999", enableVatEdit: true, vatNr: "90009999" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/partners");

    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();
  });

  it("[PM6_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/export", { forceNetworkError: true }).as("exportPartnersRequest");

    cy.get("button").contains("Eksportēt").click();

    cy.wait("@exportPartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[PM6_T2] Veiksmīga partneru eksportēšana", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/export").as("exportPartnersRequest");

    cy.get("button").contains("Eksportēt").click();

    cy.wait("@exportPartnersRequest").its("response.statusCode").should("eq", 200);
  });
});
