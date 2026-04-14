import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        message,
        details,
      },
    },
    { status },
  );
}

export function notFound(message = "Recurso nao encontrado.") {
  return NextResponse.json(
    { error: { message } },
    { status: 404 },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail(422, "Dados invalidos.", error.flatten());
  }

  if (error instanceof Error) {
    return fail(500, error.message);
  }

  return fail(500, "Erro inesperado.");
}
