describe("Delete partner", () => {
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
    cy.createPartner({ title: "ZS", name: "Third Company", regNr: "12345678", enableVatEdit: true, vatNr: "12345678" });
    cy.createPartner({ title: "SIA", name: "Fourth Company", regNr: "21001000", enableVatEdit: true, vatNr: "21001000" });
    cy.createPartner({ title: "AS", name: "Fifth Company", regNr: "88009999", enableVatEdit: true, vatNr: "88009999" });
    cy.createPartner({ title: "ZS", name: "Sixth Company", regNr: "87654321", enableVatEdit: true, vatNr: "87654321" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });
    cy.get("span").click();
    cy.visit("/partners");
  });

  it("ERR6 - Neparedzēta servera kļūda [SK-PAR-EDIT]", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/partners/*", {
      forceNetworkError: true,
    }).as("deletePartnerRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deletePartnerRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR6 - Neparedzēta servera kļūda [SK-PAR]", () => {
    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();

    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/bulk-delete", {
      forceNetworkError: true,
    }).as("deletePartnersRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deletePartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Veiksmīga partnera dzēšana [SK-PAR-EDIT]", () => {
    cy.get("tbody tr td div button").eq(0).click();
    cy.intercept("DELETE", "http://localhost:5001/api/companies/*/partners/*").as("deletePartnerRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deletePartnerRequest");
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Partneris veiksmīgi dzēsts!");
    cy.url().should("include", "/partners");
  });

  it("Veiksmīga partneru dzēšana [SK-PAR]", () => {
    cy.get("tbody tr td input[type='checkbox']").eq(0).click();
    cy.get("tbody tr td input[type='checkbox']").eq(1).click();

    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners/bulk-delete").as("deletePartnersRequest");

    cy.get("button").contains("Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deletePartnersRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Veiksmīgi dzēsti 2 partneri!");
  });
});
