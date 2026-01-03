describe("Edit account", () => {
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
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/accounts/*", {
      forceNetworkError: true,
    }).as("editAccountRequest");

    cy.get('input[name="code"]').clear().type("5001");
    cy.get('input[name="name"]').clear().type("Rediģētais konts");
    cy.get('button[type="submit"]').click();

    cy.wait("@editAccountRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR19 - Kods jau eksistē", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.get('input[name="code"]').clear().type("13");
    cy.get('input[name="name"]').clear().type("Rediģētais konts");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Kods jau eksistē");
  });

  it("ERR20 - Kodam jābūt 1-21 ciparu garam", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.get('input[name="code"]').clear().type("1234567891234567891234");
    cy.get('input[name="name"]').clear().type("Rediģētais konts");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Kodam jābūt 1-21 ciparu garam");
  });

  it("ERR21 - Koda nosaukumam jābūt 1-255 simbolu garam", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.get('input[name="code"]').clear().type("56");
    cy.get('input[name="name"]').clear();
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Koda nosaukumam jābūt 1-255 simbolu garam");
  });

  it("Veiksmīga uzņēmuma rediģēšana", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/accounts/*").as("editAccountRequest");

    cy.get('input[name="code"]').clear().type("120");
    cy.get('input[name="name"]').clear().type("Rediģētais konts");
    cy.get('button[type="submit"]').click();

    cy.wait("@editAccountRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/accounts");
  });
});
