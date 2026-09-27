import { useEffect, useState } from "react";
import socket from "./socket";

import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import Profile from "./components/Profile";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const [showProfile, setShowProfile] = useState(false);

  // =========================
  // DARK / LIGHT MODE
  // =========================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const toggleTheme = () => {
    setDarkMode((previous) => {
      const next = !previous;
      localStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  // =========================
  // FILE SELECTION
  // =========================

  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // =========================
  // AUTO LOGIN
  // =========================

  useEffect(() => {
    const restoreLogin = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          setAuthLoading(false);
          return;
        }

        const response = await fetch(
          "https://chatbox-djaw.onrender.com/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.user) {
          const savedUser = {
            id: data.user._id || data.user.id,
            name: data.user.name,
            email: data.user.email,
          };

          sessionStorage.setItem(
            "user",
            JSON.stringify(savedUser)
          );

          setUser(savedUser);
        } else {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("Auto login error:", error);

        const savedUser = sessionStorage.getItem("user");

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            sessionStorage.removeItem("user");
          }
        }
      } finally {
        setAuthLoading(false);
      }
    };

    restoreLogin();
  }, []);

  // =========================
  // LOGIN / REGISTER
  // =========================

  const handleAuth = async () => {
    try {
      setMessage("");

      if (!email.trim() || !password.trim()) {
        setMessage("Email and password are required");
        return;
      }

      if (isRegister && !name.trim()) {
        setMessage("Name is required");
        return;
      }

      const endpoint = isRegister
        ? "https://chatbox-djaw.onrender.com/api/auth/register"
        : "https://chatbox-djaw.onrender.com/api/auth/login";

      const body = isRegister
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (isRegister) {
        setMessage(
          "Account created successfully. Please login."
        );

        setName("");
        setEmail("");
        setPassword("");
        setIsRegister(false);
        return;
      }

      const loggedInUser = {
        ...data.user,
        id: data.user._id || data.user.id,
      };

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    }
  };

  // =========================
  // SOCKET CONNECTION
  // =========================

  useEffect(() => {
    if (!user?.id) return;

    const connectSocket = () => {
      socket.emit("joinRoom", user.id);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      connectSocket();
    }

    socket.on("connect", connectSocket);

    return () => {
      socket.off("connect", connectSocket);
    };
  }, [user]);

  // =========================
  // ONLINE USERS
  // =========================

  useEffect(() => {
    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(
        userIds.map((id) => String(id))
      );
    };

    const handleStatusChange = (data) => {
      const userId = String(data.userId);

      setOnlineUsers((previous) => {
        if (data.status === "online") {
          if (previous.includes(userId)) {
            return previous;
          }

          return [...previous, userId];
        }

        return previous.filter((id) => id !== userId);
      });
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userStatusChanged", handleStatusChange);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userStatusChanged", handleStatusChange);
    };
  }, []);

  // =========================
  // GET USERS + SUMMARY
  // =========================

  useEffect(() => {
    if (!user) return;

    const getUsers = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const usersResponse = await fetch(
          "https://chatbox-djaw.onrender.com/api/auth/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const usersData = await usersResponse.json();

        if (!usersResponse.ok) {
          console.log(usersData.message);
          return;
        }

        const summaryResponse = await fetch(
          "https://chatbox-djaw.onrender.com/api/messages/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const summaryData = await summaryResponse.json();
        const summary = summaryData.summary || {};

        const updatedUsers = (usersData.users || []).map(
          (newUser) => {
            const chatSummary = summary[String(newUser._id)];

            return {
              ...newUser,
              lastMessage: chatSummary?.lastMessage || "",
              unreadCount: chatSummary?.unreadCount || 0,
            };
          }
        );

        setUsers(updatedUsers);
      } catch (error) {
        console.error(error);
      }
    };

    getUsers();
  }, [user]);

  // =========================
  // RECEIVE MESSAGE + EDIT + DELETE
  // + READ RECEIPT + REACTIONS
  // =========================

  useEffect(() => {
    const handleReceiveMessage = (incomingMessage) => {
      const senderId =
        incomingMessage.sender?._id ||
        incomingMessage.sender?.id ||
        incomingMessage.sender;

      const receiverId =
        incomingMessage.receiver?._id ||
        incomingMessage.receiver?.id ||
        incomingMessage.receiver;

      const senderIdString = String(senderId);
      const receiverIdString = String(receiverId);

      const otherUserId =
        senderIdString === String(user?.id)
          ? receiverIdString
          : senderIdString;

      const isCurrentChat =
        selectedUser &&
        String(selectedUser._id) === otherUserId;

      const lastMessageText =
        incomingMessage.text ||
        (incomingMessage.fileType?.startsWith("image/")
          ? "📷 Image"
          : incomingMessage.fileName
            ? `📎 ${incomingMessage.fileName}`
            : "");

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === otherUserId
            ? {
                ...contact,
                lastMessage: lastMessageText,
                unreadCount: isCurrentChat
                  ? 0
                  : (contact.unreadCount || 0) + 1,
              }
            : contact
        )
      );

      if (
        selectedUser &&
        (
          receiverIdString === String(selectedUser._id) ||
          senderIdString === String(selectedUser._id)
        )
      ) {
        setMessages((previous) => {
          if (
            previous.some(
              (msg) => msg._id === incomingMessage._id
            )
          ) {
            return previous;
          }

          return [...previous, incomingMessage];
        });

        setTypingUser(null);
      }
    };

    const handleMessageUpdated = (updatedMessage) => {
      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          msg._id === updatedMessage._id
            ? updatedMessage
            : msg
        )
      );

      const senderId =
        updatedMessage.sender?._id ||
        updatedMessage.sender?.id ||
        updatedMessage.sender;

      const receiverId =
        updatedMessage.receiver?._id ||
        updatedMessage.receiver?.id ||
        updatedMessage.receiver;

      const otherUserId =
        String(senderId) === String(user?.id)
          ? receiverId
          : senderId;

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(otherUserId)
            ? {
                ...contact,
                lastMessage: updatedMessage.text,
              }
            : contact
        )
      );
    };

    const handleMessageDeleted = (deletedMessage) => {
      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          msg._id === deletedMessage._id
            ? deletedMessage
            : msg
        )
      );

      const senderId =
        deletedMessage.sender?._id ||
        deletedMessage.sender?.id ||
        deletedMessage.sender;

      const receiverId =
        deletedMessage.receiver?._id ||
        deletedMessage.receiver?.id ||
        deletedMessage.receiver;

      const otherUserId =
        String(senderId) === String(user?.id)
          ? receiverId
          : senderId;

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(otherUserId)
            ? {
                ...contact,
                lastMessage: "This message was deleted",
              }
            : contact
        )
      );
    };

    // READ RECEIPT

    const handleMessagesRead = (data) => {
      const readIds = new Set(
        (data.messageIds || []).map((id) => String(id))
      );

      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          readIds.has(String(msg._id))
            ? { ...msg, read: true }
            : msg
        )
      );
    };

    // REACTION SOCKET EVENT

    const handleReactionUpdated = (data) => {
      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          String(msg._id) === String(data.messageId)
            ? {
                ...msg,
                reactions: data.reactions || [],
              }
            : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("reactionUpdated", handleReactionUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("reactionUpdated", handleReactionUpdated);
    };
  }, [selectedUser, user]);

  // =========================
  // TYPING
  // =========================

  useEffect(() => {
    const handleTyping = (data) => {
      if (
        selectedUser &&
        String(data.sender) === String(selectedUser._id)
      ) {
        setTypingUser(
          data.isTyping ? selectedUser.name : null
        );
      }
    };

    socket.on("userTyping", handleTyping);

    return () => {
      socket.off("userTyping", handleTyping);
    };
  }, [selectedUser]);

  // =========================
  // OPEN CHAT
  // =========================

  const openChat = async (otherUser) => {
    try {
      setSelectedUser(otherUser);
      setTypingUser(null);
      setEditingMessageId(null);
      setEditText("");
      setSelectedFile(null);

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(otherUser._id)
            ? { ...contact, unreadCount: 0 }
            : contact
        )
      );

      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `http://https://chatbox-djaw.onrender.com/api/messages/${otherUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      setMessages(data.messages || []);

      if (data.messages?.length > 0) {
        const latest = data.messages[data.messages.length - 1];

        const lastMessageText =
          latest.deleted
            ? "This message was deleted"
            : latest.text ||
              (latest.fileType?.startsWith("image/")
                ? "📷 Image"
                : latest.fileName
                  ? `📎 ${latest.fileName}`
                  : "");

        setUsers((previousUsers) =>
          previousUsers.map((contact) =>
            String(contact._id) === String(otherUser._id)
              ? {
                  ...contact,
                  lastMessage: lastMessageText,
                  unreadCount: 0,
                }
              : contact
          )
        );
      }

      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // TEXT CHANGE
  // =========================

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!selectedUser) return;

    socket.emit("typing", {
      sender: user.id,
      receiver: selectedUser._id,
      isTyping: value.trim().length > 0,
    });
  };

  // =========================
  // SEND TEXT / IMAGE / FILE
  // =========================

  const sendMessage = async () => {
    if ((!text.trim() && !selectedFile) || !selectedUser) {
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      const formData = new FormData();

      formData.append("receiver", selectedUser._id);
      formData.append("text", text.trim());

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(
        "https://chatbox-djaw.onrender.com/api/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message || "Unable to send message");
        return;
      }

      const newMessage = data.data;

      setMessages((previous) => {
        if (
          previous.some((msg) => msg._id === newMessage._id)
        ) {
          return previous;
        }

        return [...previous, newMessage];
      });

      const lastMessageText =
        newMessage.text ||
        (newMessage.fileType?.startsWith("image/")
          ? "📷 Image"
          : `📎 ${newMessage.fileName || "File"}`);

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(selectedUser._id)
            ? {
                ...contact,
                lastMessage: lastMessageText,
                unreadCount: 0,
              }
            : contact
        )
      );

      socket.emit("sendMessage", {
        message: newMessage,
        receiver: selectedUser._id,
      });

      socket.emit("typing", {
        sender: user.id,
        receiver: selectedUser._id,
        isTyping: false,
      });

      setText("");
      setSelectedFile(null);
      setTypingUser(null);
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);
    }
  };

  // =========================
  // START / CANCEL EDIT
  // =========================

  const startEditMessage = (msg) => {
    if (msg.deleted) return;

    setEditingMessageId(msg._id);
    setEditText(msg.text || "");
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  // =========================
  // SAVE EDIT
  // =========================

  const saveEditMessage = async () => {
    if (!editingMessageId || !editText.trim()) return;

    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `https://chatbox-djaw.onrender.com/api/messages/${editingMessageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: editText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      const updatedMessage = data.data;

      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          msg._id === updatedMessage._id
            ? updatedMessage
            : msg
        )
      );

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(selectedUser?._id)
            ? {
                ...contact,
                lastMessage: updatedMessage.text,
              }
            : contact
        )
      );

      socket.emit("messageUpdated", {
        message: updatedMessage,
        receiver: selectedUser._id,
      });

      setEditingMessageId(null);
      setEditText("");
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // DELETE MESSAGE
  // =========================

  const deleteMessage = async (messageId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `https://chatbox-djaw.onrender.com/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data.message);
        return;
      }

      const deletedMessage = data.data;

      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          msg._id === deletedMessage._id
            ? deletedMessage
            : msg
        )
      );

      setUsers((previousUsers) =>
        previousUsers.map((contact) =>
          String(contact._id) === String(selectedUser?._id)
            ? {
                ...contact,
                lastMessage: "This message was deleted",
              }
            : contact
        )
      );

      socket.emit("messageDeleted", {
        message: deletedMessage,
        receiver: selectedUser._id,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // MESSAGE REACTIONS
  // =========================

  const toggleReaction = async (messageId, emoji) => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `https://chatbox-djaw.onrender.com/api/messages/${messageId}/reactions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emoji }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          data.message || "Unable to update reaction"
        );
        return;
      }

      const updatedReactions =
        data.reactions ||
        data.data?.reactions ||
        [];

      setMessages((previousMessages) =>
        previousMessages.map((msg) =>
          String(msg._id) === String(messageId)
            ? {
                ...msg,
                reactions: updatedReactions,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("REACTION ERROR:", error);
    }
  };

  // =========================
  // ENTER SEND
  // =========================

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  // =========================
  // UPDATE PROFILE
  // =========================

  const handleSaveProfile = async (newName) => {
    const token = sessionStorage.getItem("token");

    const response = await fetch(
      "https://chatbox-djaw.onrender.com/api/auth/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to update profile"
      );
    }

    const updatedUser = {
      ...user,
      ...data.user,
      id: data.user?._id || data.user?.id || user.id,
      name: data.user?.name || newName,
    };

    setUser(updatedUser);

    sessionStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser(null);
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
    setText("");
    setSelectedFile(null);
    setTypingUser(null);
    setOnlineUsers([]);
    setSearch("");
    setEditingMessageId(null);
    setEditText("");
    setShowProfile(false);

    socket.disconnect();
  };

  // =========================
  // FILTER USERS
  // =========================

  const filteredUsers = users.filter(
    (otherUser) =>
      otherUser.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      otherUser.email
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  // =========================
  // AUTH LOADING
  // =========================

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-950" : "bg-slate-100"
        }`}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">💬</div>

          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-slate-700"
            }`}
          >
            Chatbox
          </h1>

          <p
            className={`mt-2 ${
              darkMode ? "text-gray-400" : "text-slate-400"
            }`}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // LOGIN / REGISTER
  // =========================

  if (!user) {
    return (
      <Auth
        isRegister={isRegister}
        setIsRegister={setIsRegister}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleAuth={handleAuth}
        message={message}
        setMessage={setMessage}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // =========================
  // MAIN CHAT
  // =========================

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        darkMode
          ? "bg-gray-950 text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <Sidebar
        user={user}
        logout={logout}
        search={search}
        setSearch={setSearch}
        filteredUsers={filteredUsers}
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        openChat={openChat}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onProfileClick={() => setShowProfile(true)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      <main
        className={`flex-1 flex flex-col min-w-0 ${
          darkMode ? "bg-gray-950" : "bg-slate-100"
        }`}
      >
        {selectedUser ? (
          <>
            <ChatHeader
              selectedUser={selectedUser}
              onlineUsers={onlineUsers}
              setShowSidebar={setShowSidebar}
              darkMode={darkMode}
            />

            <MessageList
              messages={messages}
              user={user}
              editingMessageId={editingMessageId}
              editText={editText}
              setEditText={setEditText}
              saveEditMessage={saveEditMessage}
              cancelEditMessage={cancelEditMessage}
              startEditMessage={startEditMessage}
              deleteMessage={deleteMessage}
              typingUser={typingUser}
              onReact={toggleReaction}
              darkMode={darkMode}
            />

            <MessageInput
              text={text}
              handleTextChange={handleTextChange}
              handleKeyDown={handleKeyDown}
              sendMessage={sendMessage}
              handleFileChange={handleFileChange}
              selectedFile={selectedFile}
              removeSelectedFile={removeSelectedFile}
              darkMode={darkMode}
            />
          </>
        ) : (
          <div
            className={`flex-1 flex items-center justify-center p-6 ${
              darkMode ? "bg-gray-950" : "bg-slate-100"
            }`}
          >
            <div className="text-center">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden mb-6 bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                Open Contacts
              </button>

              <div className="text-7xl mb-5">💬</div>

              <h2
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-slate-700"
                }`}
              >
                Welcome to Chatbox
              </h2>

              <p
                className={`mt-2 ${
                  darkMode ? "text-gray-400" : "text-slate-400"
                }`}
              >
                Select a contact to start chatting
              </p>
            </div>
          </div>
        )}
      </main>

      {showProfile && (
        <Profile
          user={user}
          onClose={() => setShowProfile(false)}
          onSaveProfile={handleSaveProfile}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default App;