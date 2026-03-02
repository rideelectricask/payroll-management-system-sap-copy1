import React from 'react';
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border border-red-200">
          <CardBody className="text-center py-10">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <Typography variant="h6" color="red" className="mb-2">
              Something went wrong
            </Typography>
            <Typography variant="small" color="gray" className="mb-4">
              An error occurred while rendering this component.
            </Typography>
            <Button
              size="sm"
              color="red"
              variant="outlined"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack ? 
                    this.state.errorInfo.componentStack : 
                    'No component stack available'
                  }
                </pre>
              </details>
            )}
          </CardBody>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;