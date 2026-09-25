interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Caché en memoria con TTL y deduplicación de peticiones concurrentes.
 *
 * Es suficiente para respetar el rate limit de las APIs externas sin añadir
 * dependencias. Se reinicia con el proceso, lo cual es aceptable para datos
 * de catálogo que cambian poco.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Evicción FIFO simple para no crecer sin límite.
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Devuelve el valor cacheado o ejecuta el loader una sola vez por clave. */
  async getOrSet(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = loader()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  get size(): number {
    return this.store.size;
  }
}
