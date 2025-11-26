import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import LessonList from './components/LessonList';
import LessonDetail from './components/LessonDetail';
import Dictionary from './components/Dictionary';
import SavedWords from './components/SavedWords';
import VocabularyPractice from './components/VocabularyPractice';
import StudyProgress from './components/StudyProgress';
import KanjiWritingPractice from './components/KanjiWritingPractice';
import SpacedRepetition from './components/SpacedRepetition';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<CourseList />} />
              <Route path="/courses/:level" element={<LessonList />} />
              <Route path="/lessons/:lessonId" element={<LessonDetail />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/saved-words" element={<SavedWords />} />
              <Route path="/vocabulary-practice" element={<VocabularyPractice />} />
              <Route path="/study-progress" element={<StudyProgress />} />
              <Route path="/kanji-writing" element={<KanjiWritingPractice />} />
              <Route path="/spaced-repetition" element={<SpacedRepetition />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

