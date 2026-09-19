import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import lockfile from "proper-lockfile";
const directory = () => process.env.DATA_DIR || path.join(process.cwd(), "data");

/** Never reset real submissions on corruption or permission errors. */
export async function readStore<T>(name: string, empty: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(path.join(directory(), name), "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty; throw error; }
}

/** Filesystem locking and atomic rename protect concurrent route workers. */
export async function changeStore<T, R>(name: string, empty: T, mutate: (data: T) => R): Promise<R> {
  await fs.mkdir(directory(), { recursive: true, mode: 0o700 });
  const filename = path.join(directory(), name);
  const release = await lockfile.lock(filename, { realpath: false, stale: 10000, retries: { retries: 40, minTimeout: 25, maxTimeout: 100 } });
  let temporary: string | undefined;
  try {
    const data = await readStore(name, empty);
    const result = mutate(data);
    temporary = `${filename}.${randomUUID()}.tmp`;
    const handle = await fs.open(temporary, "wx", 0o600);
    try { await handle.writeFile(JSON.stringify(data, null, 2)); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary, filename);
    temporary = undefined;
    return result;
  } finally {
    if (temporary) await fs.unlink(temporary).catch(() => undefined);
    await release();
  }
}
