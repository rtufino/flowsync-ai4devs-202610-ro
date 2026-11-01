const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api/v1";

export type User = {
  id: number;
  fullName: string | null;
  email: string;
  createdAt: string;
  updatedAt: string | null;
  initials: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string | null;
};

type ErrorBody = {
  message?: string;
  errors?: { message: string }[];
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as ErrorBody | null;
    const message =
      error?.errors?.map((item) => item.message).join(". ") ||
      error?.message ||
      "No se pudo completar la solicitud";
    throw new ApiError(response.status, message);
  }

  return (payload as { data: T }).data;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  profile: (token: string) => request<User>("/account/profile", { token }),

  logout: (token: string) =>
    request<unknown>("/account/logout", { method: "POST", token }),
};
