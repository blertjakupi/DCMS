import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

const mockUsers = [
  {
    id: 1,
    initials: 'JD',
    name: 'John Doe',
    email: 'john.doe@dentacare.pro',
    role: 'Admin',
    status: 'Active',
    dateJoined: 'Oct 14, 2023',
    avatarBg: 'bg-primary-container text-on-primary-container',
  },
  {
    id: 2,
    initials: 'SJ',
    name: 'Sarah Jenkins',
    email: 's.jenkins@dentacare.pro',
    role: 'Dentist',
    status: 'Active',
    dateJoined: 'Nov 02, 2023',
    avatarBg: 'bg-secondary-container text-on-secondary-container',
  },
  {
    id: 3,
    initials: 'MR',
    name: 'Michael Ross',
    email: 'm.ross@mail.com',
    role: 'Patient',
    status: 'Inactive',
    dateJoined: 'Dec 10, 2022',
    avatarBg: 'bg-surface-variant text-on-surface-variant',
  },
];

const roleBadge = {
  Admin: 'bg-primary-container/20 text-on-primary-container border-primary-container/30',
  Dentist: 'bg-secondary-container/30 text-secondary border-secondary-container/50',
  Receptionist: 'bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30',
  Patient: 'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30',
};

function UserManagement() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const openModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setModalOpen(true);
  };

  const saveRole = () => {
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
    setModalOpen(false);
  };

  return (
    <div className="font-body-base text-body-base text-on-background h-screen overflow-hidden flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">

        {/* Top Bar */}
        <header className="bg-surface fixed top-0 right-0 left-0 md:left-64 h-16 z-10 flex justify-between items-center px-6 shadow-sm border-b border-surface-variant hidden md:flex">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative rounded-full bg-surface-container-low flex items-center px-4 py-2 border border-outline-variant focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline mr-2">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-[15px] text-on-surface w-full placeholder:text-outline p-0 focus:outline-none"
                placeholder="Search patients, dentists, or records..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-highest transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
            </button>
            <button className="p-1 rounded-full hover:bg-surface-container-highest transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[14px] font-semibold">
                {initials}
              </div>
            </button>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-16 pb-24 md:pb-6 bg-background">
          <div className="max-w-[1200px] mx-auto">

            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-[32px] font-bold text-on-surface">User Management</h2>
              <p className="text-[16px] text-on-surface-variant mt-1">Manage staff accounts and role assignments.</p>
            </div>

            {/* Table Card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-outline-variant/20 overflow-hidden flex flex-col">

              {/* Toolbar */}
              <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface">
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg pl-10 pr-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                    placeholder="Search by name or email"
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg px-3 py-2 focus:border-primary outline-none cursor-pointer text-[15px]"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                  >
                    <option value="all">Role: All</option>
                    <option value="admin">Admin</option>
                    <option value="dentist">Dentist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="patient">Patient</option>
                  </select>
                  <select
                    className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg px-3 py-2 focus:border-primary outline-none cursor-pointer text-[15px]"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant text-[12px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-6">User</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Date Joined</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-surface-variant/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${u.avatarBg} flex items-center justify-center text-[13px] font-semibold shrink-0`}>
                              {u.initials}
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-on-surface">{u.name}</div>
                              <div className="text-[12px] text-on-surface-variant">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${roleBadge[u.role] || roleBadge.Patient}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {u.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-surface-variant/30 text-on-surface-variant border border-outline-variant/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[15px] text-on-surface-variant">{u.dateJoined}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openModal(u)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-semibold"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_square</span> Edit Role
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors text-xs font-semibold">
                              <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 px-6 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
                <span className="text-[12px] text-on-surface-variant">Showing {filtered.length} of {users.length} entries</span>
                <div className="flex gap-1">
                  <button className="p-1 rounded border border-outline-variant/50 text-on-surface-variant hover:bg-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <button className="p-1 px-3 rounded bg-primary-container text-on-primary-container text-[13px] font-semibold">1</button>
                  <button className="p-1 rounded border border-outline-variant/50 text-on-surface-variant hover:bg-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Role Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-lg border border-outline-variant/20 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="text-[24px] font-semibold text-on-surface">Edit User Role</h3>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">User</label>
                <div className="text-[16px] text-on-surface-variant p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                  {selectedUser?.name}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-on-surface mb-2">Role Assignment</label>
                <select
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[15px]"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="Patient">Patient</option>
                  <option value="Dentist">Dentist</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-surface border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 rounded-lg border border-outline text-on-surface text-[14px] font-semibold hover:bg-surface-variant/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRole}
                className="px-6 py-2 rounded-lg bg-primary text-on-primary text-[14px] font-semibold hover:bg-[#005049] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;