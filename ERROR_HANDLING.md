# Error Handling & Error Boundaries

React Error Boundaries prevent white screens by catching JavaScript errors and displaying fallback UI.

## Quick Start

### Application Level

```tsx
import { ErrorBoundary } from "./components/ErrorBoundary";

<ErrorBoundary
  errorTitle="Application Error"
  errorMessage="The application encountered an unexpected error"
>
  <App />
</ErrorBoundary>
```

### Chat Component Level

```tsx
import { ChatErrorBoundary } from "./components/ErrorBoundary";

<ChatErrorBoundary>
  <ParlantChatBot serverUrl="..." agentId="..." />
</ChatErrorBoundary>
```

## ErrorBoundary Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Components to wrap |
| `fallback` | `ReactNode` | Custom fallback UI |
| `onError` | `(error, errorInfo) => void` | Error callback |
| `errorTitle` | `string` | Custom error title |
| `errorMessage` | `string` | Custom error message |

## Custom Error Messages

```tsx
<ErrorBoundary
  errorTitle="Payment Failed"
  errorMessage="We couldn't process your payment."
  onError={(error, errorInfo) => {
    // Send to error tracking service
    Sentry.captureException(error);
  }}
>
  <PaymentComponent />
</ErrorBoundary>
```

## Custom Fallback UI

```tsx
const customFallback = (
  <div className="error-container">
    <h1>🚧 Under Maintenance</h1>
    <p>This feature is temporarily unavailable.</p>
  </div>
);

<ErrorBoundary fallback={customFallback}>
  <FeatureComponent />
</ErrorBoundary>
```

## Nested Error Boundaries

Isolate different parts of your app:

```tsx
function Dashboard() {
  return (
    <div>
      <ErrorBoundary errorTitle="Header Error">
        <Header />
      </ErrorBoundary>

      <ErrorBoundary errorTitle="Content Error">
        <MainContent />
      </ErrorBoundary>
    </div>
  );
}
```

## What Error Boundaries DO NOT Catch

- Event handlers (use try-catch)
- Asynchronous code (setTimeout, promises)
- Server-side rendering
- Errors in the error boundary itself

## Error Tracking Integration

```tsx
import * as Sentry from "@sentry/react";

<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });
  }}
>
  <YourApp />
</ErrorBoundary>
```

## Features

### User-Facing
- Clear error messages
- "Try Again" and "Reload Page" buttons
- Troubleshooting tips

### Developer
- Error details in development mode
- Component stack trace
- Console logging
