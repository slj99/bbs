import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';

interface UserGroupPermissions {
    level_id: number;
    can_visit: boolean;
    can_view_ip: boolean;
    can_post_thread: boolean;
    can_post_reply: boolean;
    can_send_message: boolean;
    daily_message_limit: number;
    can_start_poll: boolean;
    can_vote_poll: boolean;
}

const PermissionRow = ({ label, description, children }: { label: string, description?: string, children: React.ReactNode }) => (
    <tr className="border-b border-gray-200">
        <td className="px-4 py-3 text-sm text-gray-800 font-semibold w-48">{label}</td>
        <td className="px-4 py-3">{children}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{description}</td>
    </tr>
);

const RadioPermission = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => (
    <RadioGroup value={String(value)} onValueChange={(val) => onValueChange(val === 'true')} className="flex space-x-4">
        <div className="flex items-center space-x-2"><RadioGroupItem value="true" id={`r-true`}/><Label htmlFor="r-true">开启</Label></div>
        <div className="flex items-center space-x-2"><RadioGroupItem value="false" id={`r-false`}/><Label htmlFor="r-false">关闭</Label></div>
    </RadioGroup>
);

const EditUserGroupPage = () => {
    const { levelId } = useParams<{ levelId: string }>();
    const [permissions, setPermissions] = useState<UserGroupPermissions | null>(null);
    const { toast } = useToast();

    const fetchPermissions = useCallback(async () => {
        if (!levelId) return;
        try {
            const data = await apiClient.get<UserGroupPermissions>(`/admin/groups/${levelId}/permissions`);
            setPermissions(data);
        } catch (error) { console.error("Failed to fetch permissions", error); }
    }, [levelId]);
    
    useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

    const handlePermissionChange = (field: keyof UserGroupPermissions, value: any) => {
        setPermissions(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSubmit = async () => {
        if (!permissions) return;
        try {
            await apiClient.put(`/admin/groups/${permissions.level_id}/permissions`, permissions);
            toast({ title: "成功", description: "用户组权限已保存。" });
        } catch (error: any) {
            toast({ title: "错误", description: `保存失败: ${error.message}`, variant: "destructive" });
        }
    };
    
    if (!permissions) return <AdminLayout><p>正在加载...</p></AdminLayout>;

    return (
        <AdminLayout>
             <div className="bg-white p-6 border rounded-sm shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
                    <h1 className="text-xl font-bold text-gray-800">编辑用户组权限</h1>
                    <Link to="/admin/groups" className="text-sm text-blue-600 hover:underline">返回上一级</Link>
                </div>
                <div className="flex border-b border-gray-300 text-sm">
                    <div className="border-b-2 border-[#336699] px-4 py-2 text-[#336699] font-bold -mb-px">基本权限</div>
                    <div className="px-4 py-2 text-gray-500 cursor-pointer hover:text-gray-800">论坛权限</div>
                </div>
                <table className="w-full mt-4">
                    <tbody>
                        <PermissionRow label="站点访问"><RadioPermission value={permissions.can_visit} onValueChange={v => handlePermissionChange('can_visit', v)} /></PermissionRow>
                        <PermissionRow label="查看用户 IP"><RadioPermission value={permissions.can_view_ip} onValueChange={v => handlePermissionChange('can_view_ip', v)} /></PermissionRow>
                        <PermissionRow label="发送消息"><RadioPermission value={permissions.can_send_message} onValueChange={v => handlePermissionChange('can_send_message', v)} /></PermissionRow>
                        <PermissionRow label="每日发送消息条数" description="0或留空为不限制">
                            <Input type="number" value={permissions.daily_message_limit} onChange={e => handlePermissionChange('daily_message_limit', parseInt(e.target.value))} className="w-24" />
                        </PermissionRow>
                    </tbody>
                </table>
                 <div className="mt-6">
                    <Button onClick={handleSubmit}>提交</Button>
                </div>
             </div>
        </AdminLayout>
    );
};

export default EditUserGroupPage;
