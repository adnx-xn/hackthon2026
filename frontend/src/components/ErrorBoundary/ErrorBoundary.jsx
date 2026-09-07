import React from 'react';
import { Html } from '@react-three/drei';
import { useAppDispatch } from '../../context/AppContext';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Scientific rendering error caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            border: '1px solid #ff4444',
            fontFamily: 'sans-serif',
            width: '250px'
          }}>
            <h4 style={{ color: '#ff4444', margin: '0 0 10px 0' }}>Scientific layer failed.</h4>
            <button 
              onClick={this.handleReset}
              style={{
                background: '#333',
                color: 'white',
                border: '1px solid #666',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Return to None
            </button>
          </div>
        </Html>
      );
    }

    return this.props.children; 
  }
}

export default function ErrorBoundary({ children }) {
  const dispatch = useAppDispatch();
  return (
    <ErrorBoundaryInner onReset={() => dispatch({ type: 'SET_PRIMARY_VIEW', payload: 'None' })}>
      {children}
    </ErrorBoundaryInner>
  );
}
