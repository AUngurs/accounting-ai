describe("Import partners", () => {
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

    cy.createPartner({ title: "SIA", name: "Test Company", regNr: "30004000", enableVatEdit: true, vatNr: "30004000" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/partners");

    cy.get("button").contains("Importēt").click();
    cy.get("a").contains("XML").click();
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/partner_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/import", { forceNetworkError: true }).as("importPartnersRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR6 - Neparedzēta servera kļūda [Nepareiza formatējuma XML fails]", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/incorrect_partner_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/import").as("importPartnersRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Veiksmīga partneru importēšana", () => {
    cy.get('input[type="file"]').selectFile("cypress/fixtures/partner_import.xml", { force: true });

    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/import").as("importPartnersRequest");

    cy.get("button").contains("Importēt").click();

    cy.wait("@importPartnersRequest").its("response.statusCode").should("eq", 201);
  });
});
