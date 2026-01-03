describe("Active company", () => {
  let registeredUser;

  before(() => {
    const timestamp = new Date().getTime();
    const uniqueEmail = `test_${timestamp}@example.com`;
    cy.register({ email: uniqueEmail, password: "ValidPassword123!" });

    registeredUser = { email: uniqueEmail, password: "ValidPassword123!" };

    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.createCompany("Active Company");

    cy.get("button.logout-button").click();
    cy.url().should("include", "/login");
  });

  it("Veiksmīga darbojošā uzņēmuma izvēle", () => {
    cy.login({ email: registeredUser.email, password: registeredUser.password });

    cy.get("span").click();

    cy.url().should("include", "/documents");
  });
});
