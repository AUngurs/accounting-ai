describe("Edit partner", () => {
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

    cy.createPartner({ title: "SIA", name: "Test Company", regNr: "20001000", enableVatEdit: true, vatNr: "20001000" });
    cy.createPartner({ title: "AS", name: "Second Company", regNr: "90009999", enableVatEdit: true, vatNr: "90009999" });
    cy.createPartner({ title: "ZS", name: "Error Company", regNr: "12345678", enableVatEdit: true, vatNr: "12345678" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/partners");
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.contains("tr", "Error Company, ZS").find("i").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/partners/*", {
      forceNetworkError: true,
    }).as("editPartnerRequest");

    cy.get('input[name="title"]').clear().type("ZS");
    cy.get('input[name="name"]').clear().type("Edited Company");
    cy.get('input[name="reg_nr"]').clear().type("90807060");
    cy.get("#enableVatEdit").check();
    cy.get('input[name="vat_nr_input"]').clear().type("90807060");
    cy.get('button[type="submit"]').click();

    cy.wait("@editPartnerRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR11 - Nosaukumam vai vārdam jābūt 1-255 simbolu garam", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('input[name="name"]').clear();
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Nosaukumam vai vārdam jābūt 1-255 simbolu garam");
  });

  it("ERR12 - Uzvārdam jābūt 1-50 simbolu garam", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('select[name="kind_name"]').select("Fiziska persona");
    cy.get('input[name="title"]').clear();
    cy.get('input[name="name"]').clear().type("Valid name");
    cy.get('input[name="reg_nr"]').clear().type("120190-99999");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Uzvārdam jābūt 1-50 simbolu garam");
  });

  it("ERR13 - Tiesiskā forma nedrīkst pārsniegt 50 simbolus", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('input[name="title"]').clear().type("Text exceeding fifty characters to trigger validation error");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Tiesiskā forma nedrīkst pārsniegt 50 simbolus");
  });

  it("ERR14 - Šāds partneris jau eksistē", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('input[name="title"]').clear().type("AS");
    cy.get('input[name="name"]').clear().type("Second Company");
    cy.get('input[name="reg_nr"]').clear().type("90009999");
    cy.get("#enableVatEdit").uncheck();
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Šāds partneris jau eksistē");
  });

  it("ERR15 - Reģistrācijas nr./Personas kods nedrīkst pārsniegt 50 simbolus", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('input[name="reg_nr"]').clear().type("Text exceeding fifty characters to trigger validation error");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Reģistrācijas nr./Personas kods nedrīkst pārsniegt 50 simbolus");
  });

  it("ERR16 - Partneris ar šādu reģistrācijas nr./Personas kodu jau eksistē", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get('input[name="title"]').clear().type("AS");
    cy.get('input[name="name"]').clear().type("Unique Company");
    cy.get('input[name="reg_nr"]').clear().type("90009999");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Partneris ar šādu reģistrācijas nr./Personas kodu jau eksistē");
  });

  it("ERR17 - PVN numuram jābūt 1-47 simbolu garam", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get("#enableVatEdit").check();
    cy.get('input[name="vat_nr_input"]').clear().type("Text exceeding fifty characters to trigger validation error");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "PVN numuram jābūt 1-47 simbolu garam");
  });

  it("ERR18 - Partneris ar šādu PVN numuru jau eksistē", () => {
    cy.contains("tr", "Test Company, SIA").find("i").click();
    cy.get("#enableVatEdit").check();
    cy.get('input[name="vat_nr_input"]').clear().type("90009999");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Partneris ar šādu PVN numuru jau eksistē");
  });

  it("Veiksmīga uzņēmuma rediģēšana", () => {
    cy.contains("tr", "Edited Company, ZS").find("i").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/partners/*").as("editPartnerRequest");

    cy.get('input[name="title"]').clear().type("AS");
    cy.get('input[name="name"]').clear().type("Edited Company");
    cy.get('input[name="reg_nr"]').clear().type("70007000");
    cy.get("#enableVatEdit").check();
    cy.get('input[name="vat_nr_input"]').clear().type("70007000");
    cy.get('button[type="submit"]').click();

    cy.wait("@editPartnerRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/partners");
  });
});
