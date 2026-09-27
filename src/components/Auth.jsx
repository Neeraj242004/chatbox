
function Auth({
  isRegister,
  setIsRegister,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  handleAuth,
  message,
  setMessage,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💬</div>
          <h1 className="text-3xl font-bold text-slate-800">
            Chatbox
          </h1>
          <p className="text-slate-500 mt-2">
            Real-time messaging
          </p>
        </div>

        <h2 className="text-xl font-semibold text-slate-700 mb-5">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAuth();
          }}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          {isRegister ? "Create Account" : "Login"}
        </button>

        {message && (
          <p className="text-center mt-4 text-sm text-slate-600">
            {message}
          </p>
        )}

        <div className="text-center mt-6">
          <span className="text-slate-500 text-sm">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>

          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
              setName("");
              setEmail("");
              setPassword("");
            }}
            className="ml-2 text-blue-600 font-semibold hover:underline"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;