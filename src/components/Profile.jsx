
import { useState } from "react";

function Profile({ user, onClose, onSaveProfile, darkMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSaveProfile(name.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = `w-full rounded-lg px-4 py-3 ${
    darkMode
      ? "bg-slate-800 text-white border border-slate-700"
      : "bg-slate-50 text-slate-800 border border-slate-200"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-6 ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-800"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Profile</h2>
          <button
            onClick={onClose}
            className={`text-2xl ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-4xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <p className="text-green-500 text-sm mt-3">● Online</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Enter your name"
              />
            ) : (
              <p className={fieldClass}>{user?.name}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Email Address
            </label>
            <p className={`${fieldClass} break-words`}>{user?.email}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setName(user?.name || "");
                  setIsEditing(false);
                  setError("");
                }}
                className={`flex-1 font-semibold py-3 rounded-lg ${
                  darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setName(user?.name || "");
                setIsEditing(true);
                setError("");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;