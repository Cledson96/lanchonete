import { ApiError, handleRouteError, ok } from "@/lib/http";
import { normalizeZipCode, optionalTrimmed } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = normalizeZipCode(searchParams.get("zipCode"));

    if (!zipCode || zipCode.length !== 8) {
      throw new ApiError(422, "CEP invalido. Digite os 8 numeros do CEP.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApiError(502, "Nao conseguimos consultar esse CEP agora.");
    }

    const payload = (await response.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      complemento?: string;
    };

    if (payload.erro) {
      throw new ApiError(422, "CEP nao encontrado.");
    }

    return ok({
      zipCode,
      street: payload.logradouro?.trim() || "",
      neighborhood: payload.bairro?.trim() || "",
      city: payload.localidade?.trim() || "",
      state: payload.uf?.trim() || "",
      complement: optionalTrimmed(payload.complemento),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
