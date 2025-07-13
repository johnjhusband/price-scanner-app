# Test Case Management Strategy

## Overview
We use a hybrid approach to document and manage test cases:

1. **Test Code = Documentation** (Primary)
2. **GitHub Issues = Features/Bugs** (Tracking)
3. **Markdown = High-level reference** (Planning)

## Where Test Cases Live

### 1. In Playwright Test Files ✅ (Source of Truth)
```
tests/
├── upload.spec.js          # Contains TC-001.1 through TC-001.8
├── camera.spec.js          # Contains TC-002.x and TC-003.x
├── drag-drop.spec.js       # Contains TC-004.x
├── paste.spec.js           # Contains TC-005.x
└── ...
```

Each test file:
- Documents the feature it tests
- Lists all test case IDs
- Contains executable test code
- Includes test metadata for reporting

### 2. In GitHub Issues 🔗 (Cross-Reference)
Issues reference test cases:

```markdown
**Bug**: Drag & drop fails on Mac Safari
**Failed Test**: TC-004.6
**Test File**: tests/drag-drop.spec.js:45
```

### 3. In Feature Traceability Matrix 📋 (Planning)
High-level mapping in `/docs/FEATURE-TRACEABILITY-MATRIX.md`:
- Feature → Test Cases
- Test Cases → Automation Status
- Priority levels

## Test Case Format

### In Code:
```javascript
test('TC-001.1: Upload JPEG image successfully', async ({ page }) => {
  // Test metadata
  test.info().annotations.push(
    { type: 'test_id', description: 'TC-001.1' },
    { type: 'feature', description: 'F-001' },
    { type: 'github_issue', description: '#123' }
  );
  
  // Test steps...
});
```

### In GitHub Issues:
```markdown
## Acceptance Criteria
- [x] Test case TC-001.1 passes
- [x] Test case TC-001.2 passes
- [ ] Test case TC-001.3 passes
```

## Linking System

### Test → Issue
```javascript
// In test file
test('TC-004.6: Drag & drop works on Mac Safari', async ({ page }) => {
  test.info().annotations.push(
    { type: 'fixes', description: '#45' } // Links to issue #45
  );
});
```

### Issue → Test
```markdown
// In GitHub issue
**Automated Tests**:
- `tests/drag-drop.spec.js::TC-004.6`
- Run with: `npx playwright test -g "TC-004.6"`
```

## Test Discovery Commands

```bash
# List all test cases
npx playwright test --list | grep "TC-"

# Find specific test case
grep -r "TC-001.1" tests/

# Run specific test case
npx playwright test -g "TC-001.1"

# Generate test report with all cases
npx playwright test --reporter=json > test-cases.json
```

## Workflow Integration

1. **Feature Development**:
   - Create feature issue with test cases
   - Write tests (TDD approach)
   - Tests initially fail
   - Implement feature
   - Tests pass
   - Close issue

2. **Bug Fixes**:
   - Bug reported → Issue created
   - Issue references failing test case
   - Fix implemented
   - Test passes
   - Issue auto-closed

3. **Test Case Updates**:
   - Update test in `.spec.js` file
   - Update traceability matrix if needed
   - Commit references issue number

## Benefits of This Approach

1. **Single Source of Truth**: Test code is the documentation
2. **Always Up-to-Date**: Can't have outdated test docs
3. **Executable Documentation**: Tests prove the docs are correct
4. **Git History**: Track test case changes over time
5. **IDE Support**: Jump to test definition, refactor safely
6. **CI/CD Integration**: Tests run automatically

## Example: Complete Test Case Lifecycle

1. **Plan** (in FEATURE-TRACEABILITY-MATRIX.md):
   ```
   F-004: Drag & Drop Upload
   - TC-004.6: Drag & drop works on Mac Safari
   ```

2. **Create Issue** (GitHub #45):
   ```
   Title: Implement drag & drop for Mac Safari
   Body: Must pass test case TC-004.6
   ```

3. **Write Test** (tests/drag-drop.spec.js):
   ```javascript
   test('TC-004.6: Drag & drop works on Mac Safari', async ({ page }) => {
     // Implementation
   });
   ```

4. **Run & Track**:
   - Test fails → Creates bug issue
   - Fix implemented → Test passes
   - Issue #45 closed automatically

## Reporting

Generate test case reports:

```bash
# HTML report with all test cases
npx playwright test --reporter=html

# JSON for processing
npx playwright test --reporter=json > results.json

# JUnit for CI tools
npx playwright test --reporter=junit

# Custom report
npx playwright test --reporter=./test-case-reporter.js
```

## Best Practices

1. **Test Case IDs**: Always use format `TC-XXX.Y`
2. **Descriptive Names**: ID + clear description
3. **Metadata**: Add annotations for reporting
4. **Comments**: Document complex test logic
5. **Fixtures**: Share test data across tests
6. **Page Objects**: Reuse common interactions
7. **Assertions**: Multiple checks per test case
8. **Error Messages**: Clear failure reasons

This system ensures test cases are:
- Always findable (in code)
- Always runnable (Playwright)
- Always trackable (GitHub)
- Always current (git sync)