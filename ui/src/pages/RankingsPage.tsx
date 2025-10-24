import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';

// --- 类型定义 ---
type NavItem = 'all' | 'users' | 'threads' | 'polls' | 'activities' | 'nodes';
interface RankingItem {
    id: number;
    title: string;
    author_username: string;
}

// --- 子组件 ---

// 左侧导航菜单
const RankingsNav = ({ activeTab, setActiveTab }: { activeTab: NavItem, setActiveTab: (tab: NavItem) => void }) => {
    const navItems: { key: NavItem, label: string }[] = [
        { key: 'all', label: '全部' },
        { key: 'users', label: '用户' },
        { key: 'threads', label: '帖子' },
        { key: 'polls', label: '投票' },
        { key: 'activities', label: '活动' },
        { key: 'nodes', label: '版块' },
    ];
    return (
        <div className="w-40 shrink-0 border-r border-[#E5EDF2] bg-[#E5EDF2]">
            <h2 className="px-3 pt-4 pb-2 text-base font-bold text-gray-800">排行榜</h2>
            <ul className="mt-2">
                {navItems.map(item => (
                    <li key={item.key}>
                        <button onClick={() => setActiveTab(item.key)} className={`w-full text-left px-3 py-2 text-sm ${activeTab === item.key ? 'bg-white font-bold border-t border-t-1 border-b border-b-1 border-[#CDCDCD]' : 'bg-[#E5EDF2] hover:bg-gray-50 border-dashed border-b-1'}`}>{item.label}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// 排行榜列表组件
const RankingList = ({ title, items }: { title: string, items: RankingItem[] }) => (
    <div className="mb-6 border border-[#CDCDCD]">
        <div className="flex justify-between items-center border-b-[#C2D5E3] border-t-[#fff] border-t-2 bg-[#F2F2F2] border-b p-1">
            <h3 className="font-bold text-sm">{title}</h3>
            <a href="#" className="text-xs text-gray-400 hover:underline">更多 &gt;</a>
        </div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs p-3">
            {items.map(item => (
                <li key={item.id} className="flex justify-between">
                    <Link to={`/threads/${item.id}`} className="truncate hover:underline text-gray-700">· {item.title}</Link>
                    <Link to={`/users/${item.author_username}`} className="text-gray-400 hover:underline shrink-0 ml-4">{item.author_username}</Link>
                </li>
            ))}
        </ul>
    </div>
);


// --- 主页面组件 ---
export default function RankingsPage() {
    const [activeTab, setActiveTab] = useState<NavItem>('all');
    const [rankings, setRankings] = useState<{ threads: RankingItem[], polls: RankingItem[] }>({ threads: [], polls: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        apiClient.get<{ threads?: RankingItem[]; polls?: RankingItem[] }>('/rankings')
            .then(data => setRankings({
                threads: Array.isArray(data?.threads) ? data.threads! : [],
                polls: Array.isArray(data?.polls) ? data.polls! : []
            }))
            .catch(err => console.error("Failed to fetch rankings:", err))
            .finally(() => setLoading(false));
    }, []);

    const renderContent = () => {
        if (loading) return <div className="p-6 text-center">正在加载排行榜...</div>
        return (
            <div className="p-6">
                <RankingList title="帖子排行" items={rankings.threads} />
                <RankingList title="投票排行" items={rankings.polls} />
            </div>
        );
    };

    return (
        <div className="max-w-[960px] mx-auto w-full bg-white border border-[#CDCDCD] rounded-sm flex">
            <RankingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
}
