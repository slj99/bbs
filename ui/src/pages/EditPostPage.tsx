import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/RichTextEditor';
import { useToast } from "@/components/ui/use-toast";
import type { ThreadWithDetails, Reply } from '@/../../worker/src/types';

export default function EditPostPage() {
  const { threadId, replyId } = useParams<{ threadId: string; replyId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!threadId) return;
    try {
      if (!replyId) {
        // 主题帖的原始内容从其详情接口获取
        const data = await apiClient.get<ThreadWithDetails>(`/threads/${threadId}`);
        setTitle(data.title);
        setBody(data.body);
      } else {
        // 回复的原始内容需要一个新的API端点来获取
        const data = await apiClient.get<Reply>(`/threads/${threadId}/replies/${replyId}`);
        setBody(data.body);
        // setOriginalThreadId(data.thread_id);
      }
    } catch (error: any) {
      toast({ title: "内容加载失败", description: error.message, variant: "destructive" });
      navigate(-1); // 返回上一页
    } finally {
      setLoading(false);
    }
  }, [threadId, replyId, navigate, toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSubmit = async () => {
    if ((!replyId && !title.trim()) || !body.trim()) {
      toast({ description: "标题和内容不能为空" });
      return;
    }

    try {
      if (!replyId) {
        await apiClient.put(`/threads/${threadId}`, { title, body });
        navigate(`/threads/${threadId}`);
      } else {
        await apiClient.put(`/threads/${threadId}/replies/${replyId}`, { body });
        navigate(`/threads/${threadId}#reply-${replyId}`);
      }
      toast({ title: "成功", description: "内容已更新。" });
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="max-w-[960px] mx-auto text-center py-10">正在加载编辑器...</div>;

  return (
    <div className="max-w-[960px] mx-auto w-full">
      <div className="bg-white p-6 border border-[#CDCDCD] rounded-sm">
        <h1 className="text-xl font-bold mb-6">编辑{!replyId ? '主题' : '回复'}</h1>
        {!replyId && (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" className="h-10 text-lg mb-4" />
        )}
        <RichTextEditor value={body} onChange={setBody} />
        <div className="mt-6 text-center">
          <Button onClick={handleSubmit} className="bg-[#336699] hover:bg-[#2366A8] rounded-sm text-lg px-8 h-10 font-bold">保存更改</Button>
        </div>
      </div>
    </div>
  );
}
