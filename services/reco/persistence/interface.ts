export interface PersistenceAdapter<T extends { id?: string }> {
  save(data: T): Promise<string>;
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
}
