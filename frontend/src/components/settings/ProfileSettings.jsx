// src/components/settings/ProfileSettings.jsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Adjust path if needed
import axiosInstance from '../../api/axiosInstance'; // Adjust path if needed
import { toast } from 'react-toastify'; // Optional: for feedback

function ProfileSettings() {
    const { user, setUser } = useAuth(); // Get user and setter from context
    const [name, setName] = useState(user?.name || '');
    const [isNameLoading, setIsNameLoading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // Handle Name Update
    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || name.trim() === user?.name) return; // No change or empty

        setIsNameLoading(true);
        try {
            // --- Assumes backend endpoint: PUT /api/users/profile ---
            const response = await axiosInstance.put('/users/profile', { name: name.trim() });
            setUser({ ...user, name: response.data.name }); // Update context state
            toast.success("Name updated successfully!"); // Optional feedback
        } catch (error) {
            console.error("Error updating name:", error);
            toast.error(error.response?.data?.message || "Failed to update name.");
        } finally {
            setIsNameLoading(false);
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
             toast.error("Please fill in all password fields.");
             return;
         }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) { // Example minimum length
             toast.error("New password must be at least 6 characters long.");
             return;
         }


        setIsPasswordLoading(true);
        try {
            // --- Assumes backend endpoint: PUT /api/users/password ---
            await axiosInstance.put('/users/password', { currentPassword, newPassword });
            toast.success("Password updated successfully!");
            // Clear fields after success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error("Error updating password:", error);
            toast.error(error.response?.data?.message || "Failed to update password. Check current password.");
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Section 1: Basic Info */}
            <section className="pt-2">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Personal Information</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and update your display name.</p>
                <form onSubmit={handleNameSubmit} className="mt-6 space-y-4">
                     {/* Email (Read-only) */}
                     <div>
                        <label className="form-label">Email</label>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">{user?.email}</p>
                    </div>
                     {/* Name */}
                    <div>
                        <label htmlFor="profile-name" className="form-label">Display Name</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="text"
                                id="profile-name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field flex-grow"
                                required
                             />
                            <button type="submit" className="btn btn-primary flex-shrink-0" disabled={isNameLoading || name.trim() === user?.name}>
                                {isNameLoading ? 'Saving...' : 'Save Name'}
                            </button>
                        </div>
                    </div>
                </form>
            </section>

             {/* Section 2: Change Password */}
            <section className="pt-8">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Change Password</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your login password.</p>
                 <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="current-password" className="form-label">Current Password</label>
                        <input type="password" id="current-password" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" required autoComplete="current-password" />
                     </div>
                     <div>
                         <label htmlFor="new-password" className="form-label">New Password</label>
                         <input type="password" id="new-password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required autoComplete="new-password" />
                     </div>
                     <div>
                         <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
                        <input type="password" id="confirm-password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required autoComplete="new-password" />
                     </div>
                    <div className="pt-2">
                        <button type="submit" className="btn btn-primary" disabled={isPasswordLoading}>
                            {isPasswordLoading ? 'Updating...' : 'Update Password'}
                         </button>
                    </div>
                 </form>
             </section>
        </div>
    );
}

 export default ProfileSettings;