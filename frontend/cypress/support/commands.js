Cypress.Commands.add("register", ({ email, password }) => {
  const timestamp = new Date().getTime();
  const uniqueUsername = `registered_${timestamp.toString().substring(0, 5)}`;

  cy.visit("/register");
  cy.intercept("POST", "http://localhost:5001/api/auth/register").as("registerRequest");

  cy.get('input[name="email"]').type(email);
  cy.get('input[name="username"]').type(uniqueUsername);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="repeatPassword"]').type(password);
  cy.get('button[type="submit"]').click();

  cy.wait("@registerRequest").its("response.statusCode").should("eq", 201);

  cy.url().should("include", "/login");
});

Cypress.Commands.add("login", ({ email, password }) => {
  cy.visit("/login");

  cy.intercept("POST", "http://localhost:5001/api/auth/login").as("loginRequest");

  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();

  cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);

  cy.url().should("include", "/companies");
});

Cypress.Commands.add("createCompany", (companyName) => {
  cy.contains("button", "Pievienot uzņēmumu").click();

  cy.get(".modal").should("be.visible");

  cy.intercept("POST", "http://localhost:5001/api/companies").as("addCompanyRequest");

  cy.get('input[name="name"]').clear().type(companyName);
  cy.get(".modal button").contains("Pievienot").click();

  cy.wait("@addCompanyRequest").its("response.statusCode").should("eq", 201);

  cy.get(".modal-backdrop").should("not.exist");

  cy.url().should("include", "/companies");
});

Cypress.Commands.add("createPartner", ({ title, name, regNr, enableVatEdit, vatNr }) => {
  cy.get("button").contains("Jauns").click();

  cy.get(".modal").should("be.visible");

  cy.intercept("POST", "http://localhost:5001/api/companies/*/partners").as("addPartnerRequest");

  cy.get('input[name="title"]').clear().type(title);
  cy.get('input[name="name"]').clear().type(name);
  cy.get('input[name="reg_nr"]').clear().type(regNr);
  if (enableVatEdit) cy.get("#enableVatEdit").check();
  if (enableVatEdit) cy.get('input[name="vat_nr_input"]').clear().type(vatNr);
  cy.get('button[type="submit"]').click();

  cy.wait("@addPartnerRequest").its("response.statusCode").should("eq", 201);

  cy.get(".modal-backdrop").should("not.exist");

  cy.url().should("include", "/partners");
});

Cypress.Commands.add("setAccounts", () => {
  cy.intercept("POST", "http://localhost:5001/api/companies/*/accounts/set").as("setAccountsRequest");

  cy.get("button").contains("Iestatīt noklusējuma kontus").click();

  cy.on("window:confirm", () => true);

  cy.get("button").contains("Importēt").click();

  cy.wait("@setAccountsRequest").its("response.statusCode").should("eq", 200);
});

Cypress.Commands.add("createDocument", ({ id, date, amount, comments }) => {
  cy.get("button").contains("Jauns").click();

  cy.get(".modal").should("be.visible");

  cy.intercept("POST", "http://localhost:5001/api/companies/*/documents").as("addDocumentRequest");

  cy.get('input[name="doc_id"]').clear().type(id);
  cy.get('input[name="doc_date"]').clear().type(date);
  cy.get('input[name="doc_amount"]').clear().type(amount);
  cy.get('select[name="partner_id"]').select(1);
  cy.get('textarea[name="doc_comments"]').clear().type(comments);
  cy.get("button").contains("Pievienot").click();

  cy.wait("@addDocumentRequest").its("response.statusCode").should("eq", 201);

  cy.get(".modal-backdrop").should("not.exist");

  cy.url().should("include", "/documents");
});
