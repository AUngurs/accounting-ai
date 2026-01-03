describe("Edit user", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };
  });

  beforeEach(() => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.visit("/user");
  });

  it("ERR2 - Lietotājvārdam jābūt 3-20 simbolu garam", () => {
    cy.get('input[name="username"]').clear().type("us");
    cy.contains("button", "Saglabāt").click();
    cy.get(".invalid-feedback").should("contain", "Lietotājvārdam jābūt 3-20 simbolu garam");
  });

  it("ERR3 - Parolei jābūt 8-64 simbolu garai", () => {
    cy.get("#enablePasswordEdit").check();
    cy.get('input[name="password"]').clear().type("short");
    cy.get('input[name="repeatPassword"]').clear().type("short");
    cy.contains("button", "Saglabāt").click();
    cy.get(".invalid-feedback").should("contain", "Parolei jābūt 8-64 simbolu garai");
  });

  it("ERR3 - [Atkārtotai] Parolei jābūt 8-64 simbolu garai", () => {
    cy.get("#enablePasswordEdit").check();
    cy.get('input[name="password"]').clear().type("ValidPassword123!");
    cy.get('input[name="repeatPassword"]').clear().type("short");
    cy.contains("button", "Saglabāt").click();
    cy.get(".invalid-feedback").should("contain", "Parolei jābūt 8-64 simbolu garai");
  });

  it("ERR4 - Paroles nesakrīt", () => {
    cy.get("#enablePasswordEdit").check();
    cy.get('input[name="password"]').clear().type("NewValidPassword123!");
    cy.get('input[name="repeatPassword"]').clear().type("DifferentPassword123!");
    cy.contains("button", "Saglabāt").click();
    cy.get(".invalid-feedback").should("contain", "Paroles nesakrīt");
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("PUT", "http://localhost:5001/api/user/*", {
      forceNetworkError: true,
    }).as("userUpdateRequest");

    cy.get('input[name="username"]').clear().type("validnewusername");
    cy.contains("button", "Saglabāt").click();

    cy.wait("@userUpdateRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Lietotāja dati veiksmīgi rediģēti", () => {
    const newUsername = `updated_user_${new Date().getTime().toString().substring(0, 5)}`;
    const newPassword = "NewValidPassword123!";

    cy.intercept("PUT", "http://localhost:5001/api/user/*").as("userUpdateRequest");

    cy.get("#enablePasswordEdit").check();
    cy.get('input[name="username"]').clear().type(newUsername);
    cy.get('input[name="password"]').clear().type(newPassword);
    cy.get('input[name="repeatPassword"]').clear().type(newPassword);
    cy.contains("button", "Saglabāt").click();

    cy.wait("@userUpdateRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/companies");
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Lietotāja dati veiksmīgi rediģēti!");
  });
});
