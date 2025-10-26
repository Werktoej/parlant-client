# Error Handling & Error Boundaries

This document explains the error handling strategy implemented in the Virtual Chat application to prevent white screens and provide a better user experience.

## Overview

The application now includes **React Error Boundaries** that catch JavaScript errors anywhere in the component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## What's Included

### 1. ErrorBoundary Component

A reusable React Error Boundary component located at `src/components/ErrorBoundary.tsx`.

**Features:**

- ✅ Catches and handles React component errors
- ✅ Displays user-friendly error messages
- ✅ Provides recovery options (Try Again, Reload Page)
- ✅ Shows technical details in development mode
- ✅ Logs errors to console (easily extendable to error tracking services)
- ✅ Customizable error messages and fallback UI
- ✅ Beautiful gradient UI that matches the app design

### 2. ChatErrorBoundary Component

A specialized error boundary for chat components with chat-specific error messaging.

### 3. Implementation Layers

The error boundaries are implemented at two levels:

#### Application Level (`main.tsx`)

```tsx
<ErrorBoundary
  errorTitle="Application Error"
  errorMessage="The Virtual Chat application encountered an unexpected error"
>
  <App />
</ErrorBoundary>
```

Catches any errors that occur in the entire application.

#### Chat Component Level (`App.tsx`)

```tsx
<ChatErrorBoundary>
  <ParlantChatBot {...props} />
</ChatErrorBoundary>
```

Catches errors specific to the chat component without breaking the entire app.

## Usage Examples

### Basic Usage

```tsx
import { ErrorBoundary } from "./components/ErrorBoundary";

function MyApp() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Chat-Specific Error Boundary

```tsx
import { ChatErrorBoundary } from "./components/ErrorBoundary";

function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ParlantChatBot serverUrl="..." agentId="..." />
    </ChatErrorBoundary>
  );
}
```

### Custom Error Messages

```tsx
<ErrorBoundary
  errorTitle="Payment Failed"
  errorMessage="We couldn't process your payment. Please try again."
  onError={(error, errorInfo) => {
    // Send to error tracking service
    logErrorToService(error, errorInfo);
  }}
>
  <PaymentComponent />
</ErrorBoundary>
```

### Custom Fallback UI

```tsx
const customFallback = (
  <div className="error-container">
    <h1>🚧 Under Maintenance</h1>
    <p>This feature is temporarily unavailable.</p>
  </div>
);

<ErrorBoundary fallback={customFallback}>
  <FeatureComponent />
</ErrorBoundary>;
```

### Nested Error Boundaries

You can nest multiple error boundaries to isolate different parts of your app:

```tsx
function Dashboard() {
  return (
    <div>
      <ErrorBoundary errorTitle="Header Error">
        <Header />
      </ErrorBoundary>

      <div className="main-content">
        <ErrorBoundary errorTitle="Sidebar Error">
          <Sidebar />
        </ErrorBoundary>

        <ErrorBoundary errorTitle="Content Error">
          <MainContent />
        </ErrorBoundary>
      </div>
    </div>
  );
}
```

## Error Boundary Props

### ErrorBoundary Component

| Prop           | Type                                           | Required | Description                                                |
| -------------- | ---------------------------------------------- | -------- | ---------------------------------------------------------- |
| `children`     | `ReactNode`                                    | ✅ Yes   | The components to wrap with error handling                 |
| `fallback`     | `ReactNode`                                    | ❌ No    | Custom fallback UI to display on error                     |
| `onError`      | `(error: Error, errorInfo: ErrorInfo) => void` | ❌ No    | Callback when an error occurs                              |
| `errorTitle`   | `string`                                       | ❌ No    | Custom error title (default: "Oops! Something went wrong") |
| `errorMessage` | `string`                                       | ❌ No    | Custom error message (default: generic message)            |

### ChatErrorBoundary Component

| Prop       | Type        | Required | Description                                     |
| ---------- | ----------- | -------- | ----------------------------------------------- |
| `children` | `ReactNode` | ✅ Yes   | The chat components to wrap with error handling |

Pre-configured with chat-specific error messages.

## Error UI Features

### User-Facing Features

1. **Clear Error Message**

   - Friendly title and description
   - Explains what happened without technical jargon

2. **Action Buttons**

   - **Try Again**: Attempts to reset the error boundary and re-render
   - **Reload Page**: Full page reload for persistent issues

3. **Help Section**
   - Troubleshooting tips
   - Common solutions for users

### Developer Features

1. **Error Details**

   - Shows the actual error message in a styled box
   - Helps with debugging

2. **Component Stack Trace** (Development Only)

   - Expandable details section
   - Shows the React component tree where error occurred
   - Only visible in development mode

3. **Console Logging**
   - All errors are logged to console
   - Includes error object and component stack

## Integration with Error Tracking

You can easily integrate with error tracking services like Sentry, LogRocket, or Bugsnag:

```tsx
import * as Sentry from "@sentry/react";

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Send to custom analytics
    analytics.track("Error Occurred", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }}
>
  <YourApp />
</ErrorBoundary>;
```

## Benefits

### For Users

- ✅ **No More White Screen**: Always shows a helpful error message
- ✅ **Recovery Options**: Users can try to fix the issue without losing context
- ✅ **Clear Communication**: Understands something went wrong and what to do
- ✅ **Maintains App Stability**: Other parts of the app continue working

### For Developers

- ✅ **Better Error Visibility**: All errors are caught and logged
- ✅ **Component Isolation**: Can isolate errors to specific parts of the app
- ✅ **Debugging Information**: Get React component stack traces
- ✅ **Customizable**: Can adapt error handling to different scenarios
- ✅ **Easy Integration**: Works with existing error tracking services

## What Error Boundaries DO NOT Catch

Error boundaries do not catch errors for:

1. **Event handlers** (use try-catch instead)
2. **Asynchronous code** (setTimeout, promises, etc.)
3. **Server-side rendering**
4. **Errors thrown in the error boundary itself**

For these cases, use traditional try-catch blocks or promise error handling.

## Testing Error Boundaries

See `src/components/ErrorBoundary.example.tsx` for interactive examples demonstrating:

1. Basic error boundary usage
2. Chat error boundary
3. Custom error messages
4. Custom fallback UI
5. Nested error boundaries
6. Real-world integration patterns

## Best Practices

1. **Use Multiple Error Boundaries**

   - Wrap independent sections of your app
   - Prevents one component's error from breaking everything

2. **Customize Error Messages**

   - Make them relevant to the context
   - Provide actionable guidance for users

3. **Log All Errors**

   - Use the `onError` callback
   - Send to your error tracking service
   - Include relevant context

4. **Test Error Scenarios**

   - Verify error boundaries work in development
   - Check that production builds handle errors correctly

5. **Graceful Degradation**
   - Allow other parts of the app to continue working
   - Provide alternative functionality when possible

## Troubleshooting

### Error Boundary Not Catching Errors?

- Error boundaries only catch errors in the component tree below them
- They don't catch errors in event handlers (use try-catch)
- Make sure the error boundary wraps the failing component

### Custom Fallback Not Showing?

- Check that you're passing a valid ReactNode to the `fallback` prop
- Verify the error is actually being caught by the boundary
- Check browser console for error logs

### Error Persists After "Try Again"?

- This is expected for certain types of errors
- Use the "Reload Page" button instead
- Check if the error is in initial component state

## Future Enhancements

Potential improvements to consider:

1. **Error Recovery Strategies**

   - Automatic retry with exponential backoff
   - Partial component re-rendering
   - State reset options

2. **Enhanced Error Reporting**

   - Send errors to analytics service
   - User feedback form on error
   - Error frequency tracking

3. **Conditional Error Boundaries**

   - Different handling for development vs production
   - Environment-specific error messages
   - Feature flag integration

4. **Error Prevention**
   - Input validation at boundary level
   - Prop validation
   - Runtime type checking

## Resources

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Boundary Best Practices](https://react.dev/reference/react/Component#static-getderivedstatefromerror)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)

## Support

For questions or issues with error handling:

1. Check the examples in `ErrorBoundary.example.tsx`
2. Review this documentation
3. Check browser console for error logs
4. Contact the development team

---

**Last Updated**: October 26, 2025
**Version**: 1.0.0
