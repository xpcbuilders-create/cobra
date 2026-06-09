import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    fetch("/api/profile", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setUser);
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-5">
        My Profile
      </h1>

      <div className="border rounded-lg p-5">
        <img
          src={
            user.avatar ||
            "https://ui-avatars.com/api/?name=" +
              user.name
          }
          className="w-24 h-24 rounded-full"
        />

        <p className="mt-4">
          <b>Name:</b> {user.name}
        </p>

        <p>
          <b>Email:</b> {user.email}
        </p>
      </div>
    </div>
  );
}