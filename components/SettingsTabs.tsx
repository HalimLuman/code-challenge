'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  Download, 
  Lock, 
  Eye, 
  MapPin, 
  Globe, 
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Profile {
  username?: string
  bio?: string
  location?: string
  website?: string
  visibility?: string
  avatar_url?: string
}

interface Props {
  profile: Profile
  userEmail: string
  userId: string
}

type Tab = 'profile' | 'privacy' | 'security' | 'notifications' | 'account'

export default function SettingsTabs({ profile, userEmail, userId }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('profile')
  const [isPending, startTransition] = useTransition()

  // Profile tab state
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')

  // Privacy tab
  const [visibility, setVisibility] = useState(profile.visibility ?? 'public')

  // Security tab
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Account tab — deletion
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Trash2 },
  ]

  async function saveProfile() {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, bio, location, website }),
    })
    if (res.ok) {
      toast.success('Profile updated')
      startTransition(() => router.refresh())
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to update profile')
    }
  }

  async function savePrivacy() {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility }),
    })
    if (res.ok) {
      toast.success('Privacy settings saved')
    } else {
      toast.error('Failed to save privacy settings')
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function signOutOthers() {
    const res = await fetch('/api/auth/sessions?scope=others', { method: 'DELETE' })
    if (res.ok) toast.success('Signed out of all other devices')
    else toast.error('Failed to sign out other sessions')
  }

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: deleteConfirm }),
    })
    setDeleting(false)

    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to delete account')
    }
  }

  async function exportData() {
    const res = await fetch('/api/data-export')
    if (!res.ok) { toast.error('Export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-data.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <nav className="flex md:flex-col gap-1 p-1 bg-gray-100 rounded-2xl md:bg-transparent md:">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap md:whitespace-normal ${
                tab === t.id
                  ? 'bg-white text-indigo-600 shadow-sm md:shadow-md md:shadow-indigo-500/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 '
              }`}
            >
              <t.icon className={`w-4 h-4 ${tab === t.id ? 'text-indigo-600 ' : 'text-gray-400'}`} />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {tab === 'profile' && (
          <div className="glass-card rounded-[2rem] p-8 space-y-8 animate-in">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 ">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 ">Profile Information</h3>
                <p className="text-sm text-gray-500 ">Update your personal details and how others see you.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Username</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none text-sm font-medium">@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={userEmail}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                  Bio 
                  <span className={bio.length > 250 ? 'text-amber-500' : ''}>{bio.length}/280</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Location</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Website</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    type="url"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={isPending}
                className="flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-8 py-3 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="glass-card rounded-[2rem] p-8 space-y-8 animate-in">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 ">
                <Eye className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 ">Privacy Settings</h3>
                <p className="text-sm text-gray-500 ">Control who can see your profile and activity.</p>
              </div>
            </div>

            <div className="space-y-4">
              {(['public', 'connections', 'private'] as const).map((v) => (
                <label
                  key={v}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    visibility === v 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/5' 
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50/30 '
                  }`}
                >
                  <div className="mt-1 relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={visibility === v}
                      onChange={() => setVisibility(v)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${visibility === v ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 '}`}>
                      {visibility === v && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize text-gray-900 mb-1">
                      {v === 'connections' ? 'Connections only' : v}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {v === 'public' && 'Your profile, interests, and shared connections are visible to everyone on the platform.'}
                      {v === 'connections' && 'Only people you have established a connection with can view your full profile and interests.'}
                      {v === 'private' && 'Your profile is completely hidden from discovery. Only you can see your information.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={savePrivacy}
                className="flex items-center gap-2 bg-emerald-600 text-white rounded-2xl px-8 py-3 text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                Apply Privacy Settings
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-6 animate-in">
            <div className="glass-card rounded-[2rem] p-8 space-y-8">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 ">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 ">Security & Password</h3>
                  <p className="text-sm text-gray-500 ">Keep your account secure by updating your password regularly.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={changePassword}
                  disabled={!newPassword || newPassword.length < 8}
                  className="flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-8 py-3 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 ">Active Sessions</h4>
                  <p className="text-xs text-gray-500">Sign out of all other devices for security.</p>
                </div>
              </div>
              <button
                onClick={signOutOthers}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Sign out others
              </button>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="glass-card rounded-[2rem] p-8 space-y-8 animate-in text-center py-20">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 ">Notification Center</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We're currently refining our notification system. Soon you'll be able to customize exactly what alerts you receive.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              Coming Soon
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-6 animate-in">
            <div className="glass-card rounded-[2rem] p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Download className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 ">Export Your Data</h3>
                  <p className="text-sm text-gray-500 ">Download a complete copy of your personal data as a JSON file.</p>
                </div>
                <button
                  onClick={exportData}
                  className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                >
                  Export Data
                </button>
              </div>
            </div>

            <div className="bg-red-50/30 border-2 border-red-100 rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                  <Trash2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700 ">Danger Zone</h3>
                  <p className="text-sm text-red-600/70 ">Deleting your account is permanent and cannot be undone.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-red-100 ">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                  Delete My Account Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full space-y-6 shadow-2xl border border-gray-100 ">
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-gray-500 ">
                This action will delete all your data, interests, and connections. Type <strong>{profile.username}</strong> below to confirm.
              </p>
            </div>
            
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={profile.username}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-center font-bold"
            />
            
            <div className="flex gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                className="flex-1 px-4 py-3 border-2 border-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== profile.username || deleting}
                className="flex-1 bg-red-600 text-white rounded-2xl py-3 text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
