describe("Login", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };
  });

  beforeEach(() => {
    cy.visit("/login");
  });

  it("[LM2_T1] ERR1 - Nederīgs e-pasta formāts", () => {
    cy.get('input[name="email"]').type("invalid-email");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Nederīgs e-pasta formāts");
  });

  it("[LM2_T2] ERR3 - Parolei jābūt 8-64 simbolu garai", () => {
    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="password"]').type("short");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Parolei jābūt 8-64 simbolu garai");
  });

  it("[LM2_T3] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/auth/login", {
      forceNetworkError: true,
    }).as("loginRequest");

    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();

    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[LM2_T4] ERR7 - Nepareizi pieteikšanās dati", () => {
    cy.intercept("POST", "http://localhost:5001/api/auth/login").as("loginRequest");

    cy.get('input[name="email"]').type(`nonexistent_${new Date().getTime()}@example.com`);
    cy.get('input[name="password"]').type("NonExistentPassword123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 400);
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Nepareizi pieteikšanās dati");
  });

  it("[LM2_T5] Veiksmīga pieteikšanās sistēmā", () => {
    cy.intercept("POST", "http://localhost:5001/api/auth/login").as("loginRequest");

    cy.get('input[name="email"]').type(registeredUser.email);
    cy.get('input[name="password"]').type(registeredUser.password);
    cy.get('button[type="submit"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/companies");
  });
});
