// src/components/settings/AboutSettings.jsx
import React from 'react';
// Import package.json needs special vite config or importing it directly might not work in prod build.
// For now, hardcode or fetch from a backend endpoint if needed.
// import packageJson from '../../../../package.json'; // Be careful with pathing

function AboutSettings() {
    const appVersion = '1.0.0'; // Placeholder - Get from env or build process ideally

    return (
        <div className="space-y-6 pt-2">
             <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">About BudgetApp</h3>

            <div>
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                     Version: <span className="font-medium">{appVersion}</span>
                 </p>
             </div>

            <div>
                 <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-2">Useful Links</h4>
                <ul className="space-y-2">
                     <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Privacy Policy</a></li>
                    <li><a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Terms of Service</a></li>
                    {/* Add Help/Support links */}
                 </ul>
             </div>

             <div className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t dark:border-gray-700">
                 © {new Date().getFullYear()} Kosenuel Budget Tracker App. All rights reserved.
             </div>
         </div>
    );
}

 export default AboutSettings;