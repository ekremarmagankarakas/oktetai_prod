describe('login page', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('It should show validation error if inputs are empty', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="loginButton"]').click()
    cy.get('[data-cy="errormessage"]').should('exist')
  })

  it('It should show validation error if password is invalid', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test100')
    cy.get('[data-cy="password"]').type('test')
    cy.get('[data-cy="loginButton"]').click()
    cy.get('[data-cy="errormessage"]').should('exist')
  })

  it('It should show validation error if username is wrong', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test')
    cy.get('[data-cy="password"]').type('123')
    cy.get('[data-cy="loginButton"]').click()
    cy.get('[data-cy="errormessage"]').should('exist')
  })

  it('It should show validation error if username and password is wrong', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test')
    cy.get('[data-cy="password"]').type('test')
    cy.get('[data-cy="loginButton"]').click()
    cy.get('[data-cy="errormessage"]').should('exist')
  })
  it('It should go to dashboard page if credentials are correct', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test100')
    cy.get('[data-cy="password"]').type('123')
    cy.get('[data-cy="loginButton"]').click()
    cy.url().should('include', '/dashboard')
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="closeButton"]').click()
    cy.get('[data-cy="accountButton"]').click()
    cy.get('[data-cy="logoutButton"]').click()
    cy.url().should('include', '/login')
    cy.visit('http://localhost:3000/dashboard')
    cy.url().should('include', '/login')
  })
})

