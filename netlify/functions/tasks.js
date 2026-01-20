const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

async function authenticateApiKey(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Use: Bearer <your-api-key>', status: 401 };
  }

  const apiKey = authHeader.split('Bearer ')[1];
  
  if (!apiKey || apiKey.length < 10) {
    return { error: 'Invalid API key format', status: 401 };
  }

  try {
    const keyDoc = await db.collection('apiKeys').doc(apiKey).get();
    
    if (keyDoc.exists) {
      const userId = keyDoc.data().userId;
      return { userId };
    }

    return { error: 'Invalid API key', status: 401 };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const auth = await authenticateApiKey(event.headers.authorization || event.headers.Authorization);
  if (auth.error) {
    return {
      statusCode: auth.status,
      headers,
      body: JSON.stringify({ error: auth.error }),
    };
  }

  const userId = auth.userId;
  const path = event.path.replace('/.netlify/functions/tasks', '').replace('/api/tasks', '');
  const taskId = path.replace('/', '') || null;
  const method = event.httpMethod;

  try {
    if (method === 'GET' && !taskId) {
      const params = event.queryStringParameters || {};
      const orderBy = params.order_by || 'created_at';
      const orderDir = params.order_dir || 'desc';
      const search = params.q?.toLowerCase().trim();
      const quadrant = params.quadrant;
      const status = params.status || 'active';
      
      let limit = null;
      let offset = 0;
      
      if (params.limit) {
        limit = Math.min(Math.max(parseInt(params.limit) || 50, 1), 100);
        if (params.offset) {
          offset = Math.max(parseInt(params.offset) || 0, 0);
        } else if (params.page) {
          const page = Math.max(parseInt(params.page) || 1, 1);
          offset = (page - 1) * limit;
        }
      } else if (params.size) {
        limit = Math.min(Math.max(parseInt(params.size) || 50, 1), 100);
        const page = Math.max(parseInt(params.page) || 1, 1);
        offset = (page - 1) * limit;
      }

      const tasksRef = db.collection('users').doc(userId).collection('tasks');
      let query = tasksRef;

      if (status === 'done') {
        query = query.where('status', '==', 'active').where('done', '==', true);
      } else if (status === 'active') {
        query = query.where('status', '==', 'active').where('done', '==', false);
      } else {
        query = query.where('status', '==', status);
      }

      const quadrantMap = {
        'UI': { important: true, urgent: true },
        'NUI': { important: true, urgent: false },
        'UNI': { important: false, urgent: true },
        'NUNI': { important: false, urgent: false },
      };

      if (quadrant && quadrantMap[quadrant.toUpperCase()]) {
        const q = quadrantMap[quadrant.toUpperCase()];
        query = query
          .where('important', '==', q.important)
          .where('urgent', '==', q.urgent);
      }

      const snapshot = await query.get();
      
      let tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        const quadrantCode = data.urgent && data.important ? 'UI'
          : !data.urgent && data.important ? 'NUI'
          : data.urgent && !data.important ? 'UNI'
          : 'NUNI';
        return {
          id: doc.id,
          ...data,
          quadrant: quadrantCode,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
      });

      if (search) {
        tasks = tasks.filter(task => 
          task.title?.toLowerCase().includes(search) || 
          task.description?.toLowerCase().includes(search)
        );
      }

      const quadrantOrder = { 'UI': 0, 'NUI': 1, 'UNI': 2, 'NUNI': 3 };
      const isDesc = orderDir === 'desc';
      
      tasks.sort((a, b) => {
        let result = 0;
        switch (orderBy) {
          case 'created_at':
            result = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            break;
          case 'updated_at':
            result = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
            break;
          case 'due_date':
            if (!a.dueDate && !b.dueDate) result = 0;
            else if (!a.dueDate) result = 1;
            else if (!b.dueDate) result = -1;
            else result = new Date(a.dueDate) - new Date(b.dueDate);
            break;
          case 'quadrant':
            result = quadrantOrder[a.quadrant] - quadrantOrder[b.quadrant];
            break;
          case 'title':
            result = (a.title || '').localeCompare(b.title || '');
            break;
          default:
            result = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        return isDesc ? -result : result;
      });

      const total = tasks.length;
      
      if (limit) {
        tasks = tasks.slice(offset, offset + limit);
      }

      const response = { tasks, total };
      
      if (limit) {
        response.pagination = {
          limit,
          offset,
          returned: tasks.length,
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    if (method === 'GET' && taskId) {
      const taskDoc = await db.collection('users').doc(userId).collection('tasks').doc(taskId).get();
      
      if (!taskDoc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: taskDoc.id, ...taskDoc.data() }),
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { title, description, dueDate, priority, important, urgent } = body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Title is required' }),
        };
      }

      const taskData = {
        title: title.trim(),
        description: description?.trim() || '',
        dueDate: dueDate || '',
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        important: Boolean(important),
        urgent: Boolean(urgent),
        done: false,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('users').doc(userId).collection('tasks').add(taskData);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          id: docRef.id, 
          ...taskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    if (method === 'PUT' && taskId) {
      const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const { title, description, dueDate, priority, important, urgent, done, status } = body;

      const updates = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (title !== undefined) updates.title = String(title).trim();
      if (description !== undefined) updates.description = String(description).trim();
      if (dueDate !== undefined) updates.dueDate = dueDate;
      if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) updates.priority = priority;
      if (important !== undefined) updates.important = Boolean(important);
      if (urgent !== undefined) updates.urgent = Boolean(urgent);
      if (done !== undefined) updates.done = Boolean(done);
      if (status !== undefined && ['active', 'archived', 'deleted'].includes(status)) updates.status = status;

      await taskRef.update(updates);
      const updatedDoc = await taskRef.get();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }),
      };
    }

    if (method === 'DELETE' && taskId) {
      const permanent = event.queryStringParameters?.permanent === 'true';
      const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' }),
        };
      }

      if (permanent) {
        await taskRef.delete();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Task permanently deleted', id: taskId }),
        };
      } else {
        await taskRef.update({
          status: 'deleted',
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Task moved to trash', id: taskId }),
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
