/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'material-blue': {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        'material-green': {
          50: '#e8f5e9',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
        },
        'material-red': {
          50: '#ffebee',
          500: '#f44336',
          600: '#e53935',
        },
        'material-orange': {
          50: '#fff3e0',
          500: '#ff9800',
          600: '#fb8c00',
        },
        'material-purple': {
          50: '#f3e5f5',
          500: '#9c27b0',
          600: '#8e24aa',
          700: '#7b1fa2',
        },
        'material-gray': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
  plugins: [],
}