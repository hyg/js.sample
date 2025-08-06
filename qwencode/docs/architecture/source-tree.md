# Source Tree Structure

## Overview

This document defines the project's source tree structure, organizing files and directories in a logical and maintainable way for the P2P DHT Node implementation.

## Directory Layout

```
p2p-dht-node/
├── docs/                    # Documentation files
│   ├── prd.md               # Product Requirements Document
│   └── architecture/        # Architecture documentation
│       ├── architecture.md  # System architecture
│       ├── coding-standards.md # Coding standards
│       ├── tech-stack.md    # Technology stack
│       └── source-tree.md   # This file
├── src/                     # Source code
│   ├── index.js             # Main application entry point
│   ├── lib/                 # Library modules
│   │   ├── node.js          # Core node functionality
│   │   ├── signaling.js     # Signaling server communication
│   │   ├── webrtc.js        # WebRTC connection manager
│   │   └── data.js          # Data transfer module
│   └── test/                # Test suite
│       ├── unit/            # Unit tests
│       └── integration/     # Integration tests
├── public/                  # Static assets (if applicable)
├── config/                  # Configuration files
├── scripts/                 # Utility scripts
├── .github/                 # GitHub workflows and configs
├── .vscode/                 # VS Code settings
├── node_modules/            # Node.js dependencies (ignored from git)
├── .gitignore               # Git ignore rules
├── package.json             # Project metadata and dependencies
├── README.md                # Project overview
└── LICENSE                  # License file
```

## Detailed Directory Structure

### docs/
Contains all documentation for the project:
- `prd.md`: Product Requirements Document
- `architecture/`: Detailed architecture documentation in subdirectories

### src/
Contains all source code:
- `index.js`: Entry point for the application
- `lib/`: Core library modules organized by functionality:
  - `node.js`: Main node initialization and registration logic
  - `signaling.js`: Signaling server communication handling
  - `webrtc.js`: WebRTC connection management
  - `data.js`: Data transfer between peers
- `test/`: Test suite with unit and integration tests

### public/
Static assets such as HTML, CSS, and JavaScript for any frontend components.

### config/
Configuration files for different environments (development, staging, production).

### scripts/
Utility scripts for deployment, building, or other automation tasks.

### .github/
GitHub-specific configurations including workflows, issue templates, and pull request templates.

### .vscode/
VS Code editor configurations for consistent development environment.

### node_modules/
Auto-generated directory for Node.js dependencies (should be in .gitignore).

### Root Files
- `package.json`: Project metadata, dependencies, and scripts
- `README.md`: Project overview, installation, and usage instructions
- `LICENSE`: Licensing information

## File Purposes

### Main Application Files
- `src/index.js`: Main entry point that initializes the node and sets up event listeners
- `src/lib/node.js`: Core node implementation including ID generation and registration
- `src/lib/signaling.js`: Handles all signaling communication with the signaling server
- `src/lib/webrtc.js`: Manages WebRTC connections using SimplePeer
- `src/lib/data.js`: Handles data transmission between peers

### Test Files
- `src/test/unit/`: Unit tests for individual modules
- `src/test/integration/`: Integration tests for end-to-end functionality

### Configuration Files
- `.env`: Environment variables
- `config/development.json`: Development environment settings
- `config/production.json`: Production environment settings

## Naming Conventions

### Directory Names
- All lowercase with hyphens for multi-word names
- Descriptive names that clearly indicate purpose
- Consistent with the overall project structure

### File Names
- Lowercase with hyphens for multi-word names
- Descriptive names that indicate file purpose
- Extensions indicate file type (.js for JavaScript, .md for Markdown)

## Version Control Considerations

### Ignored Files
The following files and directories should be in `.gitignore`:
- `node_modules/`
- `*.log`
- `.env` (contains secrets)
- Any generated files

### Branching Strategy
- `main`: Stable releases
- `develop`: Development branch
- Feature branches for new functionality
- Release branches for versioned releases

## Deployment Structure

### Development Environment
- Local development with hot reloading
- Mocked services for testing
- Development-specific configuration

### Production Environment
- Optimized for performance
- Security hardening
- Monitoring and logging enabled

### Containerized Environment
- Dockerfile for containerization
- docker-compose.yml for multi-container setups
- Environment-specific configurations