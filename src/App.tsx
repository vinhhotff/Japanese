import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardNew from './components/DashboardNew';
import CourseList from './components/CourseList';
import LessonListNew from './components/LessonListNew';
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
import AIConversation from './components/AIConversation';
import VoiceRecorder from './components/VoiceRecorder';
import AIRoleplay from './components/AIRoleplay';
import './styles/theme-variables.css';
import './styles/custom-theme.css';
import './styles/modern-effects.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="app">
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardNew />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:level" element={<LessonListNew />} />
                    <Route path="/lessons/:lessonId" element={<LessonDetail />} />
                    <Route path="/dictionary" element={<Dictionary />} />
                    <Route path="/saved-words" element={<SavedWords />} />
                    <Route path="/vocabulary-practice" element={<VocabularyPractice />} />
                    <Route path="/study-progress" element={<StudyProgress />} />
                    <Route path="/kanji-writing" element={<KanjiWritingPractice />} />
                    <Route path="/spaced-repetition" element={<SpacedRepetition />} />
                    <Route path="/ai-conversation" element={<AIConversation />} />
                    <Route path="/ai-roleplay" element={<AIRoleplay />} />
                    <Route path="/voice-recorder" element={<VoiceRecorder />} />
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
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

