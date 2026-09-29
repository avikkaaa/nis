import {Routes,Route} from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import SubmitPage from './pages/SubmitPage';
import DashboardPage from './pages/DashboardPage';
export default function App(){return <Routes><Route element={<Layout/>}><Route path="/" element={<LandingPage/>}/><Route path="/submit" element={<SubmitPage/>}/><Route path="/dashboard" element={<DashboardPage/>}/></Route></Routes>}