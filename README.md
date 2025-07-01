# My Thrifting Buddy

A mobile application that helps users estimate the resale value of secondhand items using AI-powered image analysis.

## Features

- 📸 Camera integration for capturing item photos
- 🤖 AI-powered image analysis using OpenAI Vision API
- 💰 Price estimation from multiple platforms:
  - eBay
  - Facebook Marketplace
  - WhatNot
  - Poshmark
- 📱 Cross-platform support (iOS and Android)
- 🎨 Modern, intuitive user interface

## Project Structure

- `/backend` - Node.js/Express server with OpenAI integration
- `/mobile-app` - React Native mobile application

## Prerequisites

- Node.js 16+
- React Native development environment
- OpenAI API key
- iOS/Android development tools

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd my-thrifting-buddy
```

2. Install backend dependencies
```bash
cd backend
npm install
cp env.example .env  # Configure your environment variables
```

3. Install mobile app dependencies
```bash
cd ../mobile-app
npm install
```

4. Start the backend server
```bash
cd ../backend
npm start
```

5. Run the mobile app
```bash
cd ../mobile-app
npm start
```

## Environment Configuration

The backend requires the following environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 