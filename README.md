EVENT CALENDAR - SETUP INSTRUCTIONS
====================================

Follow these steps to run the Event Calendar application:

PREREQUISITES:
- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)

STEP-BY-STEP SETUP:

1. EXTRACT THE FILES
   - Extract all files from the zip to your desired folder
   - Open terminal/command prompt in the project folder

2. INSTALL DEPENDENCIES
   Run this command in your terminal:
   npm install

   This will install all required packages including:
   - React and React DOM
   - Tailwind CSS
   - Lucide React (for icons)
   - All development dependencies

3. START THE APPLICATION
   Run this command:
   npm start

   The application will:
   - Start a development server
   - Open automatically in your browser at http://localhost:3000
   - Enable hot-reload for development

4. BUILD FOR PRODUCTION (Optional)
   To create a production build:
   npm run build

TROUBLESHOOTING:

If you encounter any issues:

1. Make sure Node.js is installed:
   node --version
   npm --version

2. Clear npm cache if needed:
   npm cache clean --force

3. Delete node_modules and reinstall:
   rm -rf node_modules
   npm install

4. Check that all files were extracted properly

FEATURES YOU CAN USE:
- Click on dates to add events
- Drag and drop events between dates
- Search for events using the search bar
- Set up recurring events
- Choose different colors for events
- Edit or delete existing events

The application automatically saves your data to browser's localStorage.

For more detailed information, see README.md

Happy event planning! 🗓️<img width="1920" height="1080" alt="Screenshot (16)" src="https://github.com/user-attachments/assets/5b143221-73e7-4e99-aaff-fdcfed35e8e5" />
