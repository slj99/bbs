import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

// --- 类型定义 ---
interface AdminUser {
  id: string;
  username: string;
  email: string;
  created_at: number;
  role: 'user' | 'admin';
  level: number;
  credits?: number;
}

// --- 子组件：编辑用户的模态框 ---
const EditUserModal = ({ user, onClose, onUserUpdated }: { user: AdminUser, onClose: () => void, onUserUpdated: () => void }) => {
  const [level, setLevel] = useState(user.level);
  const [credits, setCredits] = useState(user.credits || 0);
  const [role, setRole] = useState(user.role);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      await apiClient.put(`/admin/users/${user.id}`, { level, credits, role });
      toast({ title: "成功", description: "用户信息已更新。" });
      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({ title: "错误", description: `更新失败: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-sm shadow-lg w-full max-w-lg">
        <div className="p-4 border-b font-bold text-gray-700">编辑用户: {user.username}</div>
        <div className="p-6 space-y-4">
          <div><label className="text-sm">用户等级</label><Input type="number" value={level} onChange={e => setLevel(parseInt(e.target.value))} /></div>
          <div><label className="text-sm">积分</label><Input type="number" value={credits} onChange={e => setCredits(parseInt(e.target.value))} /></div>
          <div>
            <label className="text-sm">角色</label>
            <select value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')} className="w-full h-10 px-2 border rounded-sm">
              <option value="user">普通用户</option><option value="admin">管理员</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2"><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={handleSubmit}>提交</Button></div>
      </div>
    </div>
  );
};


// --- 主页面组件 ---
const UsersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState({ username: '', email: '', uid: searchParams.get('uid') || '', });

  const fetchUsers = async () => {
    const params = new URLSearchParams(search).toString();
    const data = await apiClient.get<AdminUser[]>(`/admin/users?${params}`);
    setUsers(data || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = () => fetchUsers();

  const openEditModal = async (user: AdminUser) => {
    const fullUserData = await apiClient.get<AdminUser>(`/admin/users/${user.id}`);
    setEditingUser(fullUserData);
  };

  return (
    <AdminLayout>
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onUserUpdated={fetchUsers} />}
      <h2 className="text-[14px] font-semibold text-gray-700 mb-4 border-b pb-3">用户管理</h2>
      <div className="bg-gray-50 p-2 mb-6 text-sm text-gray-600 border rounded-sm">
        <p>提示：用户名和电子邮箱支持模糊搜索。</p>
      </div>
      <div className="flex space-x-4 mb-4 items-center">
        <Input placeholder="UID" value={search.uid} onChange={e => setSearch({ ...search, uid: e.target.value })} />
        <Input placeholder="用户名包含" value={search.username} onChange={e => setSearch({ ...search, username: e.target.value })} />
        <Input placeholder="电子邮箱" value={search.email} onChange={e => setSearch({ ...search, email: e.target.value })} />
        <Button onClick={handleSearch}>搜索</Button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-100 text-left"><th className="p-2">UID</th><th className="p-2">用户名</th><th className="p-2">电子邮箱</th><th className="p-2">注册时间</th><th className="p-2">角色</th><th className="p-2">操作</th></tr></thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b">
              <td className="p-2">{user.id.substring(0, 8)}...</td>
              <td className="p-2">{user.username}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{format(new Date(user.created_at * 1000), 'yyyy-MM-dd HH:mm')}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2 space-x-2">
                <button onClick={() => openEditModal(user)} className="text-blue-600 hover:underline">编辑</button>
                <Link to={`/admin/content/threads?author=${user.id}`} className="text-blue-600 hover:underline truncate">管理帖子</Link>
                <Link to={`/admin/content/replies?author=${user.id}`} className="text-blue-600 hover:underline truncate">管理回复</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
};

export default UsersPage;
