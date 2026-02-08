## Running the Project Locally

To run this project in your own development environment (like VS Code), follow these steps from your terminal:

### 1. Install Dependencies

This command will download all the necessary packages for the project.

```bash
npm install
```

### 2. Run the Development Servers

You need to run two separate processes in two different terminals for the full application to work.

**In your first terminal,** run the Next.js web application:

```bash
npm run dev
```

This will start the main application, typically available at `http://localhost:9002`.

**In your second terminal,** run the Genkit AI services:

```bash
npm run genkit:dev
```

This starts the backend service that powers the AI features of the app.
