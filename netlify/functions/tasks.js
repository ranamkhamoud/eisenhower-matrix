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
      const sort = params.sort || 'date_desc';
      const search = params.q?.toLowerCase().trim();
      const quadrant = params.quadrant;
      const status = params.status || 'active';

      const tasksRef = db.collection('users').doc(userId).collection('tasks');
      let query = tasksRef;

      if (status === 'done') {
        query = query.where('status', '==', 'active').where('done', '==', true);
      } else if (status === 'active') {
        query = query.where('status', '==', 'active').where('done', '==', false);
      } else {
        query = query.where('status', '==', status);
      }

      if (quadrant) {
        const quadrantMap = {
          'do-first': { important: true, urgent: true },
          'schedule': { important: true, urgent: false },
          'delegate': { important: false, urgent: true },
          'eliminate': { important: false, urgent: false },
        };
        if (quadrantMap[quadrant]) {
          query = query
            .where('important', '==', quadrantMap[quadrant].important)
            .where('urgent', '==', quadrantMap[quadrant].urgent);
        }
      }

      const snapshot = await query.get();
      
      let tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        const quadrantName = data.important && data.urgent ? 'do-first'
          : data.important && !data.urgent ? 'schedule'
          : !data.important && data.urgent ? 'delegate'
          : 'eliminate';
        return {
          id: doc.id,
          ...data,
          quadrant: quadrantName,
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

      const quadrantOrder = { 'do-first': 0, 'schedule': 1, 'delegate': 2, 'eliminate': 3 };
      
      tasks.sort((a, b) => {
        switch (sort) {
          case 'date':
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          case 'date_desc':
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          case 'due':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
          case 'quadrant':
            return quadrantOrder[a.quadrant] - quadrantOrder[b.quadrant];
          default:
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tasks, count: tasks.length }),
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
