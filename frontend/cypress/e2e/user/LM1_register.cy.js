describe("Register", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("[LM1_T1] ERR1 - Nederīgs e-pasta formāts", () => {
    cy.get('input[name="email"]').type("invalid-email");
    cy.get('input[name="username"]').type("validuser");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Nederīgs e-pasta formāts");
  });

  it("[LM1_T2] ERR2 - Lietotājvārdam jābūt 3-20 simbolu garam", () => {
    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="username"]').type("us");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Lietotājvārdam jābūt 3-20 simbolu garam");
  });

  it("[LM1_T3] ERR3 - Parolei jābūt 8-64 simbolu garai", () => {
    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="username"]').type("validuser");
    cy.get('input[name="password"]').type("short");
    cy.get('input[name="repeatPassword"]').type("short");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Parolei jābūt 8-64 simbolu garai");
  });

  it("[LM1_T4] ERR3 - [Atkārtotai] Parolei jābūt 8-64 simbolu garai", () => {
    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="username"]').type("validuser");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("short");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Parolei jābūt 8-64 simbolu garai");
  });

  it("[LM1_T5] ERR4 - Paroles nesakrīt", () => {
    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="username"]').type("validuser");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("DifferentPassword123!");
    cy.get('button[type="submit"]').click();
    cy.get(".invalid-feedback").should("contain", "Paroles nesakrīt");
  });

  it("[LM1_T6] ERR5 - E-pasts jau reģistrēts", () => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `existing_${timestamp}@example.com`;
    const uniqueUsername = `existing_user_${timestamp.toString().substring(0, 5)}`;

    cy.visit("/register");

    cy.intercept("POST", "http://localhost:5001/api/auth/register").as("firstRegisterRequest");

    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="username"]').type(uniqueUsername);
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@firstRegisterRequest").its("response.statusCode").should("eq", 201);
    cy.url().should("include", "/login");

    cy.visit("/register");

    cy.intercept("POST", "http://localhost:5001/api/auth/register").as("secondRegisterRequest");

    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="username"]').type(`new_user_${timestamp.toString().substring(0, 5)}`);
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@secondRegisterRequest").its("response.statusCode").should("eq", 400);
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "E-pasts jau reģistrēts");
  });

  it("[LM1_T7] ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("POST", "http://localhost:5001/api/auth/register", {
      forceNetworkError: true,
    }).as("registerRequest");

    cy.get('input[name="email"]').type("valid@email.com");
    cy.get('input[name="username"]').type("validuser");
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();

    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("[LM1_T8] Veiksmīga reģistrācija sistēmā", () => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `testuser_${timestamp}@example.com`;
    const uniqueUsername = `user_${timestamp.toString().substring(0, 10)}`;

    cy.intercept("POST", "http://localhost:5001/api/auth/register").as("registerRequest");

    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="username"]').type(uniqueUsername);
    cy.get('input[name="password"]').type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').type("ValidPassword123!");
    cy.get('button[type="submit"]').click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 201);
    cy.url().should("include", "/login");
  });
});
