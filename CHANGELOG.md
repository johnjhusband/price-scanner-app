# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Growth Questions routing regression in Blue environment - added nginx configuration to deployment workflow
- Added automated tests to prevent growth routes from falling through to React app

### Added
- CI smoke tests for growth route configuration
- Nginx route testing scripts

### Changed
- Updated all deployment workflows to ensure growth routes are properly configured

## [Release 006] - 2025-08-16

### Added
- P2: Growth Analytics - Complete analytics tracking system with dashboard
- P1: QA Process - Checkpoint documentation in CLAUDE.md
- Share image optimization for Whatnot (75% height, title positioning)

### Fixed
- P0: Loading Screen Bug - Fixed "undefined module" errors
- P0: Growth Route Fix - Backend routes no longer redirect to React app

### Known Issues
- Analytics features require manual database migration on first deployment