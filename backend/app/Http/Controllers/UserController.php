<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Task;
use App\Models\Submission;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List users with submission stats.
     * - Teacher sees all students with their submission count vs total tasks
     * - Admin sees all students AND teachers with their submission count vs total tasks
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $totalTasks = Task::count();

        if ($currentUser->role === 'teacher') {
            // Teacher: show only students
            $students = User::where('role', 'student')
                ->select('id', 'name', 'email', 'student_id', 'employee_id', 'role')
                ->get()
                ->map(function ($user) use ($totalTasks) {
                    $user->submissions_count = Submission::where('student_id', $user->id)
                        ->distinct('task_id')
                        ->count('task_id');
                    $user->total_tasks = $totalTasks;
                    return $user;
                });

            return response()->json(['students' => $students]);

        } elseif ($currentUser->role === 'admin') {
            // Admin: show students and teachers
            $students = User::where('role', 'student')
                ->select('id', 'name', 'email', 'student_id', 'employee_id', 'role')
                ->get()
                ->map(function ($user) use ($totalTasks) {
                    $user->submissions_count = Submission::where('student_id', $user->id)
                        ->distinct('task_id')
                        ->count('task_id');
                    $user->total_tasks = $totalTasks;
                    return $user;
                });

            $teachers = User::where('role', 'teacher')
                ->select('id', 'name', 'email', 'student_id', 'employee_id', 'role')
                ->get()
                ->map(function ($user) {
                    $user->tasks_created = Task::where('teacher_id', $user->id)->count();
                    $user->submissions_received = Submission::where('teacher_id', $user->id)->count();
                    return $user;
                });

            return response()->json([
                'students' => $students,
                'teachers' => $teachers,
            ]);

        } else {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
    }
}
