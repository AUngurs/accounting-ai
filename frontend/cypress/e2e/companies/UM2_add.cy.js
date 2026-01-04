describe("Add company", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Valid Company");

    cy.get("button.logout-button").click();

    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.contains("button", "Pievienot uzņēmumu").click();
  });

  it("[UM2_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies", {
      forceNetworkError: true,
    }).as("addCompanyRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Server Error Company");
      cy.get("button").contains("Pievienot").click();
    });

    cy.wait("@addCompanyRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[UM2_T2] ERR9 - Uzņēmuma nosaukumam jābūt 3-30 simbolu garam", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("co");
      cy.get("button").contains("Pievienot").click();
      cy.get(".invalid-feedback").should("contain", "Uzņēmuma nosaukumam jābūt 3-30 simbolu garam");
    });
  });

  it("[UM2_T3] ERR10 - Uzņēmums ar šādu nosaukumu jau eksistē", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Valid Company");
      cy.get("button").contains("Pievienot").click();
      cy.get(".invalid-feedback").should("contain", "Uzņēmums ar šādu nosaukumu jau eksistē");
    });
  });

  it("[UM2_T4] Veiksmīga uzņēmuma pievienošana", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies").as("addCompanyRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Edited Company");
      cy.get("button").contains("Pievienot").click();
    });

    cy.wait("@addCompanyRequest").its("response.statusCode").should("eq", 201);
    cy.get(".modal-backdrop").should("not.exist");
    cy.url().should("include", "/companies");
  });
});
