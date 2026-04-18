export default function AcademicsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage academic years, terms, and curriculum</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/sms/academic-years" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Academic Years</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Manage school years</p>
        </a>
        <a href="/sms/terms" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Terms</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Configure terms/semesters</p>
        </a>
        <a href="/sms/classes" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Classes</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Manage classes and sections</p>
        </a>
        <a href="/sms/subjects" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Subjects</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Configure subjects per class</p>
        </a>
        <a href="/school/exams" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Grading Scales</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Configure grading criteria</p>
        </a>
        <a href="/school/timetable" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Timetable</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Manage class schedules</p>
        </a>
        <a href="/school/promotions" className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Promotions</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Bulk promote students to next class</p>
        </a>
      </div>
    </div>
  );
}
