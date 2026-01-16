const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
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

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// Authenticate API key and return userId
async function authenticateApiKey(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Use: Bearer <your-api-key>', status: 401 };
  }

  const apiKey = authHeader.split('Bearer ')[1];
  
  if (!apiKey || apiKey.length < 10) {
    return { error: 'Invalid API key format', status: 401 };
  }

  try {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    console.log(`Found ${usersSnapshot.docs.length} users to check`);
    
    for (const userDoc of usersSnapshot.docs) {
      const settingsDoc = await db.doc(`users/${userDoc.id}/settings/api`).get();
      console.log(`User ${userDoc.id}: settings exists = ${settingsDoc.exists}`);
      
      if (settingsDoc.exists) {
        const storedKey = settingsDoc.data().apiKey;
        console.log(`Comparing keys: stored=${storedKey?.substring(0,10)}... input=${apiKey?.substring(0,10)}...`);
        
        if (storedKey === apiKey) {
          console.log(`API key matched for user ${userDoc.id}`);
          return { userId: userDoc.id };
        }
      }
    }

    console.log('No matching API key found');
    return { error: 'Invalid API key', status: 401 };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

// Main handler
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Authenticate
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
    // GET /tasks - List all tasks
    if (method === 'GET' && !taskId) {
      const tasksRef = db.collection('users').doc(userId).collection('tasks');
      const snapshot = await tasksRef.where('status', '==', 'active').get();
      
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tasks, count: tasks.length }),
      };
    }

    // GET /tasks/:id - Get specific task
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

    // POST /tasks - Create task
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

    // PUT /tasks/:id - Update task
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

    // DELETE /tasks/:id - Delete task
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

    // Method not allowed
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
