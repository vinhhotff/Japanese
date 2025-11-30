import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardNew from './components/DashboardNew.v2';
import CourseList from './components/CourseList';
import AllCourses from './components/AllCourses';
import LessonListNew from './components/LessonListNew';
import LessonDetail from './components/LessonDetail';
import Dictionary from './components/Dictionary';
import AllDictionary from './components/AllDictionary';
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
import AIRoleplayCSSOnly from './components/AIRoleplayCSSOnly';
import AssignmentList from './components/AssignmentList';
import AssignmentDetail from './components/AssignmentDetail';
import GradingInterface from './components/GradingInterface';
import './styles/theme-variables.css';
import './styles/custom-theme.css';
import './styles/modern-effects.css';
import './styles/dark-mode-fixes.css';
import './styles/ai-roleplay-css.css';
import './styles/ai-roleplay-simple-fix.css';
import './styles/dashboard-v2.css';
import './styles/assignments.css';
import './styles/grading.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Layout>
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<DashboardNew />} />
                  
                  {/* Japanese Learning Routes */}
                  <Route path="/japanese/courses" element={<CourseList language="japanese" />} />
                  <Route path="/japanese/courses/:level" element={<LessonListNew language="japanese" />} />
                  <Route path="/japanese/lessons/:lessonId" element={<LessonDetail language="japanese" />} />
                  <Route path="/japanese/dictionary" element={<Dictionary language="japanese" />} />
                  <Route path="/japanese/saved-words" element={<SavedWords language="japanese" />} />
                  <Route path="/japanese/vocabulary-practice" element={<VocabularyPractice language="japanese" />} />
                  <Route path="/japanese/kanji-writing" element={<KanjiWritingPractice language="japanese" />} />
                  <Route path="/japanese/spaced-repetition" element={<SpacedRepetition language="japanese" />} />
                  
                  {/* Chinese Learning Routes */}
                  <Route path="/chinese/courses" element={<CourseList language="chinese" />} />
                  <Route path="/chinese/courses/:level" element={<LessonListNew language="chinese" />} />
                  <Route path="/chinese/lessons/:lessonId" element={<LessonDetail language="chinese" />} />
                  <Route path="/chinese/dictionary" element={<Dictionary language="chinese" />} />
                  <Route path="/chinese/saved-words" element={<SavedWords language="chinese" />} />
                  <Route path="/chinese/vocabulary-practice" element={<VocabularyPractice language="chinese" />} />
                  <Route path="/chinese/hanzi-writing" element={<KanjiWritingPractice language="chinese" />} />
                  <Route path="/chinese/spaced-repetition" element={<SpacedRepetition language="chinese" />} />
                  
                  {/* Shared Routes */}
                  <Route path="/study-progress" element={<StudyProgress />} />
                  <Route path="/ai-conversation" element={<AIConversation />} />
                  <Route path="/ai-roleplay" element={<AIRoleplayCSSOnly />} />
                  <Route path="/voice-recorder" element={<VoiceRecorder />} />
                  
                  {/* Assignment Routes */}
                  <Route path="/assignments" element={<AssignmentList />} />
                  <Route path="/assignments/:assignmentId" element={<AssignmentDetail />} />
                  <Route path="/my-assignments" element={<AssignmentList />} />
                  <Route path="/admin/grading/:submissionId" element={<GradingInterface />} />
                  
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Legacy redirects for backward compatibility */}
                  <Route path="/courses" element={<AllCourses />} />
                  <Route path="/courses/:level" element={<LessonListNew language="japanese" />} />
                  <Route path="/lessons/:lessonId" element={<LessonDetail language="japanese" />} />
                  <Route path="/dictionary" element={<AllDictionary />} />
                  <Route path="/saved-words" element={<SavedWords language="japanese" />} />
                  <Route path="/vocabulary-practice" element={<VocabularyPractice language="japanese" />} />
                  <Route path="/kanji-writing" element={<KanjiWritingPractice language="japanese" />} />
                  <Route path="/spaced-repetition" element={<SpacedRepetition language="japanese" />} />
                </Routes>
              </Layout>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

