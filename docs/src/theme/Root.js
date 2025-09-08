import React, { useEffect } from 'react';
import BuyButton from '../components/BuyButton';

export default function Root({ children }) {
  useEffect(() => {
    const container = document.getElementById('buy-button-container');
    if (container) {
      import('react-dom').then(ReactDOM => {
        ReactDOM.render(<BuyButton />, container);
      });
    }
  }, []);

  return <>{children}</>;
}