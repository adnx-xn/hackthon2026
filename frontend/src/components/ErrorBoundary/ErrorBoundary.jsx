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
          <div className="bg-[rgba(0,0,0,0.8)] p-[20px] rounded-[8px] text-white text-center border border-[#ff4444] font-sans w-[250px]">
            <h4 className="text-[#ff4444] m-[0_0_10px_0]">Scientific layer failed.</h4>
            <button 
              onClick={this.handleReset}
              className="bg-[#333] text-white border border-[#666] py-[8px] px-[16px] rounded-[4px] cursor-pointer"
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
