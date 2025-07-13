---
name: Automated Test Failure
about: Automatically created when tests fail
title: 'Test Failed: [Test Name]'
labels: bug, automated, test-failure
assignees: ''

---

**Automated Issue - Test Failure**

**Test Information**:
- Test Case: `[TEST_CASE_ID]`
- Test File: `[TEST_FILE]`
- Test Suite: `[TEST_SUITE]`
- Environment: `[ENVIRONMENT]`
- Commit: `[COMMIT_SHA]`
- Run ID: `[GITHUB_RUN_ID]`

**Failure Details**:
```
[ERROR_MESSAGE]
```

**Stack Trace**:
```
[STACK_TRACE]
```

**Test Code**:
```javascript
[TEST_CODE]
```

**Browser/Platform**:
- Browser: `[BROWSER]`
- Version: `[BROWSER_VERSION]`
- OS: `[OS]`

**Screenshot/Video**:
[SCREENSHOT_URL]

**Previous Status**:
- Last Passed: `[LAST_PASS_DATE]`
- Failure Count: `[FAILURE_COUNT]`
- Flaky: `[IS_FLAKY]`

**Suggested Actions**:
- [ ] Review recent changes to `[AFFECTED_FILES]`
- [ ] Check browser-specific compatibility
- [ ] Verify test data/fixtures
- [ ] Review application logs

**Related Issues**:
- Related to #[ISSUE_NUMBER]

---
*This issue was automatically created by the test automation system*