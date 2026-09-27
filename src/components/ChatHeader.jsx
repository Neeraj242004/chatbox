
function ChatHeader({ selectedUser, onlineUsers, setShowSidebar, darkMode }) {
  const isOnline = onlineUsers.includes(String(selectedUser?._id));

  return (
    <header className={`border-b px-4 md:px-6 py-4 ${
      darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
    }`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSidebar(true)}
          className={`md:hidden w-10 h-10 rounded-lg text-xl ${
            darkMode ? "hover:bg-slate-800 text-white" : "hover:bg-slate-100"
          }`}
        >
          ☰
        </button>

        <div className="relative">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
            darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
          }`}>
            {selectedUser?.name?.charAt(0).toUpperCase()}
          </div>
          {isOnline && (
            <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full ${
              darkMode ? "border-slate-900" : "border-white"
            }`} />
          )}
        </div>

        <div className="min-w-0">
          <h2 className={`font-semibold truncate ${
            darkMode ? "text-white" : "text-slate-800"
          }`}>
            {selectedUser?.name}
          </h2>
          <p className={`text-xs ${isOnline ? "text-green-500" : "text-slate-400"}`}>
            {isOnline ? "● Online" : "● Offline"}
          </p>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;