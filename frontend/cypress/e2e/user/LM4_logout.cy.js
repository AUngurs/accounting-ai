describe("Logout", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };
  });

  it("Veiksmīga atteikšanās no sistēmas", () => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });
});
