describe("Delete user", () => {
  let registeredUser;

  beforeEach(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.visit("/user");
  });

  it("ERR6 - Neparedzēta servera kļūda", () => {
    cy.intercept("DELETE", "http://localhost:5001/api/user/*", {
      forceNetworkError: true,
    }).as("deleteUserRequest");

    cy.contains("button", "Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteUserRequest");
    cy.get(".Toastify__toast", { timeout: 3000 }).should("contain", "Neparedzēta servera kļūda");
  });

  it("Lietotāja konts veiksmīgi dzēsts", () => {
    cy.intercept("DELETE", "http://localhost:5001/api/user/*").as("deleteUserRequest");

    cy.contains("button", "Dzēst").click();

    cy.on("window:confirm", () => true);

    cy.wait("@deleteUserRequest").its("response.statusCode").should("eq", 200);
    cy.get("body").find(".Toastify__toast", { timeout: 3000 }).should("contain", "Lietotājs veiksmīgi dzēsts!");
    cy.url().should("include", "/login");
  });
});
