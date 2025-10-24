import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // 注册 Passkey
  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      // 1. 从后端获取注册选项 (challenge)
      const regOptions = await apiClient.post('/auth/register/challenge', { username, email }) as any;

      // 2. 使用浏览器 API 创建凭证
      const attestation = await startRegistration(regOptions);

      // 3. 将结果发送到后端进行验证
      const verificationResponse = await apiClient.post<{ verified: boolean, token: string }>(
        '/auth/register/verify',
        { userId: regOptions.user.id, response: attestation }
      );

      if (verificationResponse.verified && verificationResponse.token) {
        toast({ title: "注册成功", description: "您已成功注册并登录。" });
        login(verificationResponse.token);
        navigate('/');
      } else {
        throw new Error('Passkey verification failed.');
      }
    } catch (error) {
      toast({ title: "注册失败", description: `${error}`, variant: "destructive" });
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  // 登录 Passkey
  const handleLogin = async () => {
    try {
      setIsSigning(true);
      // 1. 从后端获取认证选项
      const authOptions = await apiClient.post('/auth/login/challenge', {}) as any;

      // 2. 使用浏览器 API 获取断言
      const assertion = await startAuthentication(authOptions);

      // 3. 将结果发送到后端进行验证
      const verificationResponse = await apiClient.post<{ verified: boolean, token: string }>(
        '/auth/login/verify',
        assertion
      );

      if (verificationResponse.verified && verificationResponse.token) {
        setIsSigning(false);
        toast({ title: "登录成功", description: "欢迎回来！" });
        login(verificationResponse.token);
        navigate('/');
      } else {
        setIsSigning(false);
        throw new Error('Login verification failed.');
      }

    } catch (error) {
      setIsSigning(false);
      toast({ title: "登录失败", description: `${error}`, variant: "destructive" });
      console.error(error);
    }
  };

  return (
    <table>
      <tbody>
        <tr>
          <td className='border-r border-r-[#ccc] pr-4 text-center'>
            <Button onClick={handleLogin} variant="default" className='rounded-[3px] px-2 h-[24px] text-xs'>
              {isSigning ? '登录中...' : 'Passkey 登录'}
            </Button>
          </td>
          <td><Label className='font-normal text-xs pl-4' htmlFor="username">用户名</Label></td>
          <td><Input className='h-[23px] w-[140px] text-[13px] px-[5px] focus:border-[#000] border-t-[#848484] border-r-[#E0E0E0] border-b-[#E0E0E0] border-l-[#848484]' style={{ boxShadow: 'inset 0 1px 1px #848484' }} id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="输入您的用户名" /></td>
          <td>
            <div className="flex">
              <Input type="checkbox" id="ls_cookietime" className='w-[14px] h-[14px]'></Input>
              <Label htmlFor="ls_cookietime" className='inline-block font-normal text-xs ml-1'>自动登录</Label>
            </div>
          </td>
        </tr>
        <tr>
          <td className='text-center text-gray-400 border-r border-r-[#ccc] pr-4'>只需一步，快速开始</td>
          <td><Label className='font-normal text-xs pl-4' htmlFor="email">E-mail</Label></td>
          <td><Input className='h-[23px] w-[140px] text-[13px] px-[5px] focus:border-[#000] border-t-[#848484] border-r-[#E0E0E0] border-b-[#E0E0E0] border-l-[#848484]' style={{ boxShadow: 'inset 0 1px 1px #848484' }}  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="输入您的邮箱" /></td>
          <td>
            <Button onClick={handleRegister} variant="outline" className='w-[84px] h-[23px] text-xs border-[#999] rounded-none' style={{background: 'linear-gradient(0, #e2e2e2, #fcfdfd)'}} disabled={!username || !email || isRegistering}>
              {isRegistering ? '注册中...' : 'Passkey 注册'}
            </Button>
          </td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
