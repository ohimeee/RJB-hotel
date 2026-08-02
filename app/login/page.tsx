"use client";

import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded-lg border p-8 shadow">

        <h1 className="mb-6 text-2xl font-bold">
          Staff Login
        </h1>

        <input
          className="mb-4 w-full rounded border p-2"
          placeholder="Username"
        />

        <input
          type="password"
          className="mb-6 w-full rounded border p-2"
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
          className="w-full rounded bg-blue-600 p-2 text-white"
        >
          Login
        </button>

      </div>
    </div>
  );
}

export default LoginPage;