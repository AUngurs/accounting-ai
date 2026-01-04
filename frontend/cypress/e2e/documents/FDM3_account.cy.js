describe("Account document", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Document Company");

    cy.get("span").click();

    cy.visit("/partners");

    cy.createPartner({ title: "SIA", name: "Test Company", regNr: "30004000", enableVatEdit: true, vatNr: "30004000" });

    cy.visit("/accounts");

    cy.setAccounts();

    cy.visit("/documents");

    cy.createDocument({ id: "001", date: "2025-12-15", amount: "605", comments: "Existing document" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");

    cy.get(".doc-date-td").click();

    cy.get(".edit-mode-button").click();

    cy.get(".add-line-btn").click();
  });

  it("[FDM3_T1] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/documents/*/lines", {
      forceNetworkError: true,
    }).as("editDocumentLinesRequest");

    cy.get('input[name="amount"]').eq(0).clear().type("500");
    cy.get('select[name="debet"]').eq(0).select(1);
    cy.get('select[name="credit"]').eq(0).select(1);
    cy.get('input[name="vat"]').eq(0).clear().type("21");
    cy.get('input[name="comments"]').eq(0).clear().type("Servera kļūdas rindas");

    cy.get(".add-line-btn").click();

    cy.get('input[name="amount"]').eq(1).clear().type("105");
    cy.get('select[name="debet"]').eq(1).select(1);
    cy.get('select[name="credit"]').eq(1).select(1);
    cy.get('input[name="vat"]').eq(1).clear().type("21");
    cy.get('input[name="comments"]').eq(1).clear().type("Servera kļūdas rindas");

    cy.get(".edit-mode-button").click();

    cy.wait("@editDocumentLinesRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[FDM3_T2] ERR24 - Nederīgs summas formāts", () => {
    cy.get('input[name="amount"]').eq(0).clear().type("0");
    cy.get('select[name="debet"]').eq(0).select(1);
    cy.get('select[name="credit"]').eq(0).select(1);
    cy.get('input[name="vat"]').eq(0).clear().type("21");
    cy.get('input[name="comments"]').eq(0).clear().type("ERR24 kļūdas rindas");

    cy.get(".edit-mode-button").click();

    cy.get(".invalid-feedback").should("contain", "Nederīgs summas formāts");
  });

  it("[FDM3_T3] ERR26 - Piezīmes nedrīkst pārsniegt 255 simbolus", () => {
    cy.get('input[name="amount"]').eq(0).clear().type("500");
    cy.get('select[name="debet"]').eq(0).select(1);
    cy.get('select[name="credit"]').eq(0).select(1);
    cy.get('input[name="vat"]').eq(0).clear().type("21");
    cy.get('input[name="comments"]')
      .eq(0)
      .clear()
      .type(
        "ERR26 kļūdas rindas - This is just a long piece of text written on purpose to go over the two hundred and fifty five character limit. It does not really say anything important, it just keeps going and going so that it is definitely long enough to trigger a validation error when someone tries to save it in a form that has a maximum length restriction."
      );

    cy.get(".edit-mode-button").click();

    cy.get(".invalid-feedback").should("contain", "Piezīmes nedrīkst pārsniegt 255 simbolus");
  });

  it("[FDM3_T4] ERR27 - PVN likmei jābūt pozitīvam, veselam skaitlim no 1 līdz 100", () => {
    cy.get('input[name="amount"]').eq(0).clear().type("605");
    cy.get('select[name="debet"]').eq(0).select(1);
    cy.get('select[name="credit"]').eq(0).select(1);
    cy.get('input[name="vat"]').eq(0).clear().type("0");
    cy.get('input[name="comments"]').eq(0).clear().type("ERR27 kļūdas rindas");

    cy.get(".edit-mode-button").click();

    cy.get(".invalid-feedback").should("contain", "PVN likmei jābūt pozitīvam, veselam skaitlim no 1 līdz 100");
  });

  it("[FDM3_T5] Veiksmīga finanšu dokumenta kontēšana", () => {
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/documents/*/lines").as("editDocumentLinesRequest");

    cy.get('input[name="amount"]').eq(0).clear().type("500");
    cy.get('select[name="debet"]').eq(0).select(1);
    cy.get('select[name="credit"]').eq(0).select(1);
    cy.get('input[name="vat"]').eq(0).clear().type("21");
    cy.get('input[name="comments"]').eq(0).clear().type("Veiksmīgas rindas");

    cy.get(".add-line-btn").click();

    cy.get('input[name="amount"]').eq(1).clear().type("105");
    cy.get('select[name="debet"]').eq(1).select(1);
    cy.get('select[name="credit"]').eq(1).select(1);
    cy.get('input[name="vat"]').eq(1).clear().type("21");
    cy.get('input[name="comments"]').eq(1).clear().type("Veiksmīgas rindas");

    cy.get(".edit-mode-button").click();

    cy.wait("@editDocumentLinesRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/documents");
  });
});
