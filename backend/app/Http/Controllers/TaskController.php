<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'teacher') {
            return Task::where('teacher_id', $user->id)->orderBy('created_at', 'desc')->get();
        }
        // Students see all active tasks
        return Task::with('teacher:id,name')->orderBy('deadline', 'asc')->get();
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'teacher' && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'required|date'
        ]);

        $task = Task::create([
            'teacher_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'deadline' => $validated['deadline']
        ]);

        return response()->json($task, 201);
    }

    public function show(Task $task)
    {
        return $task->load('teacher:id,name');
    }
}
