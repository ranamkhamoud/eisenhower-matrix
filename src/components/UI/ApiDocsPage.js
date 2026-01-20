import React from 'react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const endpoints = [
  {
    method: 'GET',
    path: '/api/tasks',
    description: 'List tasks with sorting and search',
    queryParams: {
      sort: '"date" | "date_desc" | "due" | "quadrant"',
      q: 'string (search in title/description)',
      quadrant: '"do-first" | "schedule" | "delegate" | "eliminate"',
      status: '"active" | "done" | "archived" | "deleted"',
    },
    example: {
      request: `curl -X GET "https://tallytasks.netlify.app/api/tasks?sort=quadrant&q=meeting" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "tasks": [
    {
      "id": "abc123",
      "title": "Team meeting",
      "description": "Weekly sync",
      "important": true,
      "urgent": true,
      "done": false,
      "quadrant": "do-first",
      "createdAt": "2026-01-20T10:00:00.000Z"
    }
  ],
  "count": 1
}`
    }
  },
  {
    method: 'GET',
    path: '/api/tasks/:id',
    description: 'Get a specific task by ID',
    example: {
      request: `curl -X GET "https://tallytasks.netlify.app/api/tasks/TASK_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "id": "abc123",
  "title": "My Task",
  "description": "Task description",
  "important": true,
  "urgent": false,
  "done": false,
  "priority": "high",
  "status": "active"
}`
    }
  },
  {
    method: 'POST',
    path: '/api/tasks',
    description: 'Create a new task',
    body: {
      title: 'string (required)',
      description: 'string',
      important: 'boolean',
      urgent: 'boolean',
      priority: '"low" | "medium" | "high"',
      dueDate: 'string (YYYY-MM-DD)'
    },
    example: {
      request: `curl -X POST "https://tallytasks.netlify.app/api/tasks" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New Task","important":true,"urgent":false}'`,
      response: `{
  "id": "xyz789",
  "title": "New Task",
  "important": true,
  "urgent": false,
  "done": false,
  "priority": "medium",
  "status": "active"
}`
    }
  },
  {
    method: 'PUT',
    path: '/api/tasks/:id',
    description: 'Update an existing task',
    body: {
      title: 'string',
      description: 'string',
      important: 'boolean',
      urgent: 'boolean',
      done: 'boolean',
      priority: '"low" | "medium" | "high"',
      dueDate: 'string',
      status: '"active" | "archived" | "deleted"'
    },
    example: {
      request: `curl -X PUT "https://tallytasks.netlify.app/api/tasks/TASK_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"done":true}'`,
      response: `{
  "id": "abc123",
  "title": "My Task",
  "done": true,
  ...
}`
    }
  },
  {
    method: 'DELETE',
    path: '/api/tasks/:id',
    description: 'Move task to trash',
    example: {
      request: `curl -X DELETE "https://tallytasks.netlify.app/api/tasks/TASK_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "message": "Task moved to trash",
  "id": "abc123"
}`
    }
  },
  {
    method: 'DELETE',
    path: '/api/tasks/:id?permanent=true',
    description: 'Permanently delete task',
    example: {
      request: `curl -X DELETE "https://tallytasks.netlify.app/api/tasks/TASK_ID?permanent=true" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "message": "Task permanently deleted",
  "id": "abc123"
}`
    }
  }
];

const methodColors = {
  GET: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
  POST: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  PUT: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  DELETE: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
};

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {label && (
        <div className="text-xs font-medium text-slate-500 dark:text-white/50 mb-1">{label}</div>
      )}
      <div className="bg-slate-900 dark:bg-black/40 rounded-lg p-3 overflow-x-auto">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
}

export default function ApiDocsPage({ onBack }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to App
        </button>

        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-slate-600 dark:text-white/70 mb-8">
        </p>

        <div className="mb-8 p-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication</h2>
          <p className="text-sm text-slate-600 dark:text-white/70 mb-3">
            All requests require an API key in the Authorization header:
          </p>
          <CodeBlock code="Authorization: Bearer YOUR_API_KEY" />
        </div>

        <div className="mb-8 p-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Base URL</h2>
          <CodeBlock code="https://tallytasks.netlify.app" />
        </div>

        <h2 className="text-2xl font-bold mb-4">Endpoints</h2>
        
        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className="border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${methodColors[endpoint.method]}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-white/70">{endpoint.description}</p>
              </div>

              <div className="p-4 space-y-4">
                {endpoint.queryParams && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2">Query Parameters</div>
                    <div className="bg-slate-50 dark:bg-white/[0.04] rounded-lg p-3">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(endpoint.queryParams).map(([key, value]) => (
                            <tr key={key} className="border-b border-slate-200 dark:border-white/[0.06] last:border-0">
                              <td className="py-1.5 font-mono text-slate-700 dark:text-white/80">{key}</td>
                              <td className="py-1.5 text-slate-500 dark:text-white/50">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {endpoint.body && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2">Request Body</div>
                    <div className="bg-slate-50 dark:bg-white/[0.04] rounded-lg p-3">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(endpoint.body).map(([key, value]) => (
                            <tr key={key} className="border-b border-slate-200 dark:border-white/[0.06] last:border-0">
                              <td className="py-1.5 font-mono text-slate-700 dark:text-white/80">{key}</td>
                              <td className="py-1.5 text-slate-500 dark:text-white/50">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <CodeBlock code={endpoint.example.request} label="Example Request" />
                <CodeBlock code={endpoint.example.response} label="Example Response" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
