describe("Edit company", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Valid Company 1");
    cy.createCompany("Valid Company 2");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
  });

  it("[UM3_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.contains("li", "Valid Company 1").find("button").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*", {
      forceNetworkError: true,
    }).as("editCompanyRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Server Error Company");
      cy.get("button").contains("Saglabāt").click();
    });

    cy.wait("@editCompanyRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[UM3_T2] ERR9 - Uzņēmuma nosaukumam jābūt 3-30 simbolu garam", () => {
    cy.contains("li", "Valid Company 2").find("button").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("co");
      cy.get("button").contains("Saglabāt").click();
      cy.get(".invalid-feedback").should("contain", "Uzņēmuma nosaukumam jābūt 3-30 simbolu garam");
    });
  });

  it("[UM3_T3] ERR10 - Uzņēmums ar šādu nosaukumu jau eksistē", () => {
    cy.contains("li", "Valid Company 2").find("button").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Valid Company 2");
      cy.get("button").contains("Saglabāt").click();
      cy.get(".invalid-feedback").should("contain", "Uzņēmums ar šādu nosaukumu jau eksistē");
    });
  });

  it("[UM3_T4] Veiksmīga uzņēmuma rediģēšana", () => {
    cy.contains("li", "Valid Company 2").find("button").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*").as("editCompanyRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="name"]').clear().type("Edited Company");
      cy.get("button").contains("Saglabāt").click();
    });

    cy.get(".modal-backdrop").should("not.exist");
    cy.wait("@editCompanyRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/companies");
  });
});
