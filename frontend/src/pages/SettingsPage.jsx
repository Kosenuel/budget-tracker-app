// src/pages/SettingsPage.jsx
import React from 'react';
import { Tab } from '@headlessui/react';
import { UserCircleIcon, Cog8ToothIcon, ListBulletIcon, CircleStackIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAccountScope } from '../contexts/AccountScopeContext';

// Import the new section components (we will create these next)
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import CategorySettings from '../components/settings/CategorySettings'; // Assuming previous logic moved here
import DataSettings from '../components/settings/DataSettings';
import AboutSettings from '../components/settings/AboutSettings';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SettingsPage() {
  const { refreshAccounts } = useAccountScope();

  const tabs = [
    { name: 'Profile', icon: UserCircleIcon, component: ProfileSettings },
    { name: 'Preferences', icon: Cog8ToothIcon, component: PreferencesSettings },
    { name: 'Categories', icon: ListBulletIcon, component: CategorySettings },
    { name: 'Data', icon: CircleStackIcon, component: () => <DataSettings refreshAccounts={refreshAccounts} /> },
    { name: 'About', icon: InformationCircleIcon, component: AboutSettings },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <Tab.Group vertical> {/* Use vertical tabs for sidebar-like layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tab List (Sidebar) */}
          <div className="md:col-span-1">
            <Tab.List className="flex flex-col space-y-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-md py-2.5 px-3 text-sm font-medium leading-5 text-left flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-light dark:focus:ring-offset-gray-900 focus:ring-white focus:ring-opacity-60',
                      selected
                        ? 'bg-primary text-white shadow'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white'
                    )
                  }
                >
                  <tab.icon className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
          </div>

          {/* Tab Panels (Main Content Area) */}
          <div className="md:col-span-3">
            <Tab.Panels className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 min-h-[300px]"> {/* Added padding & min-height */}
              {tabs.map((tab, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'focus:outline-none',
                    // 'rounded-xl bg-white dark:bg-gray-800 p-3', // Basic padding if needed
                    // 'focus:ring-2 focus:ring-white focus:ring-opacity-60'
                  )}
                >
                   {/* Render the specific settings component */}
                   {<tab.component />}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </div>
        </div>
      </Tab.Group>
    </div>
  );
}

export default SettingsPage;