import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../hooks/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from '@/lib/api';
import defaultAvatar from '@/img/default_avatar.svg';

// 定义菜单项类型
type NavItem = 'avatar' | 'profile' | 'credits' | 'group' | 'privacy' | 'security' | 'binding';

// 左侧导航菜单组件
const SettingsNav = ({ activeTab, setActiveTab }: { activeTab: NavItem, setActiveTab: (tab: NavItem) => void }) => {
    const navItems: { key: NavItem, label: string }[] = [
        { key: 'avatar', label: '修改头像' },
        { key: 'profile', label: '个人资料' },
        { key: 'credits', label: '积分' },
        { key: 'group', label: '用户组' },
        { key: 'privacy', label: '隐私筛选' },
        { key: 'security', label: '密码安全' },
        { key: 'binding', label: 'QQ绑定' },
    ];

    return (
        <div className="w-40 shrink-0 bg-white border-r border-[#E5EDF2]">
            <ul className="py-4">
                {navItems.map(item => (
                    <li key={item.key}>
                        <button
                            onClick={() => setActiveTab(item.key)}
                            className={`w-full text-left px-6 py-2 text-sm ${
                                activeTab === item.key ? 'bg-[#E5EDF2] font-bold' : 'hover:bg-gray-50'
                            }`}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// 头像设置面板 (已更新)
const AvatarPanel = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(user?.avatar ? user.avatar : null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        try {
            await apiClient.postFormData('/users/me/avatar', formData);
            toast({ title: "成功", description: "头像已更新。刷新页面即可查看最新效果。" });
        } catch (error) {
            toast({ title: "错误", description: "头像上传失败。",});
        }
    };

    return (
        <div>
            <h2 className="text-base text-gray-600 mb-4">当前我的头像</h2>
            <div className="flex">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-sm mr-8">
                    <img src={preview || defaultAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="text-base text-gray-600 mb-4">设置我的新头像</h3>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>选择图片</Button>
                    {selectedFile && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-600 mb-2">已选择: {selectedFile.name}</p>
                            <Button onClick={handleUpload} className="bg-[#336699] hover:bg-[#2366A8]">上传并保存</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 个人资料面板
const ProfilePanel = () => {
    const { user } = useAuth();
    if (!user) {
        return <> </>;
    }
    // 辅助组件
    const FormRow = ({ label, children, isPublicSelector = true }: { label: string, children: React.ReactNode, isPublicSelector?: boolean }) => (
        <div className="flex items-center py-3">
            <span className="w-32 text-right text-sm text-gray-600 mr-4">{label}</span>
            <div className="flex-grow">{children}</div>
            {isPublicSelector && (
                <div className="w-24 ml-4">
                    <Select defaultValue="public">
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="public">公开</SelectItem></SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
    
    return (
        <div>
            {/* 资料面板内的标签页 */}
            <div className="flex border-b border-gray-300 text-sm">
                <div className="border-b-2 border-[#336699] px-4 py-2 text-[#336699] font-bold -mb-px">基本资料</div>
                <div className="px-4 py-2 text-gray-500 cursor-pointer hover:text-[#336699]">联系方式</div>
                <div className="px-4 py-2 text-gray-500 cursor-pointer hover:text-[#336699]">个人信息</div>
            </div>
            <div className="mt-6">
                <FormRow label="用户名" isPublicSelector={false}>{user.username}</FormRow>
                <FormRow label="性别">
                     <Select defaultValue="secret">
                        <SelectTrigger className="w-48 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="secret">保密</SelectItem>
                            <SelectItem value="male">男</SelectItem>
                            <SelectItem value="female">女</SelectItem>
                        </SelectContent>
                    </Select>
                </FormRow>
                 <FormRow label="生日">
                    <div className="flex space-x-2">
                        <Input type="text" className="w-24 h-7 text-xs" placeholder="年" />
                        <Input type="text" className="w-16 h-7 text-xs" placeholder="月" />
                        <Input type="text" className="w-16 h-7 text-xs" placeholder="日" />
                    </div>
                </FormRow>
                <FormRow label="个人签名">
                    <Textarea className="text-xs" rows={4} />
                </FormRow>
                <div className="pl-36 pt-4">
                    <Button className="bg-[#336699] hover:bg-[#2366A8] rounded-sm text-sm px-6 h-8 font-bold">保存</Button>
                </div>
            </div>
        </div>
    );
}

// 主设置页面组件
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<NavItem>('avatar');

    const renderContent = () => {
        switch (activeTab) {
            case 'avatar':
                return <AvatarPanel />;
            case 'profile':
                return <ProfilePanel />;
            // 其他面板可以稍后添加
            // case 'credits':
            //     return <div>积分设置</div>;
            default:
                return <div>选择一个设置项</div>;
        }
    };

    return (
        <div className="max-w-[960px] mx-auto w-full bg-white border border-[#CDCDCD] rounded-sm flex">
            <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-grow p-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
                    <h1 className="text-xl font-bold text-gray-800">设置</h1>
                    <a href="#" className="text-xs text-gray-500 hover:underline">返回上一页</a>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
