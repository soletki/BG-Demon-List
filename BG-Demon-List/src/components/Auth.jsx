import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";

export default function Auth() {
  return (
    <div className="p-4">
      {auth.currentUser ? (
        <button className="bg-red-500 text-white px-4 py-2" onClick={() => signOut(auth)}>Logout</button>
      ) : (
        <button className="bg-blue-500 text-white px-4 py-2" onClick={() => signInWithPopup(auth, googleProvider)}>Login with Google</button>
      )}
    </div>
  );
}
