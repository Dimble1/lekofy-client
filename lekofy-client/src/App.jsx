import Home from './pages/Home';
import { APIDebug } from './components/APIDebug';
import { useRouter } from './context/RouterContext.jsx';
import './App.css';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CreateAd from './pages/CreateAd.jsx';
import AddCar from './pages/AddCar.jsx';
import PublishAd from './pages/PublishAd.jsx';
import AdDetail from './pages/AdDetail.jsx';
import Favorites from './pages/Favorites.jsx';
import ChatList from './pages/ChatList.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import Notifications from './pages/Notifications.jsx';
import MyAds from './pages/MyAds.jsx';
import Navbar from './components/Navbar.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  const { page, params } = useRouter();
  const isAuthPage = page === 'login' || page === 'register';

  let content = null;
  if (page === 'login') content = <Login />;
  else if (page === 'register') content = <Register />;
  else if (page === 'create-ad') content = <CreateAd />;
  else if (page === 'publish') content = <PublishAd />;
  else if (page === 'add-car') content = <AddCar />;
  else if (page === 'ad-detail') content = <AdDetail adId={params?.id} />;
  else if (page === 'favorites') content = <Favorites />;
  else if (page === 'chat') {
    content = (
      <ChatList
        initialChatId={params?.chatId}
        initialTitle={params?.title}
        initialProfileUserId={params?.profileUserId}
        initialProfileName={params?.profileName}
      />
    );
  }
  else if (page === 'my-ads') content = <MyAds />;
  else if (page === 'chat-window') {
    content = (
      <ChatList
        initialChatId={params?.chatId}
        initialTitle={params?.title}
        initialProfileUserId={params?.profileUserId}
        initialProfileName={params?.profileName}
      />
    );
  }
  else if (page === 'profile') content = <Profile userId={params?.userId} />;
  else if (page === 'notifications') content = <Notifications />;
  else if (page === 'admin') content = <Admin />;
  else if (page === 'settings') content = <Settings />;
  else content = <Home />;

  return (
    <>
      {!isAuthPage && <Navbar />}
      {content}
      {!isAuthPage && <APIDebug />}
    </>
  );
}

export default App;

