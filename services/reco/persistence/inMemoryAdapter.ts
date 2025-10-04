import { PersistenceAdapter } from './interface';
const { v4: uuidv4 } = require('uuid');

export class InMemoryAdapter<T extends { id?: string }> implements PersistenceAdapter<T> {
  private store: Map<string, T> = new Map();

  async save(data: T): Promise<string> {
    const id = data.id || uuidv4();
    data.id = id;
    this.store.set(id, data);
    return id;
  }

  async findById(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.store.values());
  }
}
