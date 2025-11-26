import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getLessons } from '../services/supabaseService';
import { transformCourseFromDB } from '../utils/dataTransform';
import '../App.css';

const CourseList = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [coursesData, lessonsData] = await Promise.all([
        getCourses(),
        getLessons(),
      ]);

      // Group courses by level
      const coursesByLevel: Record<string, any[]> = {};
      const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1'];

      coursesData.forEach(course => {
        if (!coursesByLevel[course.level]) {
          coursesByLevel[course.level] = [];
        }
        coursesByLevel[course.level].push(course);
      });

      // Transform and group courses by level
      const groupedCourses = levelOrder
        .filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0)
        .map(level => {
          // Get all lessons from all courses of this level
          const allLessons = lessonsData.filter(l => {
            const courseId = l.course_id || l.course?.id;
            return coursesByLevel[level].some(c => c.id === courseId);
          });

          // Combine all courses into one display object
          const firstCourse = coursesByLevel[level][0];
          const totalLessons = allLessons.length;
          const courseTitles = coursesByLevel[level].map(c => c.title).join(', ');

          return {
            level,
            title: coursesByLevel[level].length === 1 
              ? firstCourse.title 
              : `${level} - ${coursesByLevel[level].length} khóa học`,
            description: coursesByLevel[level].length === 1
              ? firstCourse.description || ''
              : `Bao gồm: ${courseTitles}`,
            lessons: allLessons.map((l: any) => ({
              id: l.id,
              title: l.title,
              level: l.level || level,
              lessonNumber: l.lesson_number,
              description: l.description || '',
              vocabulary: [],
              kanji: [],
              grammar: [],
              listening: [],
              speaking: [],
              difficultVocabulary: [],
            })),
            courseCount: coursesByLevel[level].length,
            totalLessons: totalLessons,
          };
        });

      setCourses(groupedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/" className="back-button">
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Về trang chủ
      </Link>
      <div className="header">
        <h1>
          <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Chọn cấp độ JLPT
        </h1>
        <p>Chọn cấp độ phù hợp với trình độ của bạn</p>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có khóa học nào.</p>
        </div>
      ) : (
        <div className="card-grid">
          {courses.map((course) => (
            <Link key={course.level} to={`/courses/${course.level}`}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {course.level}
                  </h2>
                  <span className={`badge badge-${course.level.toLowerCase()}`}>
                    {course.totalLessons || course.lessons.length} bài
                  </span>
                </div>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                  {course.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.6' }}>
                  {course.description}
                </p>
                {course.courseCount > 1 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', fontSize: '0.875rem', color: '#3b82f6', fontWeight: '600' }}>
                    📚 {course.courseCount} khóa học
                  </div>
                )}
                <div style={{ marginTop: '1.25rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Xem bài học
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;

