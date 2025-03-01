# OktetAI - AI-Powered Writing Assistant

OktetAI is a comprehensive AI writing assistant platform that helps users with various content creation tasks including essay writing, resume building, and code generation.

## Features

- **Multimodal AI Integration**: Integrates with multiple AI providers (OpenAI, Anthropic, Google)
- **Content Generation**: Helps users craft essays, resumes, and code
- **Collaborative AI**: Combines the power of multiple AI models for better results
- **Notes & Paraphrasing**: Save important snippets and rewrite content
- **Subscription Management**: Tiered access to features based on subscription level

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templates with vanilla JavaScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with local and Google OAuth strategies
- **Payment Processing**: Stripe integration
- **Testing**: Jest for unit testing, Cypress for E2E testing
- **Deployment**: Docker and Docker Compose

## Installation

1. Clone the repository
```bash
git clone https://github.com/ekremarmagankarakas/oktetai.git
cd oktetai
```

2. Install dependencies
```bash
cd server
npm install
```

3. Create environment variables file
```bash
touch .env
# Edit .env file with your API keys and configuration
```

4. Start the development server
```bash
npm run dev
```

## Docker Deployment

The application includes Docker configuration for easy deployment:

```bash
docker-compose up -d
```

## Testing

Run Jest tests:
```bash
npm test
```

Run Cypress E2E tests:
```bash
npm run e2e
```

## Contact

For support or inquiries, please contact [ekremarmagankarakas@gmail.com](mailto:ekremarmagankarakas@gmail.com)