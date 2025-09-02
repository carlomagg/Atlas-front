# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Atlas WD Frontend

This branch (`Atlasfront`) contains the **frontend code** for the Atlas WD application.  
It is built with **React + TailwindCSS + Vite**.


### 1. Clone the repository
```bash
git clone https://github.com/carlomagg/Atlas-front.git
cd Atlas-front


Install dependencies
npm install

# Setup environment variables
# Create a .env file in the project root and add:
# VITE_API_BASE_URL=http://34.239.228.72/api


Run development server
npm run dev

Build for production
npm run build