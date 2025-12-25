import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Camera, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  db,
  doc,
  updateDoc,
  deleteDoc,
  auth,
  updateProfile,
  deleteUser
} from '../services/firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void; // Trigger logout if account deleted
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdate, onLogout }) => {
  const [username, setUsername] = useState(user.username);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(user.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(user.username);
      setPhotoPreview(user.avatar);
      setPhotoFile(null);
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let newPhotoURL = user.avatar;

      // 1. Upload new photo if exists
      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${user.id}`);
        await uploadBytes(storageRef, photoFile);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      // 2. Update Firestore
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        username: username,
        photoURL: newPhotoURL
      });

      // 3. Update Auth Profile (optional, but good for sync)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username,
          photoURL: newPhotoURL
        });
      }

      // 4. Update Local State
      onUpdate({
        ...user,
        username,
        avatar: newPhotoURL || undefined
      });

      onClose();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setErrorMsg("Failed to update profile. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone and will delete your account and all data.")) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Delete Firestore User Document
      await deleteDoc(doc(db, "users", user.id));
      
      // 2. Delete Auth User
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      
      onLogout(); // Redirect to auth screen
    } catch (err: any) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg("For security, please logout and login again to delete your account.");
      } else {
        setErrorMsg("Failed to delete account. " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="glass border-white/10 rounded-[32px] w-full max-w-md shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Photo Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                 {photoPreview ? (
                   <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-xl" />
                 ) : (
                   <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-900">
                      <UserIcon size={32} className="text-slate-500" />
                   </div>
                 )}
                 <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-500 transition-colors shadow-lg">
                   <Camera size={16} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                 </label>
              </div>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
              />
            </div>

            {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};