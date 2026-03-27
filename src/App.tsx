import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
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
import ClassDetail from './components/ClassDetail';
import SavedWords from './components/SavedWords';
import StudyProgress from './components/StudyProgress';
import Login from './components/Login';
import Register from './components/Register';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import NotebookView from './components/NotebookView';
import VoiceRecorder from './components/VoiceRecorder';
import AssignmentList from './components/AssignmentList';
import AssignmentDetail from './components/AssignmentDetail';
import GradingInterface from './components/GradingInterface';
import AssignmentForm from './components/AssignmentForm';
import './styles/theme-variables.css';
import './styles/custom-theme.css';
import './styles/modern-effects.css';
import './styles/dark-mode-fixes.css';
import './styles/ai-roleplay-css.css';
import './styles/dashboard-v2.css';
import './styles/assignments.css';
import './styles/grading.css';
import './styles/language-themes.css';
import './styles/forum.css';
import './styles/peer-matching.css';
import './App.css';

// Lazy load heavy components for code splitting
const VocabularyPractice = lazy(() => import('./components/VocabularyPractice'));
const KanjiWritingPractice = lazy(() => import('./components/KanjiWritingPractice'));
const SpacedRepetition = lazy(() => import('./components/SpacedRepetition'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const SubmissionList = lazy(() => import('./components/SubmissionList'));
const GradingPage = lazy(() => import('./components/GradingPage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AIConversation = lazy(() => import('./components/AIConversation'));
const Forum = lazy(() => import('./components/Forum'));
const ForumPost = lazy(() => import('./components/ForumPost'));
const PeerMatching = lazy(() => import('./components/PeerMatching'));

// Scroll to top on route change

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

// Loading fallback for lazy components
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid var(--border-color)',
      borderTopColor: 'var(--primary-color)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đang tải...</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <ScrollToTop />
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Home */}
                    <Route path="/" element={<DashboardNew />} />

                    {/* Payment Routes (Public - accessible after returning from PayOS) */}
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />

                    {/* Japanese Learning Routes */}
                    <Route path="/japanese/courses" element={<CourseList language="japanese" />} />
                    <Route path="/japanese/courses/:level" element={<LessonListNew language="japanese" />} />
                    <Route path="/japanese/lessons/:lessonId" element={<LessonDetail language="japanese" />} />
                    <Route path="/japanese/dictionary" element={<Dictionary language="japanese" />} />
                    <Route path="/japanese/saved-words" element={<SavedWords language="japanese" />} />
                    <Route path="/japanese/vocabulary-practice" element={
                      <ProtectedRoute requireEnrollment>
                        <VocabularyPractice language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/japanese/vocabulary-practice/:level" element={
                      <ProtectedRoute requireEnrollment>
                        <VocabularyPractice language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/japanese/kanji-writing" element={
                      <ProtectedRoute requireEnrollment>
                        <KanjiWritingPractice language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/japanese/spaced-repetition" element={
                      <ProtectedRoute requireEnrollment>
                        <SpacedRepetition language="japanese" />
                      </ProtectedRoute>
                    } />

                    {/* Chinese Learning Routes */}
                    <Route path="/chinese/courses" element={<CourseList language="chinese" />} />
                    <Route path="/chinese/courses/:level" element={<LessonListNew language="chinese" />} />
                    <Route path="/chinese/lessons/:lessonId" element={<LessonDetail language="chinese" />} />
                    <Route path="/chinese/dictionary" element={<Dictionary language="chinese" />} />
                    <Route path="/chinese/saved-words" element={<SavedWords language="chinese" />} />
                    <Route path="/chinese/vocabulary-practice" element={
                      <ProtectedRoute requireEnrollment>
                        <VocabularyPractice language="chinese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/chinese/vocabulary-practice/:level" element={
                      <ProtectedRoute requireEnrollment>
                        <VocabularyPractice language="chinese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/chinese/hanzi-writing" element={
                      <ProtectedRoute requireEnrollment>
                        <KanjiWritingPractice language="chinese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/chinese/spaced-repetition" element={
                      <ProtectedRoute requireEnrollment>
                        <SpacedRepetition language="chinese" />
                      </ProtectedRoute>
                    } />

                    {/* Shared Routes */}
                    <Route path="/study-progress" element={<StudyProgress />} />
                    <Route path="/ai-conversation" element={
                      <ProtectedRoute requireEnrollment>
                        <AIConversation />
                      </ProtectedRoute>
                    } />
                    <Route path="/ai-roleplay" element={
                      <ProtectedRoute requireEnrollment>
                        <AIConversation />
                      </ProtectedRoute>
                    } />
                    <Route path="/notebook" element={
                      <ProtectedRoute>
                        <NotebookView />
                      </ProtectedRoute>
                    } />
                    <Route path="/voice-recorder" element={
                      <ProtectedRoute requireEnrollment>
                        <VoiceRecorder />
                      </ProtectedRoute>
                    } />

                    {/* Assignment Routes */}
                    <Route path="/assignments" element={
                      <ProtectedRoute>
                        <AssignmentList />
                      </ProtectedRoute>
                    } />
                    <Route path="/assignments/:assignmentId" element={
                      <ProtectedRoute>
                        <AssignmentDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/homework/:assignmentId" element={
                      <ProtectedRoute>
                        <AssignmentDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-assignments" element={
                      <ProtectedRoute>
                        <AssignmentList />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/assignments/new" element={
                      <ProtectedRoute requireTeacher>
                        <AssignmentForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/assignments/edit/:assignmentId" element={
                      <ProtectedRoute requireTeacher>
                        <AssignmentForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/submissions/:assignmentId" element={
                      <ProtectedRoute requireTeacher>
                        <SubmissionList />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/grading/:submissionId" element={
                      <ProtectedRoute requireTeacher>
                        <GradingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/grading/:submissionId" element={<GradingInterface />} />
                    <Route path="/class/:classId" element={
                      <ProtectedRoute>
                        <ClassDetail />
                      </ProtectedRoute>
                    } />

                    <Route
                      path="/login"
                      element={
                        <PublicRoute>
                          <Login />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicRoute>
                          <Register />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher-dashboard"
                      element={
                        <ProtectedRoute requireTeacher>
                          <TeacherDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy redirects for backward compatibility - Also protected */}
                    <Route path="/courses" element={
                      <ProtectedRoute>
                        <AllCourses />
                      </ProtectedRoute>
                    } />
                    <Route path="/courses/:level" element={
                      <ProtectedRoute>
                        <LessonListNew language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/lessons/:lessonId" element={
                      <ProtectedRoute>
                        <LessonDetail language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/dictionary" element={<AllDictionary />} />
                    <Route path="/saved-words" element={<SavedWords language="japanese" />} />
                    <Route path="/vocabulary-practice" element={
                      <ProtectedRoute requireEnrollment>
                        <VocabularyPractice language="japanese" />
                      </ProtectedRoute>
                    } />
                    <Route path="/kanji-writing" element={
                      <ProtectedRoute requireEnrollment>
                        <KanjiWritingPractice />
                      </ProtectedRoute>
                    } />
                    <Route path="/spaced-repetition" element={
                      <ProtectedRoute requireEnrollment>
                        <SpacedRepetition />
                      </ProtectedRoute>
                    } />

                    {/* Community Routes */}
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/forum/post/:postId" element={<ForumPost />} />
                    <Route path="/forum/category/:categoryId" element={<Forum />} />
                    <Route path="/peer-matching" element={
                      <ProtectedRoute>
                        <PeerMatching />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

