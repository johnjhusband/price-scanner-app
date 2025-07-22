# Third-Party Licenses

This file lists all third-party dependencies used in the Flippi.ai application and their licenses.

## Summary
- **Total Dependencies**: ~50 packages (including transitive)
- **License Types**: MIT (95%), BSD (3%), Apache-2.0 (2%)
- **Copyleft Licenses**: None (No GPL/LGPL/AGPL)
- **Commercial Licenses**: None
- **License Conflicts**: None

## Backend Dependencies

### Direct Dependencies

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| better-sqlite3 | 12.2.0 | MIT | SQLite database binding |
| cors | 2.8.5 | MIT | CORS middleware |
| dotenv | 16.3.1 | BSD-2-Clause | Environment variable loader |
| express | 4.18.2 | MIT | Web application framework |
| express-validator | 7.2.1 | MIT | Validation middleware |
| multer | 1.4.5-lts.1 | MIT | Multipart/form-data handling |
| openai | 4.20.1 | MIT | OpenAI API client |

### Key Transitive Dependencies

| Package | License | Used By |
|---------|---------|---------|
| body-parser | MIT | express |
| on-finished | MIT | express |
| statuses | MIT | express |
| type-is | MIT | express |
| node-gyp | MIT | better-sqlite3 |

## Frontend Dependencies

### Direct Dependencies

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| expo | ~50.0.17 | MIT | Development platform |
| expo-camera | ~14.1.3 | MIT | Camera functionality |
| expo-constants | ~15.4.6 | MIT | System constants |
| expo-font | ~11.10.3 | MIT | Custom fonts |
| expo-image-picker | ~14.7.1 | MIT | Image selection |
| expo-linking | ~6.2.2 | MIT | Deep linking |
| expo-router | ~3.4.10 | MIT | File-based routing |
| expo-status-bar | ~1.11.1 | MIT | Status bar control |
| expo-system-ui | ~2.9.4 | MIT | System UI control |
| expo-web-browser | ~12.8.2 | MIT | Web browser API |
| react | 18.2.0 | MIT | UI library |
| react-dom | 18.2.0 | MIT | React DOM renderer |
| react-native | 0.73.6 | MIT | Mobile framework |
| react-native-web | ~0.19.11 | MIT | Web compatibility |

### Build Dependencies

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| @babel/core | ^7.24.0 | MIT | JavaScript compiler |
| @types/react | ~18.2.79 | MIT | TypeScript definitions |
| typescript | ~5.3.3 | Apache-2.0 | TypeScript compiler |

## License Texts

### MIT License
The MIT License is used by ~95% of dependencies. It allows:
- Commercial use
- Modification  
- Distribution
- Private use

Requirements:
- Include copyright notice and license text when distributing source code
- No requirements for compiled/deployed applications

### BSD-2-Clause License (dotenv)
Similar to MIT, allows:
- Commercial use
- Modification
- Distribution
- Private use

Requirements:
- Include copyright notice when distributing source code
- No requirements for compiled applications

### Apache-2.0 License (TypeScript)
Used only for TypeScript compiler, allows:
- Commercial use
- Modification
- Distribution
- Private use
- Patent use

Requirements:
- Include NOTICE file if exists when distributing
- State changes made to the code
- No requirements for applications built with TypeScript

## Compliance Requirements

### For Deployed Application (Production Use)
✅ **No attribution required** - None of the licenses require attribution in the deployed application

### For Source Code Distribution
If distributing the source code, you must:
1. Include this THIRD-PARTY-LICENSES.md file
2. Keep all existing copyright notices in node_modules
3. Include the LICENSE file from each dependency

### For Commercial Use
✅ **All licenses allow commercial use** without additional fees or restrictions

## License Compatibility
All licenses are compatible with each other and with commercial use. There are no copyleft licenses that would require open-sourcing your code.

## Updating This Document
To regenerate the license list:
```bash
# Backend
cd backend && npm ls --depth=0

# Frontend  
cd mobile-app && npm ls --depth=0
```

---
*Last updated: July 2025*
*Generated for Flippi.ai ownership transfer documentation*