describe("Add partner", () => {
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

    cy.get("button").contains("Jauns").click();
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners", {
      forceNetworkError: true,
    }).as("addPartnerRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("ZS");
      cy.get('input[name="name"]').type("Third Test Company");
      cy.get('input[name="reg_nr"]').type("90008000");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("90008000");
      cy.get('button[type="submit"]').click();
    });

    cy.wait("@addPartnerRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR11 - Nosaukumam vai vārdam jābūt 1-255 simbolu garam", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="reg_nr"]').type("40005060");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("40005060");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Nosaukumam vai vārdam jābūt 1-255 simbolu garam");
    });
  });

  it("ERR12 - Uzvārdam jābūt 1-50 simbolu garam", () => {
    cy.get(".modal").within(() => {
      cy.get('select[name="kind_name"]').select("Fiziska persona");
      cy.get('input[name="name"]').type("Valid name");
      cy.get('input[name="reg_nr"]').type("120190-99999");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Uzvārdam jābūt 1-50 simbolu garam");
    });
  });

  it("ERR13 - Tiesiskā forma nedrīkst pārsniegt 50 simbolus", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("Text exceeding fifty characters to trigger validation error");
      cy.get('input[name="name"]').type("Valid name");
      cy.get('input[name="reg_nr"]').type("40005060");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("40005060");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Tiesiskā forma nedrīkst pārsniegt 50 simbolus");
    });
  });

  it("ERR14 - Šāds partneris jau eksistē", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("SIA");
      cy.get('input[name="name"]').type("Test Company");
      cy.get('input[name="reg_nr"]').type("30004000");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Šāds partneris jau eksistē");
    });
  });

  it("ERR15 - Reģistrācijas nr./Personas kods nedrīkst pārsniegt 50 simbolus", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("Valid title");
      cy.get('input[name="name"]').type("Valid name");
      cy.get('input[name="reg_nr"]').type("Text exceeding fifty characters to trigger validation error");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Reģistrācijas nr./Personas kods nedrīkst pārsniegt 50 simbolus");
    });
  });

  it("ERR16 - Partneris ar šādu reģistrācijas nr./Personas kodu jau eksistē", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("AS");
      cy.get('input[name="name"]').type("Unique Company");
      cy.get('input[name="reg_nr"]').type("30004000");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("40005060");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Partneris ar šādu reģistrācijas nr./Personas kodu jau eksistē");
    });
  });

  it("ERR17 - PVN numuram jābūt 1-47 simbolu garam", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("SIA");
      cy.get('input[name="name"]').type("Valid Company");
      cy.get('input[name="reg_nr"]').type("40005060");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("Text exceeding fourty seven characters to trigger validation error");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "PVN numuram jābūt 1-47 simbolu garam");
    });
  });

  it("ERR18 - Partneris ar šādu PVN numuru jau eksistē", () => {
    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("ZS");
      cy.get('input[name="name"]').type("Valid Company");
      cy.get('input[name="reg_nr"]').type("50004000");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("30004000");
      cy.get('button[type="submit"]').click();
      cy.get(".invalid-feedback").should("contain", "Partneris ar šādu PVN numuru jau eksistē");
    });
  });

  it("Veiksmīga partnera pievienošana", () => {
    cy.intercept("POST", "http://localhost:5001/api/companies/*/partners").as("addPartnerRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="title"]').type("AS");
      cy.get('input[name="name"]').type("Second Test Company");
      cy.get('input[name="reg_nr"]').type("70007000");
      cy.get("#enableVatEdit").check();
      cy.get('input[name="vat_nr_input"]').type("70007000");
      cy.get('button[type="submit"]').click();
    });

    cy.wait("@addPartnerRequest").its("response.statusCode").should("eq", 201);
    cy.get(".modal-backdrop").should("not.exist");
    cy.url().should("include", "/partners");
  });
});
