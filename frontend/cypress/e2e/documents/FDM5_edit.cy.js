describe("Edit document", () => {
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

    cy.visit("/documents");

    cy.createDocument({ id: "001", date: "2025-12-15", amount: "605", comments: "Existing document" });
    cy.createDocument({ id: "0001", date: "2020-01-01", amount: "1000", comments: "Another existing document" });

    cy.visit("/companies");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.visit("/documents");
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/documents/*", {
      forceNetworkError: true,
    }).as("editDocumentRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("1000");
      cy.get('input[name="doc_date"]').clear().type("2025-12-15");
      cy.get('input[name="doc_amount"]').clear().type("500.89");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("Servera kļūdas dokuments");
      cy.get("button").contains("Saglabāt").click();
    });

    cy.wait("@editDocumentRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("ERR22 - Finanšu dokumenta numurs nedrīkst pārsniegt 50 simbolus", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("Text exceeding fifty characters to trigger validation error");
      cy.get('input[name="doc_date"]').clear().type("2025-12-15");
      cy.get('input[name="doc_amount"]').clear().type("1000");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("ERR22 kļūdas dokuments");
      cy.get("button").contains("Saglabāt").click();

      cy.get(".invalid-feedback").should("contain", "Finanšu dokumenta numurs nedrīkst pārsniegt 50 simbolus");
    });
  });

  it("ERR23 - Finanšu dokumenta datums ir obligāts", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("1001");
      cy.get('input[name="doc_date"]').clear();
      cy.get('input[name="doc_amount"]').clear().type("199.99");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("ERR23 kļūdas dokuments");
      cy.get("button").contains("Saglabāt").click();

      cy.get(".invalid-feedback").should("contain", "Finanšu dokumenta datums ir obligāts");
    });
  });

  it("ERR24 - Nederīgs summas formāts", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("1002");
      cy.get('input[name="doc_date"]').clear().type("2025-12-15");
      cy.get('input[name="doc_amount"]').clear().type("0");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("ERR24 kļūdas dokuments");
      cy.get("button").contains("Saglabāt").click();

      cy.get(".invalid-feedback").should("contain", "Nederīgs summas formāts");
    });
  });

  it("ERR25 - Šāds finanšu dokuments jau eksistē", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("0001");
      cy.get('input[name="doc_date"]').clear().type("2020-01-01");
      cy.get('input[name="doc_amount"]').clear().type("1000");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("ERR25 kļūdas dokuments");
      cy.get("button").contains("Saglabāt").click();

      cy.get(".invalid-feedback").should("contain", "Šāds finanšu dokuments jau eksistē");
    });
  });

  it("ERR26 - Piezīmes nedrīkst pārsniegt 255 simbolus", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("1003");
      cy.get('input[name="doc_date"]').clear().type("2025-12-15");
      cy.get('input[name="doc_amount"]').clear().type("9955.55");
      cy.get('textarea[name="doc_comments"]')
        .clear()
        .type(
          "ERR25 kļūdas dokuments - This is just a long piece of text written on purpose to go over the two hundred and fifty five character limit. It does not really say anything important, it just keeps going and going so that it is definitely long enough to trigger a validation error when someone tries to save it in a form that has a maximum length restriction."
        );
      cy.get("button").contains("Saglabāt").click();

      cy.get(".invalid-feedback").should("contain", "Piezīmes nedrīkst pārsniegt 255 simbolus");
    });
  });

  it("Veiksmīga finanšu dokumenta rediģēšana", () => {
    cy.get(".document-row").eq(0).find("i").click();
    cy.intercept("PUT", "http://localhost:5001/api/companies/*/documents/*").as("editDocumentRequest");

    cy.get(".modal").within(() => {
      cy.get('input[name="doc_id"]').clear().type("1004");
      cy.get('input[name="doc_date"]').clear().type("2025-12-15");
      cy.get('input[name="doc_amount"]').clear().type("500.89");
      cy.get('select[name="partner_id"]').select(1);
      cy.get('textarea[name="doc_comments"]').clear().type("Veiksmīgas rediģēšanas dokuments");
      cy.get("button").contains("Saglabāt").click();
    });

    cy.wait("@editDocumentRequest").its("response.statusCode").should("eq", 200);
    cy.get(".modal-backdrop").should("not.exist");
    cy.url().should("include", "/documents");
  });
});
