import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './components/Footer';
import Faqs from './components/Faqs';
import MainCard from './components/MainCard';
import './App.css'; 

const App: React.FC = () => {

  return (
    <div className="flex flex-col min-h-screen bg-stone-900 text-white">
      <ToastContainer />
      <div className='flex flex-col justify-center items-center m-2 mt-8 sm:mt-28'>
        <MainCard/>
      </div>
      <Faqs />
      <Footer />
    </div>
  );
};

export default App;