import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import CharacterDetailPage from '../modules/characters/CharacterDetailPage';
import CharactersPage from '../modules/characters/CharactersPage';
import NotFoundPage from '../modules/common/NotFoundPage';
import Home from '../modules/home/Home';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/characters/:slug" element={<CharacterDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
