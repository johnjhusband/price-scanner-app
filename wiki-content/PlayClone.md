# PlayClone 🎭

## AI-Native Browser Automation Framework

### Overview

PlayClone is a revolutionary browser automation framework designed specifically for AI assistants to control web browsers using natural language commands. Unlike traditional tools like Playwright that require writing code, PlayClone enables direct browser control through simple, AI-optimized function calls.

**Status**: ✅ Production Ready (v1.0)
- Self-test suite: 100% passing (10/10 tests)
- Real-world tested on GitHub, Google, DuckDuckGo
- AI-optimized responses under 1KB

## 🎯 What Makes PlayClone Different

### Traditional Automation (Playwright)
```javascript
// Complex code AI must generate
const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.click('#nav > div.container > button.btn-primary:nth-child(2)');
```

### PlayClone Way
```javascript
// Natural language AI can use directly
await pc.navigate('example.com');
await pc.click('second blue button in navigation');
```

## 🚀 Key Features

### 1. Natural Language Selectors
- **"Click the login button"** - Finds and clicks login buttons
- **"Fill email field"** - Identifies email inputs automatically
- **"Blue button in header"** - Uses color and location context
- **Fuzzy matching** - Handles typos and variations

### 2. AI-Optimized Design
- **Responses under 1KB** - Efficient token usage
- **Semantic error messages** - AI understands what went wrong
- **Progressive disclosure** - Only returns relevant information
- **Stateful sessions** - Maintains context between commands

### 3. Multi-Browser Support
| Browser | Status | Notes |
|---------|--------|-------|
| Chromium | ✅ Fully Supported | Default, best compatibility |
| Firefox | ✅ Fully Supported | 90% test pass rate |
| WebKit | ⚠️ Supported* | Safari engine, needs system deps |

### 4. Advanced Capabilities
- **🔍 Search Engine Automation** - Anti-bot bypass for Google, Bing, DuckDuckGo
- **🍪 Cookie Management** - Full cookie control with import/export
- **🔌 Proxy Support** - HTTP/HTTPS/SOCKS5 with authentication
- **🧩 Browser Extensions** - Load Chrome extensions dynamically
- **⏱️ Smart Timeouts** - Adapts to site complexity automatically
- **📊 Connection Pooling** - Efficient browser resource management

## 📦 Installation & Setup

### Install PlayClone
```bash
npm install playclone
```

### Install Browser Engines
```bash
# Chromium (recommended)
npx playwright install chromium

# Firefox
npx playwright install firefox  

# WebKit (Safari)
npx playwright install webkit
# Linux only: sudo npx playwright install-deps webkit
```

## 💻 Basic Usage

### Initialize
```javascript
import { PlayClone } from 'playclone';

// Default: Chromium with visible browser
const pc = new PlayClone({ headless: false });

// Use Firefox
const pcFirefox = new PlayClone({ 
  browser: 'firefox', 
  headless: false 
});
```

### Common Actions
```javascript
// Navigate
await pc.navigate('https://flippi.ai');

// Click elements
await pc.click('Sign In button');
await pc.click('link containing pricing');

// Fill forms
await pc.fill('email input', 'user@example.com');
await pc.fill('search box at top', 'AI automation');

// Extract data
const title = await pc.getText('main heading');
const links = await pc.getLinks();
const table = await pc.getTable('pricing table');

// Take screenshots
await pc.screenshot({ path: 'page.png', fullPage: true });

// Close when done
await pc.close();
```

## 🤖 AI Assistant Integration

### MCP Server Mode
For Claude Desktop and other MCP-compatible assistants:

```bash
# Start with visible browser (default)
node mcp-server-v2.cjs

# Headless mode for servers
PLAYCLONE_HEADLESS=true node mcp-server-v2.cjs
```

### Direct Integration
```javascript
// In your AI assistant code
const pc = new PlayClone();
const result = await pc.click('submit button');

// AI-friendly response format
{
  success: true,
  action: 'click',
  value: 'Form submitted successfully',
  duration: 245,
  timestamp: 1234567890
}
```

## 🔧 Advanced Configuration

### Connection Pool
```javascript
// Environment variables
export PLAYCLONE_POOL_MIN_CONNECTIONS=2
export PLAYCLONE_POOL_MAX_CONNECTIONS=10
export PLAYCLONE_POOL_ADAPTIVE_SCALING=true

// Or playclone.config.json
{
  "pool": {
    "minConnections": 2,
    "maxConnections": 10,
    "adaptiveScaling": true
  }
}
```

### Proxy Configuration
```javascript
const pc = new PlayClone({
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
    bypass: 'localhost,*.internal.com'
  }
});
```

### Browser Extensions
```javascript
const pc = new PlayClone({
  browser: 'chromium',
  extensions: [
    { path: './my-extension' },
    { id: 'react-devtools-id' },
    { url: 'https://example.com/extension.zip' }
  ]
});
```

## 📚 API Reference

### Core Methods

#### Navigation
- `navigate(url)` - Go to URL or search
- `back()` - Browser back button
- `forward()` - Browser forward button
- `reload()` - Refresh page

#### Actions
- `click(selector)` - Click element
- `fill(selector, value)` - Fill input field
- `select(selector, option)` - Select dropdown
- `check(selector)` - Check checkbox
- `hover(selector)` - Hover over element

#### Data Extraction
- `getText(selector?)` - Get text content
- `getTable(selector?)` - Extract table as JSON
- `getLinks()` - Get all page links
- `screenshot(options?)` - Take screenshot
- `getFormData()` - Get form values

#### State Management
- `saveCheckpoint(name)` - Save browser state
- `restoreCheckpoint(name)` - Restore saved state
- `getCookies()` - Get browser cookies
- `setCookie(cookie)` - Set cookie

## 🧪 Testing PlayClone

### Run Self-Tests
```bash
# PlayClone tests itself!
node tests/self-tests/master.self-test.js

# Individual test suites
node tests/self-test-navigation.js
node tests/self-test-forms.js
node tests/self-test-extraction.js
```

### Test Real Websites
```bash
# Test on popular sites
node test-real-websites.js

# Test search engines
node test-search-improvements.js
```

## 🔍 Troubleshooting

### Common Issues

**"Element not found"**
- Try more descriptive selector: "blue submit button" vs "submit"
- Check if element is in iframe
- Ensure page fully loaded

**WebKit Installation Failed**
```bash
# Linux: Install system dependencies
sudo npx playwright install-deps webkit

# Check installed browsers
npx playwright --version
```

**Proxy Not Working**
- Verify proxy URL format: `http://proxy:8080`
- Check authentication credentials
- Test proxy separately first

## 🏗️ Architecture

```
┌─────────────────────┐
│   AI Assistant      │
│  (Claude, GPT, etc) │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  PlayClone API      │
│  - Natural Language │
│  - State Management │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Browser Manager    │
│  - Element Locator  │
│  - Action Executor  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Browser Engines    │
│ Chromium│Firefox│WebKit
└─────────────────────┘
```

## 🚀 Use Cases

### 1. E-commerce Automation
```javascript
await pc.navigate('amazon.com');
await pc.fill('search box', 'wireless headphones');
await pc.click('search button');
await pc.click('first product with Prime');
```

### 2. Form Testing
```javascript
await pc.navigate('app.flippi.ai/signup');
await pc.fill('email field', 'test@example.com');
await pc.check('terms checkbox');
await pc.click('create account button');
```

### 3. Data Scraping
```javascript
await pc.navigate('news.ycombinator.com');
const stories = await pc.getTable('top stories');
const links = await pc.getLinks();
```

## 📈 Performance

- **Command execution**: <2 seconds (95th percentile)
- **Memory usage**: ~100MB per browser
- **Concurrent sessions**: 100+ supported
- **Response size**: Average 215 bytes

## 🔒 Security

- Sandboxed browser execution
- No local file system access
- Audit logging of all actions
- HTTPS/TLS for all communications

## 🛠️ Development

### Build from Source
```bash
git clone https://github.com/johnjhusband/PlayClone.git
cd PlayClone
npm install
npm run build
```

### Run Tests
```bash
npm test               # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:browsers # Cross-browser tests
```

## 📝 Contributing

PlayClone welcomes contributions! Areas of interest:
- Visual element detection
- More browser support
- Language bindings (Python, Go)
- Cloud browser integration

## 🔗 Resources

- **GitHub**: https://github.com/johnjhusband/PlayClone
- **NPM**: https://www.npmjs.com/package/playclone
- **Documentation**: `/docs` folder in repository
- **Examples**: `/examples` folder

## 🎯 Why Use PlayClone?

1. **For AI Assistants**: Natural language control without code generation
2. **For Developers**: Build AI-powered automation faster
3. **For Researchers**: Create autonomous web agents easily
4. **For Testers**: Automate tests with plain English

## 📅 Roadmap

- [ ] Visual element detection
- [ ] Multi-tab support
- [ ] Advanced CAPTCHA handling
- [ ] Cloud browser support
- [ ] Python SDK
- [ ] Recorder mode

---

PlayClone revolutionizes browser automation by making it as simple as describing what you want to do. Perfect for AI assistants, developers, and anyone who wants to automate the web without writing complex code.

[[Home]] | [[Development-Workflow]] | [[Architecture]]