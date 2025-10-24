import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import defaultAvatar from '@/img/default_avatar.svg';

// 定义搜索结果类型
interface SearchResultThread {
    id: number;
    title: string;
    body: string;
    created_at: number;
    author_username: string;
    author_id: number;
    node_name: string;
    node_id: number;
}
interface SearchResultUser {
    id: string;
    username: string;
    avatar?: string;
    level: number;
    thread_count: number;
}

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'threads';

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!q) return;
        setLoading(true);
        apiClient.get<any[]>(`/search?q=${q}&type=${type}`)
            .then(data => setResults(data || []))
            .catch(err => console.error("Search failed", err))
            .finally(() => setLoading(false));
    }, [q, type]);

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim() || !text) return text;
        try {
            const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
            return <>{parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? <strong key={i} className="text-red-500 font-normal">{part}</strong> : part
            )}</>;
        } catch (e) {
            console.error("Highlight regex error:", e);
            return text;
        }
    };

    return (
        <div className="max-w-[960px] mx-auto w-full space-y-4">
            <div className="bg-white border border-[#CDCDCD] rounded-sm p-6">
                <b className="block bg-[#F5F5F5] border-b border-[#ccc] p-2 text-gray-800 mb-6 text-xs">
                    结果: 找到 “<span className="text-red-500">{q}</span>” 相关内容 {results.length} 个
                </b>

                <div className="">
                    {loading && <p className="text-center py-8">正在搜索...</p>}
                    {!loading && results.length === 0 && <p className="text-center py-8">抱歉，没有找到与“{q}”相关的帖子。</p>}
                    
                    {type === 'threads' && results.map((item: SearchResultThread) => (
                        <div key={item.id} className="py-4">
                            <h2 className="text-base mb-1">
                                <Link to={`/threads/${item.id}`} className="text-[#00C] underline">
                                    {highlightText(item.title, q)}
                                </Link>
                            </h2>
                            <p className="text-sm text-gray-600 mb-2">
                                {highlightText(item.body.substring(0, 150) + '...', q)}
                            </p>
                            <p className="text-xs text-[#3A8000]">
                                {format(new Date(item.created_at * 1000), 'yyyy-MM-dd HH:mm')} - 
                                <Link to={`/users/${item.author_id}`} className="text-[#666] mx-1 underline">{item.author_username}</Link>
                                - 
                                <Link to={`/nodes/${item.node_id}`} className="text-[#666] mx-1 underline">{item.node_name}</Link>
                            </p>
                        </div>
                    ))}

                    {type === 'users' && (
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {results.map((item: SearchResultUser) => (
                                <div key={item.id} className="flex items-center space-x-3 p-3 border border-[#E5EDF2] rounded-sm">
                                    <img src={item.avatar ? item.avatar : defaultAvatar} alt={item.username} className="w-12 h-12 rounded" />
                                    <div>
                                        <Link to={`/users/${item.id}`} className="font-bold text-[#336699] hover:underline">{highlightText(item.username, q)}</Link>
                                        <p className="text-xs text-gray-500">主题: {item.thread_count} | 等级: {item.level}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
