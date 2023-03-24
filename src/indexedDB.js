import { openDB } from "idb";

const dbName = "eisenhowerMatrix";
const storeName = "tasks";

export async function openDatabase() {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}
export async function getTasks(db) {
  return db.getAll(storeName);
}

export async function addTask(db, task) {
  return db.add(storeName, task);
}

export async function deleteTask(db, id) {
  return db.delete(storeName, id);
}

export async function updateTask(db, id, task) {
  return db.put(storeName, task);
}

