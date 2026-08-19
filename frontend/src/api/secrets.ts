const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

export interface CreateSecretResponse {
  id: string;
  expiresAt: string | null;
}

export class SecretApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ?? 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}

export async function createSecret(
  password: string,
  expiresInMinutes?: number,
): Promise<CreateSecretResponse> {
  const res = await fetch(`${API_BASE}/secrets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, expiresInMinutes }),
  });
  if (!res.ok) {
    throw new SecretApiError(res.status, await parseErrorMessage(res));
  }
  return res.json();
}

export async function consumeSecret(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/secrets/${id}`);
  if (!res.ok) {
    throw new SecretApiError(res.status, await parseErrorMessage(res));
  }
  const body = await res.json();
  return body.password;
}
