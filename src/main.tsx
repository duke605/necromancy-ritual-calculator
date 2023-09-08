import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './components';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// const Counter = () => {
//   const [ n, setN ] = useState(0);

//   return (
//     <div className="counter">
//       <button onMouseEnter={() => setN(n => n - 1)}>-</button>
//       <span>{n}</span>
//       <button onMouseEnter={() => setN(n => n + 1)}>+</button>
//     </div>
//   );
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
