
function Sidebar({
  user,
  logout,
  search,
  setSearch,
  filteredUsers,
  onlineUsers,
  selectedUser,
  openChat,
  showSidebar,
  setShowSidebar,
  onProfileClick,
  darkMode,
  onToggleTheme,
}) {
  return (
    <>
      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-80 border-r flex flex-col transition-transform duration-300 ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-white"
            : "bg-white border-slate-200 text-slate-800"
        } ${
          showSidebar
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className={`p-5 border-b ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <button onClick={onProfileClick} className="flex items-center gap-3 text-left min-w-0">
              <div className="w-11 h-11 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold truncate">{user.name}</h2>
                <p className="text-xs text-green-500">● Online</p>
                <p className="text-xs text-blue-500">View Profile</p>
              </div>
            </button>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-400">
              Logout
            </button>
          </div>
        </div>

        <div className={`p-4 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
          <button
            onClick={onToggleTheme}
            className={`w-full mb-4 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              darkMode
                ? "bg-slate-800 hover:bg-slate-700 text-yellow-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode ? "bg-slate-800 text-white placeholder-slate-400" : "bg-slate-100 text-slate-800"
              }`}
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Contacts</h3>

          {filteredUsers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center mt-8">
              {search ? "No contacts found." : "No other users found."}
            </p>
          ) : (
            filteredUsers.map((otherUser) => {
              const isOnline = onlineUsers.includes(String(otherUser._id));
              const isSelected = String(selectedUser?._id) === String(otherUser._id);

              return (
                <button
                  key={otherUser._id}
                  onClick={() => openChat(otherUser)}
                  className={`w-full text-left p-3 rounded-xl mb-2 transition ${
                    isSelected
                      ? darkMode
                        ? "bg-blue-900/50 border border-blue-700"
                        : "bg-blue-50 border border-blue-200"
                      : darkMode
                        ? "hover:bg-slate-800"
                        : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-600"
                      }`}>
                        {otherUser.name?.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full ${darkMode ? "border-slate-900" : "border-white"}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold truncate ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {otherUser.name}
                        </p>
                        {otherUser.unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {otherUser.unreadCount > 99 ? "99+" : otherUser.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-1 ${
                        otherUser.unreadCount > 0
                          ? darkMode ? "text-slate-200 font-semibold" : "text-slate-700 font-semibold"
                          : "text-slate-400"
                      }`}>
                        {otherUser.lastMessage || (isOnline ? "● Online" : "● Offline")}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
        />
      )}
    </>
  );
}

export default Sidebar;