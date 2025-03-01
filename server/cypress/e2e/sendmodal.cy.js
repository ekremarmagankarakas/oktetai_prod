describe('modal page', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('It should open all modals', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test100')
    cy.get('[data-cy="password"]').type('123')
    cy.get('[data-cy="loginButton"]').click()
    cy.url().should('include', '/dashboard')

    cy.get('[data-cy="closeButton"]').click()
    cy.get('[id="chatContainer"]').should('exist').and('not.be.visible');

    cy.get('[id="openModalButton"]').click()
    cy.get('[data-target="chatContainer"]').click()
    cy.get('[data-cy="closeButton"]').click()
    cy.get('[id="chatContainer"]').should('exist').and('be.visible')
  })

  it('It should open all modals and test if they send', () => {
    cy.visit('http://localhost:3000/login')
    cy.get('[data-cy="username"]').type('test100')
    cy.get('[data-cy="password"]').type('123')
    cy.get('[data-cy="loginButton"]').click()
    cy.url().should('include', '/dashboard')

    cy.get('[data-target="chatContainer"]').click()
    cy.get('[data-cy="closeButton"]').click()
    cy.get('[id="chatContainer"]').should('exist').and('be.visible')
    cy.get('[data-cy="inputChat"]').type('test message')
    cy.get('[data-cy="sendChat"]').click()
    const mockResponse = 'This is a mock response';
    cy.intercept('/api/chatgpt35', {
      statusCode: 200,
      body: { result: mockResponse },
    });
    cy.get('[id="chatContainer"]')
    .contains('test message')
    .should('be.visible');
    cy.get('[id="chatContainer"]')
    .contains(mockResponse)
    .should('be.visible');
  })
})

