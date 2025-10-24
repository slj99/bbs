import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const mainNavItems = [
    { href: '/admin/dashboard', label: '首页' },
    // { href: '/admin/settings', label: '全局' },
    { href: '/admin/setting', label: '论坛设置' },
    { href: '/admin/users', label: '用户' },
    { href: '/admin/content/threads', label: '内容' },
  ];

  // 根据当前路径判断侧边栏显示内容
  const renderSidebarNav = () => {
    if (location.pathname.startsWith('/admin/setting')) {
      return (
        <ul>
          <li><Link to="/admin/setting" className={`block py-1 px-4 text-xs hover:bg-gray-200 ${location.pathname === '/admin/setting' ? '' : 'text-gray-700'}`}>站点信息</Link></li>
          <li><Link to="/admin/setting/nodes" className={`block py-1 px-4 text-xs hover:bg-gray-200 ${location.pathname === '/admin/setting/nodes' ? '' : 'text-gray-700'}`}>版块管理</Link></li>
          <li><Link to="/admin/setting/registration" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">注册设置</Link></li>
        </ul>
      );
    }
    if (location.pathname.startsWith('/admin/users')) {
      return (
        <ul>
          <li><Link to="/admin/users" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">用户管理</Link></li>
          <li><Link to="/admin/users/groups" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">用户组</Link></li>
        </ul>
      );
    }
    if (location.pathname.startsWith('/admin/content')) {
      return (
        <ul>
          <li><Link to="/admin/content/threads" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">帖子管理</Link></li>
          <li><Link to="/admin/content/replies" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">回帖管理</Link></li>
        </ul>
      );
    }
    return (
      <ul>
        <li><Link to="/admin/dashboard" className="block py-1 px-4 text-xs text-gray-700 hover:bg-gray-200">系统信息</Link></li>
      </ul>
    );
  }


  return (
    <div className="flex h-screen bg-[#f3f3f3] font-sans">
      {/* 顶部导航栏 */}
      <header className="absolute top-0 left-0 right-0 h-[46px] bg-[#235179] text-white flex items-center justify-between px-4 z-20">
        <div className="flex items-center">
          <h1 className="text-[16px] font-bold mr-7">ServerlessDiscuz!</h1>
          <nav className="flex items-center space-x-2">
            {mainNavItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-2 py-1 text-[12px] rounded-sm hover:text-white ${location.pathname.startsWith(item.href) ? ' text-white font-bold ' : ' text-[#b5d4ea] '}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4 text-xs text-[#b5d4ea]">
          <a href='/' target='_blank' className="bg-[#446d91] text-[#b5d4ea] hover:no-underline hover:text-white px-2 py-[3px]">前台首页</a>
          <span>管理员: admin</span>
          <button onClick={handleLogout} className="flex items-center space-x-1 hover:underline">
            <span>[注销]</span>
          </button>
        </div>
      </header>

      <div className="flex w-full pt-14">
        {/* 左侧导航栏 */}
        <aside className="w-44 shrink-0 bg-[#F5F5F5] border-r border-gray-200 flex flex-col pt-4">
          <div className="px-4 pb-2 border-b">
            <h2 className="text-base font-bold text-gray-800">后台管理</h2>
          </div>
          <nav className="flex-grow pt-2">
            {renderSidebarNav()}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
