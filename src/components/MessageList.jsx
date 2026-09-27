
function MessageList({
  messages = [],
  user,
  editingMessageId,
  editText,
  setEditText,
  saveEditMessage,
  cancelEditMessage,
  startEditMessage,
  deleteMessage,
  typingUser,
  onReact,
}) {
  const FILE_BASE_URL = "http://localhost:5000";

  const EMOJIS = ["❤️", "😂", "😍", "😮", "😢", "👍"];

  // User ID ko string format mein convert karta hai
  const getUserId = (reactionUser) => {
    if (!reactionUser) return "";

    if (typeof reactionUser === "object") {
      return String(
        reactionUser._id ||
          reactionUser.id ||
          reactionUser.userId ||
          reactionUser.user_id ||
          ""
      );
    }

    return String(reactionUser);
  };

  // Reaction data ko normalize karta hai
  const normalizeReaction = (reaction) => {
    if (!reaction) return null;

    const emoji = reaction.emoji || reaction.reaction;

    const reactionUser =
      reaction.user ||
      reaction.userId ||
      reaction.user_id ||
      reaction.user;

    if (!emoji) return null;

    return {
      emoji,
      userId: getUserId(reactionUser),
    };
  };

  const getNormalizedReactions = (reactions) => {
    if (!Array.isArray(reactions)) return [];

    return reactions
      .map(normalizeReaction)
      .filter(Boolean);
  };

  const getReactionCount = (reactions, emoji) => {
    return getNormalizedReactions(reactions).filter(
      (reaction) => reaction.emoji === emoji
    ).length;
  };

  const hasReacted = (reactions, emoji) => {
    const myId = String(user?._id || user?.id || "");

    if (!myId) return false;

    return getNormalizedReactions(reactions).some(
      (reaction) =>
        reaction.emoji === emoji && reaction.userId === myId
    );
  };

  const getSenderId = (msg) => {
    const sender =
      msg.senderId || msg.sender?._id || msg.sender?.id || msg.sender;

    return getUserId(sender);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="text-5xl mb-3">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const senderId = getSenderId(msg);
          const myId = String(user?._id || user?.id || "");

          const isMine =
            senderId !== "" && myId !== "" && senderId === myId;

          const fileUrl = msg.fileUrl
            ? msg.fileUrl.startsWith("http")
              ? msg.fileUrl
              : `${FILE_BASE_URL}${msg.fileUrl}`
            : null;

          const isImage =
            msg.fileType?.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
              msg.fileName || ""
            );

          const reactions = msg.reactions || [];

          return (
            <div
              key={msg._id || `${senderId}-${msg.createdAt}-${index}`}
              className={`flex w-full ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[80%] md:max-w-md">
                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {editingMessageId === msg._id ? (
                    <div className="min-w-[220px]">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEditMessage();
                          }

                          if (e.key === "Escape") {
                            cancelEditMessage();
                          }
                        }}
                        autoFocus
                        className="w-full bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={saveEditMessage}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEditMessage}
                          className="bg-slate-500 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image preview */}
                      {!msg.deleted && fileUrl && isImage && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block mb-2"
                        >
                          <img
                            src={fileUrl}
                            alt={msg.fileName || "Shared image"}
                            className="max-w-full max-h-[300px] rounded-xl object-contain"
                            style={{ minWidth: "100px" }}
                          />
                        </a>
                      )}

                      {/* File download */}
                      {!msg.deleted && fileUrl && !isImage && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={msg.fileName || true}
                          className={`flex items-center gap-3 p-3 mb-2 rounded-xl border ${
                            isMine
                              ? "border-blue-400 bg-blue-500 hover:bg-blue-400"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-3xl">📎</span>

                          <div className="min-w-0">
                            <p className="text-sm font-medium break-all">
                              {msg.fileName || "Download file"}
                            </p>

                            <p className="text-xs opacity-70">
                              {msg.fileSize
                                ? `${(msg.fileSize / 1024).toFixed(1)} KB`
                                : "Attachment"}
                            </p>
                          </div>

                          <span className="text-lg">⬇️</span>
                        </a>
                      )}

                      {/* Message text */}
                      {msg.text && (
                        <p
                          className={`text-sm break-words ${
                            msg.deleted ? "italic opacity-70" : ""
                          }`}
                        >
                          {msg.text}
                        </p>
                      )}

                      {!msg.deleted && msg.edited && (
                        <span
                          className={`text-[10px] ${
                            isMine ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          edited
                        </span>
                      )}

                      {/* Time, read receipts, edit and delete */}
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p
                          className={`text-xs ${
                            isMine ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </p>

                        <div className="flex items-center gap-2">
                          {isMine && !msg.deleted && (
                            <>
                              <span
                                className={`text-xs ${
                                  msg.read
                                    ? "text-cyan-300"
                                    : "text-blue-100"
                                }`}
                                title={msg.read ? "Seen" : "Sent"}
                              >
                                {msg.read ? "✓✓" : "✓"}
                              </span>

                              <button
                                onClick={() => startEditMessage(msg)}
                                className="text-xs text-blue-100 hover:text-white"
                                title="Edit message"
                              >
                                ✏️
                              </button>

                              <button
                                onClick={() => deleteMessage(msg._id)}
                                className="text-xs text-red-200 hover:text-red-100"
                                title="Delete message"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Emoji reactions */}
                {!msg.deleted && editingMessageId !== msg._id && (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {EMOJIS.map((emoji) => {
                        const count = getReactionCount(reactions, emoji);
                        const active = hasReacted(reactions, emoji);

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              if (onReact && msg._id) {
                                onReact(msg._id, emoji);
                              }
                            }}
                            title={`React with ${emoji}`}
                            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
                              active
                                ? "bg-blue-100 border-blue-400 text-blue-800"
                                : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex justify-start">
          <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
            <p className="text-sm text-slate-500 italic">
              {typingUser} is typing...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;