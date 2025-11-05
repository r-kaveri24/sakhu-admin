"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("/default-avatar.jpg");
  const [firstName, setFirstName] = useState("Rahul");
  const [lastName, setLastName] = useState("Sharma");
  const [email, setEmail] = useState("Rahul@123gmail.com");
  const [mobile, setMobile] = useState("9988776655");
  const [bio, setBio] = useState("Admin");
  const [position, setPosition] = useState("Admin");
  const [location, setLocation] = useState("Chh. Sambhajinagar, Maharashtra, India");
  const [country, setCountry] = useState("India");
  const [cityState, setCityState] = useState("Ch. Sambhajinagar, Maharashtra");
  const [pinCode, setPinCode] = useState("123403");
  const [userId, setUserId] = useState<string>("user_1"); // Default user ID
  
  // Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load profile data from localStorage (fallback) or API
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Try to load from localStorage first as fallback
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setFirstName(profile.firstName || "Rahul");
        setLastName(profile.lastName || "Sharma");
        setEmail(profile.email || "Rahul@123gmail.com");
        setMobile(profile.mobile || "9988776655");
        setBio(profile.bio || "Admin");
        setPosition(profile.position || "Admin");
        setLocation(profile.location || "Chh. Sambhajinagar, Maharashtra, India");
        setCountry(profile.country || "India");
        setCityState(profile.cityState || "Ch. Sambhajinagar, Maharashtra");
        setPinCode(profile.pinCode || "123403");
        setProfilePhoto(profile.profilePhoto || "/default-avatar.jpg");
      }

      // Try to fetch from database API
      /* Uncomment when database is connected
      const response = await fetch(`/api/profile?id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setMobile(data.mobile || "");
        setBio(data.bio || "");
        setPosition(data.position || "");
        setLocation(data.location || "");
        setCountry(data.country || "");
        setCityState(data.cityState || "");
        setPinCode(data.pinCode || "");
        setProfilePhoto(data.profilePhoto || "/default-avatar.jpg");
      }
      */
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage as fallback
      const profileData = {
        firstName,
        lastName,
        email,
        mobile,
        bio,
        position,
        location,
        country,
        cityState,
        pinCode,
        profilePhoto,
      };
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      // Save to database API
      /* Uncomment when database is connected
      const formData = new FormData();
      formData.append('id', userId);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('mobile', mobile);
      formData.append('bio', bio);
      formData.append('position', position);
      formData.append('location', location);
      formData.append('country', country);
      formData.append('cityState', cityState);
      formData.append('pinCode', pinCode);
      
      // Convert base64 to file if photo was changed
      if (profilePhoto && profilePhoto.startsWith('data:')) {
        const response = await fetch(profilePhoto);
        const blob = await response.blob();
        formData.append('profilePhoto', blob, 'profile.jpg');
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }
      */

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }
    
    setLoading(true);
    try {
      // Call password change API
      /* Uncomment when database is connected
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      */

      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl h-full mx-auto bg-white shadow border p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="border border-gray-300 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23e5e7eb' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='24' font-family='Arial'%3E👤%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#2E3192] text-white rounded-full p-1 hover:bg-[#2E3192]/90"
                  title="Change Photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={`${firstName} ${lastName}`}
                    onChange={(e) => {
                      const names = e.target.value.split(' ');
                      setFirstName(names[0] || '');
                      setLastName(names.slice(1).join(' ') || '');
                    }}
                    className="text-lg font-semibold border border-gray-300 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 block"
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 block"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">{firstName} {lastName}</h2>
                  <p className="text-sm text-gray-600">{position}</p>
                  <p className="text-sm text-gray-500">{location}</p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mobile No</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{mobile}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Bio</label>
              {isEditing ? (
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Country</label>
              {isEditing ? (
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{country}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">City/State</label>
              {isEditing ? (
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{cityState}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pin Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900">{pinCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">Change Password</p>
                <p className="text-xs text-gray-500">Update your password to keep your account secure</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="px-4 py-2 text-sm text-[#2E3192] border border-[#2E3192] rounded-md hover:bg-[#2E3192]/10"
              >
                {showPasswordSection ? "Cancel" : "Change"}
              </button>
            </div>

            {showPasswordSection && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="px-6 py-2 bg-[#804499] text-white text-sm rounded-md hover:bg-[#804499]/90"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel button when editing */}
      {isEditing && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-6 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
